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
      'text/plain', // Добавим для .csv файлов
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    // Проверяем и расширение файла
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    if (!allowedTypes.includes(file.type) && !isCSV) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 422 }
      );
    }

    const fileContent = await file.text();

    try {
      logger.debug('File content:', fileContent.substring(0, 200));
      const analysis = await analyzeWithGPT4(fileContent, file.type);
      logger.debug('Analysis result:', analysis);

      const analysisResult: AnalysisResult = {
        totalTransactions: analysis.metrics.totalTransactions,
        income: {
          total: analysis.metrics.income.total,
          categories: analysis.metrics.income.categories,
        },
        expenses: {
          total: analysis.metrics.expenses.total,
          categories: analysis.metrics.expenses.categories,
        },
        dateRange: {
          from: analysis.metrics.dateRange?.from || '',
          to: analysis.metrics.dateRange?.to || '',
        },
      };

      return NextResponse.json({
        message: 'File analyzed successfully',
        fileName: file.name,
        analysis: analysisResult,
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
