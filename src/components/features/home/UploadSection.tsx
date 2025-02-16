'use client';

import { useState } from 'react';
import { FileUpload } from '../upload/FileUpload';
import { AnalysisResults } from '../upload/AnalysisResults';
import type { AnalysisResult, Transaction } from '@/types';
import { analyzeTransactions } from '@/utils/analysis';
import { Typography } from '@mui/material';

export const UploadSection = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadComplete = async (transactions: Transaction[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const analysisResult = analyzeTransactions(transactions);
      setResult(analysisResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to analyze transactions'
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setResult(null);
  };

  return (
    <section id="upload-section" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {result ? (
          <AnalysisResults
            result={result}
            error={error}
            isLoading={isLoading}
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
