import { NextRequest, NextResponse } from 'next/server';
import { processFile } from '@/utils/serverFileProcessing';
import { logger } from '@/utils/logger';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    logger.debug('Processing file:', file.name, 'type:', file.type);

    const buffer = await file.arrayBuffer();
    const transactions = await processFile(Buffer.from(buffer), file.type);

    logger.debug(
      'File processed successfully:',
      transactions.length,
      'transactions found'
    );

    return NextResponse.json({ transactions });
  } catch (error) {
    logger.error('Error processing file:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
