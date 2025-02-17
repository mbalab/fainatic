import { NextRequest, NextResponse } from 'next/server';
import { parse as csvParse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import pdfParse from 'pdf-parse';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';
import { processFile } from '../utils/serverFileProcessing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper to detect transaction type and assign basic category
const detectCategory = (description: string, amount: number): string => {
  const lowerDesc = description.toLowerCase();

  if (amount > 0) return 'Income';
  if (lowerDesc.includes('salary') || lowerDesc.includes('payroll'))
    return 'Income';
  if (lowerDesc.includes('amazon') || lowerDesc.includes('shop'))
    return 'Shopping';
  if (lowerDesc.includes('uber') || lowerDesc.includes('lyft'))
    return 'Transport';
  if (lowerDesc.includes('restaurant') || lowerDesc.includes('cafe'))
    return 'Food';
  if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify'))
    return 'Entertainment';

  return 'Other';
};

// Process CSV file
const processCSV = async (buffer: Buffer): Promise<Transaction[]> => {
  try {
    logger.debug('Starting CSV processing');
    const content = buffer.toString();

    // Parse CSV with basic settings
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      throw new Error('No records found in CSV file');
    }

    // Process records
    const transactions = records
      .map((record: any) => {
        try {
          const amount = parseFloat(record.amount);
          if (!record.date || isNaN(amount)) return null;

          return {
            date: record.date.toString(),
            amount,
            currency: record.currency,
            counterparty: record.description || record.counterparty || '',
            category: detectCategory(
              record.description || record.counterparty || '',
              amount
            ),
          } as Transaction;
        } catch (error) {
          logger.warn('Skipping invalid record:', record, error);
          return null;
        }
      })
      .filter((t: Transaction | null): t is Transaction => t !== null);

    if (transactions.length === 0) {
      throw new Error('No valid transactions found in CSV file');
    }

    logger.debug('Successfully processed transactions:', transactions.length);
    return transactions;
  } catch (error) {
    logger.error('Error in CSV processing:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to process CSV: ${error.message}`
        : 'Failed to process CSV file'
    );
  }
};

// Process Excel file
const processExcel = async (buffer: Buffer): Promise<Transaction[]> => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Create a readable stream from buffer
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    // Load workbook from stream
    await workbook.xlsx.read(bufferStream);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const transactions: Transaction[] = [];

    // Get header row
    const headers = worksheet.getRow(1).values as string[];
    const dateIndex = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes('date')
    );
    const amountIndex = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes('amount')
    );
    const descriptionIndex = headers.findIndex(
      (h) =>
        h?.toString().toLowerCase().includes('description') ||
        h?.toString().toLowerCase().includes('counterparty')
    );
    const currencyIndex = headers.findIndex((h) =>
      h?.toString().toLowerCase().includes('currency')
    );

    // Process rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      try {
        const values = row.values as any[];
        const date = values[dateIndex];
        const amount = parseFloat(values[amountIndex]);
        const description = values[descriptionIndex]?.toString() || '';
        const currency = values[currencyIndex]?.toString();

        if (date && !isNaN(amount)) {
          transactions.push({
            date: date.toString(),
            amount,
            currency,
            counterparty: description,
            category: detectCategory(description, amount),
          });
        }
      } catch (error) {
        logger.warn('Skipping invalid row:', rowNumber, error);
      }
    });

    if (transactions.length === 0) {
      throw new Error('No valid transactions found in Excel file');
    }

    return transactions;
  } catch (error) {
    logger.error('Error processing Excel file:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to process Excel file: ${error.message}`
        : 'Failed to process Excel file'
    );
  }
};

// Process PDF file
const processPDF = async (buffer: Buffer): Promise<Transaction[]> => {
  try {
    logger.debug('Starting PDF processing');

    // Validate input
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid PDF buffer provided');
    }

    // Check if buffer is a valid PDF (check for PDF magic number)
    if (buffer.slice(0, 5).toString() !== '%PDF-') {
      throw new Error('Invalid PDF format: missing PDF signature');
    }

    // Extract text from PDF
    let data;
    try {
      data = await pdfParse(buffer);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Failed to parse PDF: ${error.message}`
          : 'Failed to parse PDF file'
      );
    }

    const text = data.text;
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    // Extract transactions from text
    const lines = text.split('\n').filter((line) => line.trim());
    const transactions: Transaction[] = [];

    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/;
    const amountRegex = /\$?\s*-?\d+(?:,\d{3})*(?:\.\d{2})?/;
    const currencyRegex = /(?:USD|EUR|GBP|JPY|RUB)/i;

    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      const amountMatch = line.match(amountRegex);
      const currencyMatch = line.match(currencyRegex);

      if (dateMatch && amountMatch) {
        try {
          const amount = parseFloat(amountMatch[0].replace(/[$,]/g, ''));
          if (!isNaN(amount)) {
            transactions.push({
              date: dateMatch[0],
              amount,
              currency: currencyMatch
                ? currencyMatch[0].toUpperCase()
                : undefined,
              counterparty: line.trim(),
              category: detectCategory(line, amount),
            });
          }
        } catch {
          logger.warn('Failed to parse transaction from line:', line);
        }
      }
    }

    if (transactions.length === 0) {
      throw new Error('No valid transactions found in PDF');
    }

    return transactions;
  } catch (error) {
    logger.error('Error processing PDF:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to process PDF: ${error.message}`
        : 'Failed to process PDF file'
    );
  }
};

// Main processing function
const processFile = async (
  buffer: Buffer,
  mimeType: string
): Promise<Transaction[]> => {
  if (!buffer || !(buffer instanceof Buffer)) {
    throw new Error('Invalid file content provided');
  }

  logger.debug('Processing file with mime type:', mimeType);

  try {
    switch (mimeType) {
      case 'text/csv':
        return await processCSV(buffer);
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return await processExcel(buffer);
      case 'application/pdf':
        return await processPDF(buffer);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    logger.debug('Processing file:', file.name, 'type:', file.type);

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const transactions = await processFile(buffer, file.type);
      return NextResponse.json({ transactions });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'File processing failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
