import { createWorker } from 'tesseract.js';
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

// Extract transactions from text
const extractTransactionsFromText = (text: string): Transaction[] => {
  if (!text || typeof text !== 'string') {
    logger.error('Invalid text input for transaction extraction');
    throw new Error('Invalid text input for transaction extraction');
  }

  logger.debug('Extracting transactions from text');
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
      } catch (err) {
        logger.warn('Failed to parse transaction from line:', line, err);
      }
    }
  }

  return transactions;
};

export const processImage = async (
  fileContent: Buffer
): Promise<Transaction[]> => {
  if (!fileContent || !(fileContent instanceof Buffer)) {
    throw new Error('Invalid file content provided');
  }

  logger.debug('Starting image processing');
  try {
    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(fileContent);
    await worker.terminate();

    return extractTransactionsFromText(text);
  } catch (err) {
    logger.error('Error processing image:', err);
    throw new Error('Failed to process image file');
  }
};
