import ExcelJS from 'exceljs';
import { parse as csvParse } from 'csv-parse/sync';
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

// Enhanced column patterns for better detection
const columnPatterns = {
  date: [
    'date',
    'transaction date',
    'posted date',
    'trans date',
    'posting date',
    'payment date',
  ],
  description: [
    'description',
    'details',
    'transaction',
    'narrative',
    'particulars',
    'memo',
    'note',
    'reference',
    'payee',
    'merchant',
  ],
  amount: ['amount', 'value', 'sum', 'total', 'payment', 'transaction amount'],
  debit: ['debit', 'withdrawal', 'expense', 'paid out'],
  credit: ['credit', 'deposit', 'income', 'paid in'],
  currency: ['currency', 'iso code', 'curr', 'ccy'],
};

// Currency symbols and their corresponding ISO codes
const currencySymbols = new Map([
  ['$', 'USD'],
  ['€', 'EUR'],
  ['£', 'GBP'],
  ['¥', 'JPY'],
  ['₹', 'INR'],
  ['₽', 'RUB'],
  ['₣', 'CHF'],
  ['A$', 'AUD'],
  ['C$', 'CAD'],
]);

// Helper to find best matching column for each field
const findBestMatchingColumn = (
  headers: string[],
  patterns: string[]
): number | null => {
  const matches = headers.map((header, index) => {
    if (!header) return { index, score: 0 };
    const headerLower = header.toLowerCase().trim();
    const score = patterns.reduce((maxScore, pattern) => {
      if (headerLower === pattern) return 1; // Exact match
      if (headerLower.includes(pattern)) return 0.8; // Partial match
      return maxScore;
    }, 0);
    return { index, score };
  });

  const bestMatch = matches.reduce(
    (best, current) => (current.score > best.score ? current : best),
    { index: -1, score: 0 }
  );

  return bestMatch.score > 0 ? bestMatch.index : null;
};

// Helper to detect currency from amount string
const detectCurrencyFromAmount = (amount: string): string | null => {
  const match = amount.match(/^[^0-9-]*([^0-9]*)/);
  if (match && match[1]) {
    const symbol = match[1].trim();
    return currencySymbols.get(symbol) || null;
  }
  return null;
};

// Process CSV file with enhanced column detection
const processCSV = async (buffer: Buffer): Promise<Transaction[]> => {
  try {
    logger.debug('Starting enhanced CSV processing');
    const content = buffer.toString();

    // Detect delimiter from first line
    const firstLine = content.split('\n')[0];
    const delimiter =
      [',', ';', '\t'].find((d) => firstLine.includes(d)) || ',';

    // Parse CSV with basic settings
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
    });

    if (records.length === 0) {
      throw new Error('No records found in CSV file');
    }

    // Get headers and find column mappings
    const headers = Object.keys(records[0]);
    const columnMap = {
      date: findBestMatchingColumn(headers, columnPatterns.date),
      description: findBestMatchingColumn(headers, columnPatterns.description),
      amount: findBestMatchingColumn(headers, columnPatterns.amount),
      debit: findBestMatchingColumn(headers, columnPatterns.debit),
      credit: findBestMatchingColumn(headers, columnPatterns.credit),
      currency: findBestMatchingColumn(headers, columnPatterns.currency),
    };

    if (columnMap.date === null) {
      throw new Error('Could not find date column');
    }

    if (
      columnMap.amount === null &&
      (columnMap.debit === null || columnMap.credit === null)
    ) {
      throw new Error('Could not find amount or debit/credit columns');
    }

    // Try to detect currency if not explicitly specified
    let defaultCurrency: string | null = null;
    if (columnMap.currency === null) {
      // Sample first 10 records to detect currency
      const sampleSize = Math.min(10, records.length);
      const currenciesFound = new Set<string>();

      for (let i = 0; i < sampleSize; i++) {
        const record = records[i];
        const amountStr =
          columnMap.amount !== null
            ? record[headers[columnMap.amount]]
            : record[headers[columnMap.credit!]] ||
              record[headers[columnMap.debit!]];

        if (typeof amountStr === 'string') {
          const detectedCurrency = detectCurrencyFromAmount(amountStr);
          if (detectedCurrency) {
            currenciesFound.add(detectedCurrency);
          }
        }
      }

      // Only set defaultCurrency if exactly one currency was found
      if (currenciesFound.size === 1) {
        defaultCurrency = Array.from(currenciesFound)[0];
      }
    }

    // Process records
    const transactions = records
      .map((record: any) => {
        try {
          // Get date
          const date = record[headers[columnMap.date!]];
          if (!date) return null;

          // Get amount
          let amount: number;
          if (columnMap.amount !== null) {
            const amountStr = record[headers[columnMap.amount]].toString();
            amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
          } else {
            const debit = parseFloat(
              record[headers[columnMap.debit!]]
                ?.toString()
                .replace(/[^0-9.-]/g, '') || '0'
            );
            const credit = parseFloat(
              record[headers[columnMap.credit!]]
                ?.toString()
                .replace(/[^0-9.-]/g, '') || '0'
            );
            amount = credit - debit;
          }

          if (isNaN(amount)) return null;

          // Get description
          const description =
            columnMap.description !== null
              ? record[headers[columnMap.description]]?.toString() || ''
              : '';

          // Get currency
          let currency =
            columnMap.currency !== null
              ? record[headers[columnMap.currency]]?.toString()
              : defaultCurrency || undefined;

          return {
            date: date.toString(),
            amount,
            currency,
            counterparty: description,
            category: detectCategory(description, amount),
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
        const columnMap = {
          date: findBestMatchingColumn(firstRow, columnPatterns.date),
          amount: findBestMatchingColumn(firstRow, columnPatterns.amount),
          debit: findBestMatchingColumn(firstRow, columnPatterns.debit),
          credit: findBestMatchingColumn(firstRow, columnPatterns.credit),
        };
        return (
          columnMap.date !== null &&
          (columnMap.amount !== null ||
            (columnMap.debit !== null && columnMap.credit !== null))
        );
      }) || workbook.worksheets[0];

    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    // Get headers and find column mappings
    const headers = (worksheet.getRow(1).values as string[]).map(
      (h) => h?.toString().trim() || ''
    );
    const columnMap = {
      date: findBestMatchingColumn(headers, columnPatterns.date),
      description: findBestMatchingColumn(headers, columnPatterns.description),
      amount: findBestMatchingColumn(headers, columnPatterns.amount),
      debit: findBestMatchingColumn(headers, columnPatterns.debit),
      credit: findBestMatchingColumn(headers, columnPatterns.credit),
      currency: findBestMatchingColumn(headers, columnPatterns.currency),
    };

    if (columnMap.date === null) {
      throw new Error('Could not find date column in Excel file');
    }

    if (
      columnMap.amount === null &&
      (columnMap.debit === null || columnMap.credit === null)
    ) {
      throw new Error('Could not find amount or debit/credit columns');
    }

    // Try to detect currency if not explicitly specified
    let defaultCurrency: string | null = null;
    if (columnMap.currency === null) {
      // Sample first 10 rows to detect currency
      const sampleSize = Math.min(10, worksheet.rowCount);
      const currenciesFound = new Set<string>();

      for (let i = 2; i <= sampleSize; i++) {
        const row = worksheet.getRow(i);
        const values = row.values as any[];
        if (!values || values.length === 0) continue;

        const amountStr =
          columnMap.amount !== null
            ? values[columnMap.amount]?.toString()
            : values[columnMap.credit!]?.toString() ||
              values[columnMap.debit!]?.toString();

        if (typeof amountStr === 'string') {
          const detectedCurrency = detectCurrencyFromAmount(amountStr);
          if (detectedCurrency) {
            currenciesFound.add(detectedCurrency);
          }
        }
      }

      // Only set defaultCurrency if exactly one currency was found
      if (currenciesFound.size === 1) {
        defaultCurrency = Array.from(currenciesFound)[0];
      }
    }

    const transactions: Transaction[] = [];
    let isHeaderRow = false;

    // Process rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip first header row

      try {
        const values = row.values as any[];
        if (!values || values.length === 0) return; // Skip empty rows

        // Check if this is a header row in the middle of data
        const rowStr = values.join(' ').toLowerCase();
        if (
          rowStr.includes('date') &&
          (rowStr.includes('amount') ||
            rowStr.includes('debit') ||
            rowStr.includes('credit'))
        ) {
          isHeaderRow = true;
          return;
        }

        if (isHeaderRow) {
          isHeaderRow = false;
          return;
        }

        // Get date
        const dateValue = values[columnMap.date!];
        if (!dateValue) return; // Skip rows without date

        // Convert date to YYYY-MM-DD format
        let dateStr: string;
        if (dateValue instanceof Date) {
          dateStr = dateValue.toISOString().split('T')[0];
        } else {
          const date = new Date(dateValue.toString());
          if (isNaN(date.getTime())) {
            return; // Skip invalid dates
          }
          dateStr = date.toISOString().split('T')[0];
        }

        // Get amount
        let amount: number;
        if (columnMap.amount !== null) {
          const amountValue = values[columnMap.amount];
          if (typeof amountValue === 'number') {
            amount = amountValue;
          } else {
            const amountStr = amountValue?.toString() || '';
            amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
          }
        } else {
          const debitValue = values[columnMap.debit!];
          const creditValue = values[columnMap.credit!];

          const debit =
            typeof debitValue === 'number'
              ? debitValue
              : parseFloat(
                  debitValue?.toString().replace(/[^0-9.-]/g, '') || '0'
                );

          const credit =
            typeof creditValue === 'number'
              ? creditValue
              : parseFloat(
                  creditValue?.toString().replace(/[^0-9.-]/g, '') || '0'
                );

          amount = credit - debit;
        }

        if (isNaN(amount)) return; // Skip invalid amounts

        // Get description
        const description =
          columnMap.description !== null && values[columnMap.description]
            ? values[columnMap.description].toString().trim()
            : '';

        // Get currency
        let currency =
          columnMap.currency !== null && values[columnMap.currency]
            ? values[columnMap.currency].toString().trim()
            : defaultCurrency || undefined;

        // Convert currency symbol to code if needed
        if (currency && currencySymbols.has(currency)) {
          currency = currencySymbols.get(currency)!;
        }

        transactions.push({
          date: dateStr,
          amount,
          currency,
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

    // Sort transactions by date
    transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

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
