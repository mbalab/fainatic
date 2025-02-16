import sharp from 'sharp';
import ExcelJS from 'exceljs';
import { createWorker } from 'tesseract.js';
import { parse as csvParse } from 'csv-parse/sync';
import pdfParse from 'pdf-parse';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';

// Common currency for standardization
const DEFAULT_CURRENCY = 'USD';

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
    currency: DEFAULT_CURRENCY,
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
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  const transactions: Transaction[] = [];

  // Get header row
  const headers = worksheet.getRow(1).values as string[];
  const dateIndex = headers.findIndex((h) => h?.toLowerCase().includes('date'));
  const amountIndex = headers.findIndex((h) =>
    h?.toLowerCase().includes('amount')
  );
  const descriptionIndex = headers.findIndex(
    (h) =>
      h?.toLowerCase().includes('description') ||
      h?.toLowerCase().includes('counterparty')
  );

  // Process rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const values = row.values as any[];
    const date = values[dateIndex];
    const amount = parseFloat(values[amountIndex]);
    const description = values[descriptionIndex]?.toString() || '';

    if (date && !isNaN(amount)) {
      transactions.push({
        date: date.toString(),
        amount,
        currency: DEFAULT_CURRENCY,
        counterparty: description,
        category: detectCategory(description, amount),
      });
    }
  });

  return transactions;
};

// Process PDF file
const processPDF = async (buffer: Buffer): Promise<Transaction[]> => {
  const { text } = await pdfParse(buffer);
  return extractTransactionsFromText(text);
};

// Process image file
const processImage = async (buffer: Buffer): Promise<Transaction[]> => {
  // Optimize image before OCR
  const optimizedBuffer = await sharp(buffer)
    .greyscale() // Convert to greyscale
    .normalize() // Normalize contrast
    .sharpen() // Sharpen the image
    .toBuffer();

  try {
    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(optimizedBuffer);
    await worker.terminate();

    return extractTransactionsFromText(text);
  } catch (err) {
    logger.error('Error processing image:', err);
    throw new Error('Failed to process image file');
  }
};

// Extract transactions from text
const extractTransactionsFromText = (text: string): Transaction[] => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input for transaction extraction');
  }

  const lines = text.split('\n').filter((line) => line.trim());
  const transactions: Transaction[] = [];

  const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/;
  const amountRegex = /\$?\s*-?\d+(?:,\d{3})*(?:\.\d{2})?/;

  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    const amountMatch = line.match(amountRegex);

    if (dateMatch && amountMatch) {
      try {
        const amount = parseFloat(amountMatch[0].replace(/[$,]/g, ''));
        if (!isNaN(amount)) {
          transactions.push({
            date: dateMatch[0],
            amount,
            currency: DEFAULT_CURRENCY,
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
      case 'image/jpg':
        return await processImage(buffer);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    throw error;
  }
};
