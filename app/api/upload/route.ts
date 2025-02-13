import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGPT4 } from '@/utils/openai';
import type { AnalysisResult } from '@/types';
import { logger } from '@/utils/logger';

export const POST = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    logger.debug('File type:', file.type);
    logger.debug('File name:', file.name);

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = [
      'text/csv',
      'application/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    // Проверяем расширение файла
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExtension = [
      'csv',
      'xls',
      'xlsx',
      'pdf',
      'jpg',
      'jpeg',
      'png',
    ].includes(fileExtension || '');

    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 422 }
      );
    }

    try {
      const fileContent = await file.text();
      logger.debug('File content:', fileContent.substring(0, 200));

      const analysis = await analyzeWithGPT4(fileContent, file.type);
      logger.debug('Analysis result:', analysis);

      return NextResponse.json({
        message: 'File analyzed successfully',
        fileName: file.name,
        analysis,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to analyze file: ${errorMessage}` },
        { status: 422 }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process file: ${errorMessage}` },
      { status: 500 }
    );
  }
};
