import pdfParse from 'pdf-parse';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';

// Process PDF file on server side only
export const processPDF = async (buffer: Buffer): Promise<Transaction[]> => {
  try {
    logger.debug('Starting PDF processing');

    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid PDF buffer provided');
    }

    if (buffer.slice(0, 5).toString() !== '%PDF-') {
      throw new Error('Invalid PDF format: missing PDF signature');
    }

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