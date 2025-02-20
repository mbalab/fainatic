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
export const processCSV = async (buffer: Buffer): Promise<Transaction[]> => {
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

    const transactions: Transaction[] = records
      .map((record: any) => {
        try {
          const amount = parseFloat(record.Amount);
          const date = record['Started Date']?.split(' ')[0] || record.date;

          if (!date || isNaN(amount)) {
            logger.warn('Invalid record - missing date or amount:', record);
            return null;
          }

          return {
            date: date,
            amount,
            currency: record.Currency || 'USD',
            counterparty: record.Description || '',
            category: detectCategory(record.Description || '', amount),
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
    logger.error('Error processing CSV file:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to process CSV: ${error.message}`
        : 'Failed to process CSV file'
    );
  }
};

// Process Excel file
export const processExcel = async (buffer: Buffer): Promise<Transaction[]> => {
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

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      try {
        const values = row.values as any[];
        const date = values[dateIndex];
        const amount = parseFloat(values[amountIndex]);
        const description = values[descriptionIndex]?.toString() || '';
        const currency = values[currencyIndex]?.toString() || 'USD';

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
        ? `Failed to process Excel: ${error.message}`
        : 'Failed to process Excel file'
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
      case 'text/plain':
      case 'application/vnd.ms-excel':
        return await processCSV(buffer);
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return await processExcel(buffer);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    throw error;
  }
};
