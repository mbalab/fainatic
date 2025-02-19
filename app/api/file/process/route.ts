import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { processFile } from '../../utils/serverFileProcessing';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_DIR = join(process.cwd(), 'tmp');

export async function GET(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get('file_id');
    
    if (!fileId) {
      return NextResponse.json({ error: 'No file_id provided' }, { status: 400 });
    }

    // Read metadata
    try {
      const metadataPath = join(TMP_DIR, `${fileId}.json`);
      const metadata = JSON.parse(
        await readFile(metadataPath, 'utf-8')
      );

      // Read file
      const fileExtension = metadata.originalName.split('.').pop() || '';
      const filePath = join(TMP_DIR, `${fileId}.${fileExtension}`);
      const buffer = await readFile(filePath);

      // Process file
      const transactions = await processFile(buffer, metadata.mimeType);

      // Clean up temporary files
      await Promise.all([
        unlink(filePath).catch(() => {}),
        unlink(metadataPath).catch(() => {}),
      ]);

      return NextResponse.json({ transactions });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'File not found or already processed' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Processing failed',
      },
      { status: 500 }
    );
  }
} 