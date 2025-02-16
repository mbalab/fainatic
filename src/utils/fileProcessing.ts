import ExcelJS from 'exceljs';
import { parse as csvParse } from 'csv-parse/sync';
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

// Helper to find column indices based on common patterns
const findColumnIndices = (headers: string[]) => {
  const datePatterns = ['date', 'day', 'transaction_date', 'payment_date'];
  const amountPatterns = [
    'amount',
    'sum',
    'total',
    'debit',
    'credit',
    'payment',
    'transaction_amount'
  ];
  const descriptionPatterns = [
    'description',
    'desc',
    'narrative',
    'details',
    'memo',
    'note',
    'reference',
    'payee',
    'counterparty',
    'merchant'
  ];

  const findIndex = (patterns: string[]) => {
    const index = headers.findIndex((h) => {
      if (!h) return false;
      const header = h.toString().toLowerCase().trim();
      return patterns.some((pattern) => header.includes(pattern));
    });
    return index === -1 ? null : index;
  };

  return {
    dateIndex: findIndex(datePatterns),
    amountIndices: {
      single: findIndex(amountPatterns),
      debit: findIndex(['debit', 'debit', 'расход']),
      credit: findIndex(['credit', 'credit', 'приход']),
    },
    descriptionIndex: findIndex(descriptionPatterns),
  };
};

// Helper to extract amount from various formats
const extractAmount = (
  record: any[],
  indices: ReturnType<typeof findColumnIndices>
): number => {
  const { amountIndices } = indices;

  // Try single amount column first
  if (amountIndices.single !== null && record[amountIndices.single]) {
    const amount = parseFloat(
      record[amountIndices.single].toString().replace(/[^-0-9.]/g, '')
    );
    if (!isNaN(amount)) return amount;
  }

  // Try debit/credit columns
  if (
    amountIndices.debit !== null &&
    amountIndices.credit !== null &&
    record[amountIndices.debit] &&
    record[amountIndices.credit]
  ) {
    const debit =
      parseFloat(
        record[amountIndices.debit].toString().replace(/[^-0-9.]/g, '')
      ) || 0;
    const credit =
      parseFloat(
        record[amountIndices.credit].toString().replace(/[^-0-9.]/g, '')
      ) || 0;
    return credit - debit;
  }

  throw new Error('Could not find valid amount column');
};

// Process CSV file
const processCSV = async (buffer: Buffer): Promise<Transaction[]> => {
  try {
    logger.debug('Starting CSV processing');
    const content = buffer.toString();

    // Try to detect delimiter
    const firstLine = content.split('\n')[0];
    const delimiter =
      [',', ';', '\t'].find((d) => firstLine.includes(d)) || ',';

    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      delimiter,
    });

    if (records.length === 0) {
      throw new Error('No records found in CSV file');
    }

    // Get column indices from headers
    const headers = Object.keys(records[0]);
    const columnIndices = findColumnIndices(headers);

    if (columnIndices.dateIndex === null) {
      throw new Error('Could not find date column');
    }

    const transactions = records
      .map((record: any) => {
        try {
          const amount = extractAmount(Object.values(record), columnIndices);
          const date = record[headers[columnIndices.dateIndex!]];
          const description =
            columnIndices.descriptionIndex !== null
              ? record[headers[columnIndices.descriptionIndex]]?.toString()
              : '';

          if (!date) {
            throw new Error('Missing date value');
          }

          return {
            date: date.toString(),
            amount,
            currency: DEFAULT_CURRENCY,
            counterparty: description || '',
            category: detectCategory(description || '', amount),
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

    // Try to find a worksheet with transaction data
    const worksheet =
      workbook.worksheets.find((ws) => {
        const firstRow = ws.getRow(1).values as string[];
        const indices = findColumnIndices(firstRow);
        return (
          indices.dateIndex !== null &&
          (indices.amountIndices.single !== null ||
            (indices.amountIndices.debit !== null &&
              indices.amountIndices.credit !== null))
        );
      }) || workbook.worksheets[0];

    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const transactions: Transaction[] = [];

    // Get column indices from headers
    const headers = (worksheet.getRow(1).values as string[]).map(
      (h) => h?.toString() || ''
    );
    const columnIndices = findColumnIndices(headers);

    if (columnIndices.dateIndex === null) {
      throw new Error('Could not find date column in Excel file');
    }

    // Process rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      try {
        const values = row.values as any[];
        if (!values[columnIndices.dateIndex!]) return; // Skip rows without date

        const date = values[columnIndices.dateIndex!];
        const amount = extractAmount(values, columnIndices);
        const description =
          columnIndices.descriptionIndex !== null &&
          values[columnIndices.descriptionIndex]
            ? values[columnIndices.descriptionIndex].toString()
            : '';

        transactions.push({
          date: date.toString(),
          amount,
          currency: DEFAULT_CURRENCY,
          counterparty: description,
          category: detectCategory(description, amount),
        });
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
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    throw error;
  }
};
