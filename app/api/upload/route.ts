import { NextRequest, NextResponse } from 'next/server';
import { processFile } from '../utils/serverFileProcessing';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    logger.debug('Processing file:', file.name, 'type:', file.type);

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const transactions = await processFile(buffer, file.type);
      return NextResponse.json({ transactions });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'File processing failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
