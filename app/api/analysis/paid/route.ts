import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGPT4 } from '../../utils/openai';
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

    const analysis = await analyzeWithGPT4(transactions);
    return NextResponse.json(analysis);
  } catch (error) {
    logger.error('Error in paid analysis:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to analyze data',
      },
      { status: 500 }
    );
  }
}
