import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import pdfParse from 'pdf-parse';
import { Transaction } from '@/types/analysis';
import { logger } from './logger';
import { parse, format } from 'date-fns';

// Common currency for standardization
const DEFAULT_CURRENCY = 'USD';

// Helper to parse date strings into YYYY-MM-DD format
const standardizeDate = (dateStr: string): string => {
  logger.log('Attempting to parse date:', dateStr);

  const formats = [
    'yyyy-MM-dd HH:mm:ss',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'yyyy/MM/dd',
    'dd/MM/yy',
  ];

  for (const fmt of formats) {
    try {
      const parsedDate = parse(dateStr, fmt, new Date());
      const result = format(parsedDate, 'yyyy-MM-dd');
      logger.log('Parsed date:', result);
      return result;
    } catch (error) {
      logger.warn('Failed to parse with format:', fmt);
    }
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
  logger.log('Starting CSV processing');
  const content = fileContent.toString('utf-8');

  try {
    logger.log('Parsing CSV content');
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, string>[];

    logger.log('Found records:', records.length);
    if (records.length > 0) {
      logger.log('Sample record keys:', Object.keys(records[0]));
    }

    return records.map((record, index) => {
      try {
        // Try to identify common CSV column patterns
        const date =
          record.date ||
          record.Date ||
          record.DATE ||
          record.transaction_date ||
          record['Transaction Date'] ||
          record['Date Posted'] ||
          '';

        const amount =
          record.amount ||
          record.Amount ||
          record.AMOUNT ||
          record.transaction_amount ||
          record['Transaction Amount'] ||
          record.Debit ||
          record.Credit ||
          '0';

        const description =
          record.description ||
          record.Description ||
          record.DESCRIPTION ||
          record.merchant ||
          record.Merchant ||
          record['Transaction Description'] ||
          record.Memo ||
          record.Notes ||
          '';

        logger.log(`Processing record ${index + 1}:`, {
          rawDate: date,
          rawAmount: amount,
          rawDescription: description,
        });

        const standardizedAmount = standardizeAmount(amount);
        const standardizedDate = standardizeDate(date);

        logger.log(`Standardized record ${index + 1}:`, {
          date: standardizedDate,
          amount: standardizedAmount,
          description,
        });

        return {
          date: standardizedDate,
          amount: standardizedAmount,
          currency: DEFAULT_CURRENCY,
          counterparty: description,
          category: detectCategory(description, standardizedAmount),
        };
      } catch (error) {
        logger.error(`Error processing record ${index + 1}:`, error);
        throw error;
      }
    });
  } catch (error) {
    logger.error('Error parsing CSV:', error);
    throw new Error(
      `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Process Excel file
export const processExcel = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  const workbook = XLSX.read(fileContent);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json(firstSheet) as Record<
    string,
    string
  >[];

  return records.map((record) => {
    const date =
      record.date ||
      record.Date ||
      record.DATE ||
      record.transaction_date ||
      '';
    const amount =
      record.amount ||
      record.Amount ||
      record.AMOUNT ||
      record.transaction_amount ||
      '0';
    const description =
      record.description ||
      record.Description ||
      record.DESCRIPTION ||
      record.merchant ||
      '';

    const standardizedAmount = standardizeAmount(amount);

    return {
      date: standardizeDate(date),
      amount: standardizedAmount,
      currency: DEFAULT_CURRENCY,
      counterparty: description,
      category: detectCategory(description, standardizedAmount),
    };
  });
};

// Process PDF file
export const processPDF = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  try {
    // First try to extract text directly
    const pdfData = await pdfParse(fileContent);
    const text = pdfData.text;

    // If text extraction successful, try to parse transactions
    if (text.length > 0) {
      return extractTransactionsFromText(text);
    }

    // If no text was extracted, try OCR
    const worker = await createWorker('eng');
    const {
      data: { text: ocrText },
    } = await worker.recognize(fileContent);
    await worker.terminate();

    return extractTransactionsFromText(ocrText);
  } catch (error) {
    logger.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF file');
  }
};

// Helper function to extract transactions from text
const extractTransactionsFromText = (text: string): Transaction[] => {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const transactions: Transaction[] = [];

  for (const line of lines) {
    const datePattern = /\d{2}[-/]\d{2}[-/]\d{2,4}/;
    const amountPattern = /[-]?\$?\d+,?\d*\.?\d*/;

    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(amountPattern);

    if (dateMatch && amountMatch) {
      const standardizedAmount = standardizeAmount(amountMatch[0]);

      transactions.push({
        date: standardizeDate(dateMatch[0]),
        amount: standardizedAmount,
        currency: DEFAULT_CURRENCY,
        counterparty: line
          .replace(datePattern, '')
          .replace(amountPattern, '')
          .trim(),
        category: detectCategory(line, standardizedAmount),
      });
    }
  }

  return transactions;
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
  logger.log('Processing file of type:', fileType);

  // Normalize file type
  const normalizedType = fileType.toLowerCase();

  // Handle CSV files
  if (
    normalizedType === 'text/csv' ||
    normalizedType === 'application/csv' ||
    normalizedType === 'text/plain' // Some systems send CSV as text/plain
  ) {
    logger.log('Processing as CSV');
    return processCSV(file);
  }

  // Handle Excel files
  if (
    normalizedType === 'application/vnd.ms-excel' || // .xls
    normalizedType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
    normalizedType === 'application/x-excel' ||
    normalizedType === 'application/x-msexcel'
  ) {
    logger.log('Processing as Excel');
    return processExcel(file);
  }

  // Handle PDF files
  if (
    normalizedType === 'application/pdf' ||
    normalizedType === 'application/x-pdf'
  ) {
    logger.log('Processing as PDF');
    return processPDF(file);
  }

  logger.log('Unsupported file type:', fileType);
  throw new Error(`Unsupported file type: ${fileType}`);
};
