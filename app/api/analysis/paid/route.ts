import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGPT4 } from '@/utils/openai';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transactionsJson = formData.get('transactions');

    if (!transactionsJson || typeof transactionsJson !== 'string') {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      );
    }

    const transactions = JSON.parse(transactionsJson) as Transaction[];

    if (!Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Invalid transaction data format' },
        { status: 400 }
      );
    }

    // Validate transaction data
    const isValid = transactions.every((t: Transaction) => {
      return (
        t.date &&
        typeof t.amount === 'number' &&
        t.currency &&
        typeof t.counterparty === 'string' &&
        typeof t.category === 'string'
      );
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid transaction data structure' },
        { status: 400 }
      );
    }

    logger.debug('Processing transactions:', transactions.length);

    const result = await analyzeWithGPT4(transactions);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in paid analysis:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
