import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';
import pdfParse from 'pdf-parse';
import { parseISO, isValid } from 'date-fns';
import * as Tesseract from 'tesseract.js';
import sharp from 'sharp';

// Common currency for standardization
const DEFAULT_CURRENCY = 'USD';

// Helper to parse date strings into YYYY-MM-DD format
const standardizeDate = (dateStr: string): string => {
  logger.debug('Attempting to parse date:', dateStr);

  try {
    const parsedDate = parseISO(dateStr);
    if (isValid(parsedDate)) {
      const result = parsedDate.toISOString().split('T')[0];
      logger.debug('Parsed date:', result);
      return result;
    }
  } catch (error) {
    logger.warn('Failed to parse date:', dateStr);
  }

  logger.error('Failed to parse date:', dateStr);
  throw new Error(`Invalid date format: ${dateStr}`);
};

// Helper to clean and standardize amount
const standardizeAmount = (amount: string | number): number => {
  if (typeof amount === 'string') {
    // Remove currency symbols, spaces and other non-numeric characters except . and -
    const cleanAmount = amount.replace(/[^0-9.-]/g, '');

    // Handle negative amounts that might be in parentheses
    if (amount.includes('(') && amount.includes(')')) {
      return -Math.abs(parseFloat(cleanAmount));
    }

    return parseFloat(cleanAmount) || 0;
  }
  return amount || 0;
};

// Helper to detect transaction type and assign basic category
const detectCategory = (description: string, amount: number): string => {
  const lowerDesc = description.toLowerCase();

  // Basic category detection logic
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
  if (lowerDesc.includes('grocery') || lowerDesc.includes('food'))
    return 'Groceries';
  if (lowerDesc.includes('gas') || lowerDesc.includes('fuel'))
    return 'Transport';
  if (lowerDesc.includes('insurance')) return 'Insurance';
  if (lowerDesc.includes('rent') || lowerDesc.includes('mortgage'))
    return 'Housing';
  if (
    lowerDesc.includes('utility') ||
    lowerDesc.includes('electric') ||
    lowerDesc.includes('water')
  )
    return 'Utilities';

  return 'Other';
};

// Process CSV file
export const processCSV = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  logger.debug('Starting CSV processing');
  try {
    const records = csvParse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records.map((record: any) => ({
      date: standardizeDate(record.date),
      amount: standardizeAmount(record.amount),
      currency: record.currency || DEFAULT_CURRENCY,
      counterparty: record.counterparty || record.description || '',
      category:
        record.category ||
        detectCategory(
          record.description || '',
          standardizeAmount(record.amount)
        ),
    }));
  } catch (error) {
    logger.error('Error processing CSV:', error);
    throw new Error('Failed to process CSV file');
  }
};

// Process Excel file
export const processXLSX = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  logger.debug('Starting XLSX processing');
  try {
    const workbook = XLSX.read(fileContent);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const records = XLSX.utils.sheet_to_json(worksheet);

    return records.map((record: any) => ({
      date: standardizeDate(record.date),
      amount: standardizeAmount(record.amount),
      currency: record.currency || DEFAULT_CURRENCY,
      counterparty: record.counterparty || record.description || '',
      category:
        record.category ||
        detectCategory(
          record.description || '',
          standardizeAmount(record.amount)
        ),
    }));
  } catch (error) {
    logger.error('Error processing XLSX:', error);
    throw new Error('Failed to process XLSX file');
  }
};

// Process PDF file
export const processPDF = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  logger.debug('Starting PDF processing');
  try {
    const data = await pdfParse(fileContent);
    const text = data.text;

    if (!text.trim()) {
      logger.debug('PDF appears to be scanned, attempting OCR');
      return processScannedPDF(fileContent);
    }

    return extractTransactionsFromText(text);
  } catch (error) {
    logger.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF file');
  }
};

const processScannedPDF = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  logger.debug('Processing scanned PDF with OCR');
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(fileContent, 'eng', {
      logger: (m) => logger.debug(m),
    });
    return extractTransactionsFromText(text);
  } catch (error) {
    logger.error('Error processing scanned PDF:', error);
    throw new Error('Failed to process scanned PDF with OCR');
  }
};

const extractTransactionsFromText = (text: string): Transaction[] => {
  logger.debug('Extracting transactions from text');
  const lines = text.split('\n').filter((line) => line.trim());
  const transactions: Transaction[] = [];

  const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/;
  const amountRegex = /\$?\s*\d+(?:,\d{3})*(?:\.\d{2})?/;

  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    const amountMatch = line.match(amountRegex);

    if (amountMatch) {
      const amount = standardizeAmount(amountMatch[0]);
      const date = dateMatch
        ? standardizeDate(dateMatch[0])
        : new Date().toISOString().split('T')[0];

      transactions.push({
        date,
        amount,
        currency: DEFAULT_CURRENCY,
        counterparty: line.trim(),
        category: detectCategory(line, amount),
      });
    }
  }

  return transactions;
};

export const processImage = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  logger.debug('Starting image processing');
  try {
    // Оптимизация изображения для OCR
    const optimizedImage = await sharp(fileContent)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const {
      data: { text },
    } = await Tesseract.recognize(optimizedImage, 'eng', {
      logger: (m) => logger.debug(m),
    });

    return extractTransactionsFromText(text);
  } catch (error) {
    logger.error('Error processing image:', error);
    throw new Error('Failed to process image file');
  }
};

// Convert transactions to CSV string
export const transactionsToCSV = (transactions: Transaction[]): string => {
  return csvStringify(transactions, {
    header: true,
    columns: ['date', 'amount', 'currency', 'counterparty', 'category'],
  });
};

// Main function to process any supported file type
export const processFile = async (
  file: Buffer,
  fileType: string
): Promise<Transaction[]> => {
  logger.debug('Processing file of type:', fileType);

  // Normalize file type
  const normalizedType = fileType.toLowerCase();

  // Handle CSV files
  if (
    normalizedType === 'text/csv' ||
    normalizedType === 'application/csv' ||
    normalizedType === 'text/plain'
  ) {
    logger.debug('Processing as CSV');
    return processCSV(file);
  }

  // Handle Excel files
  if (
    normalizedType === 'application/vnd.ms-excel' ||
    normalizedType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    normalizedType === 'application/x-excel' ||
    normalizedType === 'application/x-msexcel'
  ) {
    logger.debug('Processing as Excel');
    return processXLSX(file);
  }

  // Handle PDF files
  if (
    normalizedType === 'application/pdf' ||
    normalizedType === 'application/x-pdf'
  ) {
    logger.debug('Processing as PDF');
    return processPDF(file);
  }

  // Handle image files
  if (normalizedType.startsWith('image/')) {
    logger.debug('Processing as Image');
    return processImage(file);
  }

  logger.debug('Unsupported file type:', fileType);
  throw new Error(`Unsupported file type: ${fileType}`);
};

export function validateTransactions(transactions: Transaction[]): boolean {
  return transactions.every((transaction) => {
    return (
      transaction.date &&
      !isNaN(transaction.amount) &&
      transaction.currency &&
      transaction.counterparty !== undefined &&
      transaction.category !== undefined
    );
  });
}
