import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGPT4 } from '@/utils/openai';
import type { AnalysisResult } from '@/types';
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
    const filename = formData.get('filename') as string;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

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
      const analysis = await analyzeWithGPT4(buffer, type, filename);
      return NextResponse.json({ analysis });
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Handle known errors
        switch (errorMessage) {
          case 'RATE_LIMIT_EXCEEDED':
          case 'INVALID_ANALYSIS_RESULT':
          case 'ANALYSIS_FAILED':
          case 'INVALID_STATEMENT_FORMAT':
          case 'ANALYSIS_TIMEOUT':
            return NextResponse.json({ error: errorMessage }, { status: 400 });
          default:
            logger.error('Unknown analysis error:', error);
            return NextResponse.json(
              { error: 'ANALYSIS_FAILED' },
              { status: 500 }
            );
        }
      }

      return NextResponse.json({ error: 'ANALYSIS_FAILED' }, { status: 500 });
    }
  } catch (error) {
    logger.error('Upload error:', error);
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
