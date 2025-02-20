import { parse as csvParse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
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
  try {
    logger.debug('Starting CSV processing');
    const content = buffer.toString();

    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      throw new Error('No records found in CSV file');
    }

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

    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    await workbook.xlsx.read(bufferStream);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const transactions: Transaction[] = [];

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

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

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

// Main processing function
export const processFile = async (
  buffer: Buffer,
  mimeType: string
): Promise<{ transactions?: Transaction[]; error?: string }> => {
  if (!buffer || !(buffer instanceof Buffer)) {
    return { error: 'INVALID_FILE_CONTENT' };
  }

  logger.debug('Processing file with mime type:', mimeType);

  try {
    let transactions: Transaction[];

    switch (mimeType) {
      case 'text/csv':
        transactions = await processCSV(buffer);
        break;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        transactions = await processExcel(buffer);
        break;
      case 'application/pdf':
        return { error: 'PDF_PROCESSING_ON_SERVER_ONLY' };
      default:
        return { error: 'UNSUPPORTED_FILE_TYPE' };
    }

    // Validate transactions
    const isValid = transactions.every((transaction) => {
      return (
        transaction.date &&
        !isNaN(transaction.amount) &&
        transaction.currency &&
        transaction.counterparty !== undefined &&
        transaction.category !== undefined
      );
    });

    if (!isValid) {
      return { error: 'INVALID_TRANSACTION_DATA' };
    }

    return { transactions };
  } catch (error) {
    logger.error('Error processing file:', error);
    return {
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
};
