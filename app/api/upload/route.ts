import { NextRequest, NextResponse } from 'next/server';
import { processFile, validateTransactions } from '@/utils/fileProcessing';
import type { Transaction } from '@/types';
import { logger } from '@/utils/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SUPPORTED_FILE_TYPES = new Set([
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const type = file.type;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.has(type)) {
      return NextResponse.json(
        { error: 'UNSUPPORTED_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      // Process file
      const transactions = await processFile(buffer, type);

      // Validate extracted transactions
      if (!validateTransactions(transactions)) {
        throw new Error('INVALID_TRANSACTION_FORMAT');
      }

      // Return standardized transactions
      return NextResponse.json({ transactions });
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Handle known errors
        switch (errorMessage) {
          case 'INVALID_CSV_FORMAT':
          case 'INVALID_EXCEL_FORMAT':
          case 'INVALID_PDF_FORMAT':
          case 'SCANNED_PDF_PROCESSING_FAILED':
          case 'IMAGE_PROCESSING_FAILED':
          case 'INVALID_TRANSACTION_FORMAT':
          case 'PDF_TEXT_EXTRACTION_NOT_IMPLEMENTED':
          case 'IMAGE_TEXT_EXTRACTION_NOT_IMPLEMENTED':
            return NextResponse.json({ error: errorMessage }, { status: 400 });
          default:
            logger.error('Unknown processing error:', error);
            return NextResponse.json(
              { error: 'FILE_PROCESSING_FAILED' },
              { status: 500 }
            );
        }
      }

      return NextResponse.json(
        { error: 'FILE_PROCESSING_FAILED' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Upload error:', error);
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
