import { NextRequest, NextResponse } from 'next/server';
import { analyzeTransactions } from '@/utils/analysis';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Invalid transactions data' },
        { status: 400 }
      );
    }

    logger.debug('Starting base analysis', {
      transactionsCount: transactions.length,
    });

    const analysis = analyzeTransactions(transactions);

    logger.debug('Base analysis completed successfully');
    return NextResponse.json(analysis);
  } catch (error) {
    logger.error('Error in base analysis:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to analyze data',
      },
      { status: 500 }
    );
  }
}
