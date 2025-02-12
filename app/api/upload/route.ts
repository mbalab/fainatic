import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGPT4 } from '@/utils/openai';
import type { AnalysisResult } from '@/types';

export const POST = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('File type:', file.type); // Временно для отладки
    console.log('File name:', file.name); // Временно для отладки

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
      console.log('File content:', fileContent.substring(0, 200)); // Первые 200 символов
      const analysis = await analyzeWithGPT4(fileContent, file.type);
      console.log('Analysis result:', analysis); // Результат анализа

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
