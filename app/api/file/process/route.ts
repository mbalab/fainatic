import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { processFile } from '../../utils/serverFileProcessing';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_DIR = join(process.cwd(), 'tmp');

// Ensure tmp directory exists
async function ensureTmpDir() {
  try {
    await mkdir(TMP_DIR, { recursive: true });
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get('file_id');
    
    if (!fileId) {
      return NextResponse.json({ 
        error: 'No file_id provided',
        details: 'Please provide a valid file_id parameter'
      }, { status: 400 });
    }

    await ensureTmpDir();
    logger.debug('Processing file with ID:', fileId);

    // Read metadata
    try {
      const metadataPath = join(TMP_DIR, `${fileId}.json`);
      logger.debug('Reading metadata from:', metadataPath);
      
      let metadata;
      try {
        metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
      } catch (parseError) {
        logger.error('Error parsing metadata:', parseError);
        return NextResponse.json({ 
          error: 'Invalid metadata format',
          details: 'The file metadata is corrupted or invalid'
        }, { status: 500 });
      }
      
      logger.debug('Metadata:', metadata);

      // Read file
      const fileExtension = metadata.originalName.split('.').pop() || '';
      const filePath = join(TMP_DIR, `${fileId}.${fileExtension}`);
      logger.debug('Reading file from:', filePath);
      
      let buffer;
      try {
        buffer = await readFile(filePath);
      } catch (readError) {
        logger.error('Error reading file:', readError);
        return NextResponse.json({ 
          error: 'File read error',
          details: 'Unable to read the uploaded file'
        }, { status: 500 });
      }
      
      logger.debug('File read successfully, size:', buffer.length);

      // Process file
      logger.debug('Processing file with mime type:', metadata.mimeType);
      let transactions;
      try {
        transactions = await processFile(buffer, metadata.mimeType);
      } catch (processError) {
        logger.error('Error processing file:', processError);
        return NextResponse.json({ 
          error: 'Processing error',
          details: processError instanceof Error ? processError.message : 'Failed to process file content'
        }, { status: 422 });
      }
      
      logger.debug('File processed successfully, transactions:', transactions.length);

      // Clean up temporary files
      await Promise.all([
        unlink(filePath).catch((e) => logger.warn('Failed to delete file:', e)),
        unlink(metadataPath).catch((e) => logger.warn('Failed to delete metadata:', e)),
      ]);
      logger.debug('Temporary files cleaned up');

      return NextResponse.json({ transactions });
    } catch (error) {
      logger.error('Error details:', error);
      if ((error as any).code === 'ENOENT') {
        return NextResponse.json({ 
          error: 'File not found',
          details: 'The requested file has been processed or does not exist'
        }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error processing file:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 