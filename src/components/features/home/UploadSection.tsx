'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileUpload } from '../upload/FileUpload';
import { AnalysisResults } from '../upload/AnalysisResults';
import type { AnalysisResult, Transaction } from '@/types';
import { analyzeTransactions } from '@/utils/analysis';
import { Typography } from '@mui/material';

export const UploadSection = () => {
  console.log('UploadSection start');

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Логируем изменения состояний
  useEffect(() => {
    console.log('UploadSection state updated:', {
      transactions: transactions.length,
      result: result ? 'exists' : 'null',
      error,
    });
  }, [transactions, result, error]);

  // Проверяем необходимость сброса состояния
  useEffect(() => {
    if (!error && transactions.length > 0 && result) {
      console.log('Keeping existing result and transactions.');
      return;
    }
    if (error) {
      console.log('Resetting state due to error:', error);
      setResult(null);
      setTransactions([]);
    }
  }, [error, transactions.length, result]);

  const handleUploadComplete = useCallback(
    async (newTransactions: Transaction[]) => {
      try {
        console.log('handleUploadComplete called');
        console.log('Transactions received:', newTransactions);

        setIsLoading(true);
        setError(null);
        setTransactions(newTransactions);
        console.log(
          'Transactions state after setTransactions:',
          newTransactions
        );

        console.log('Transactions received for analysis:', newTransactions);
        const analysisResult = analyzeTransactions(newTransactions);
        console.log('AnalyzeTransactions output:', analysisResult);

        setResult((prev) => {
          console.log('Previous result state:', prev);
          console.log('New result:', analysisResult);
          return analysisResult;
        });

        console.log('handleUploadComplete reached end');
      } catch (err) {
        console.error('Error in handleUploadComplete:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to analyze transactions';
        console.log('Setting error:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleError = useCallback((error: Error) => {
    console.error('Upload error:', error);
    console.log('Setting error in handleError:', error.message);
    setError(error.message);
  }, []);

  console.log('Rendering UploadSection with:', {
    transactions: transactions.length,
    result,
    isLoading,
    error,
  });

  return (
    <section
      key={transactions.length}
      id="upload-section"
      className="bg-white py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {result ? (
          <AnalysisResults
            key={transactions.length}
            result={result}
            error={error}
            isLoading={isLoading}
            transactions={transactions}
          />
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                color: 'text.primary',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              Upload your bank statement
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              sx={{
                color: 'text.secondary',
                mb: 4,
              }}
            >
              Supported formats: CSV, Excel, PDF, images
            </Typography>
            <div className="mt-8">
              <FileUpload
                onUploadComplete={handleUploadComplete}
                onError={handleError}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
