import sharp from 'sharp';
import ExcelJS from 'exceljs';
import { createWorker } from 'tesseract.js';
import { parse as csvParse } from 'csv-parse/sync';
import pdfParse from 'pdf-parse';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';

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
  const content = buffer.toString();
  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((record: any) => ({
    date: record.date,
    amount: parseFloat(record.amount),
    currency: record.currency,
    counterparty: record.description || record.counterparty || '',
    category: detectCategory(
      record.description || record.counterparty || '',
      parseFloat(record.amount)
    ),
  }));
};

// Process Excel file
const processExcel = async (buffer: Buffer): Promise<Transaction[]> => {
  const workbook = new ExcelJS.Workbook();
  
  // Create a readable stream from buffer
  const stream = require('stream');
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);
  
  // Load workbook from stream
  await workbook.xlsx.read(bufferStream);

  const worksheet = workbook.worksheets[0];
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
  });

  return transactions;
};

// Process image file
const processImage = async (buffer: Buffer): Promise<Transaction[]> => {
  // Optimize image before OCR
  const optimizedBuffer = await sharp(buffer)
    .greyscale()
    .normalize()
    .sharpen()
    .toBuffer();

  const worker = await createWorker('eng');
  const {
    data: { text },
  } = await worker.recognize(optimizedBuffer);
  await worker.terminate();

  return extractTransactionsFromText(text);
};

// Extract transactions from text
const extractTransactionsFromText = (text: string): Transaction[] => {
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

  return transactions;
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

    return extractTransactionsFromText(text);
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
export const processFile = async (
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
      case 'image/png':
      case 'image/jpeg':
        return await processImage(buffer);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    throw error;
  }
};
