'use client';

import { useState } from 'react';
import { FileUpload } from '../upload/FileUpload';
import { AnalysisResults } from '../upload/AnalysisResults';
import type { AnalysisResult } from '@/types';

export const UploadSection = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysis(result);
    setError(null);
  };

  const handleError = (error: string) => {
    setError(error);
    setAnalysis(null);
  };

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {analysis ? (
          <AnalysisResults data={analysis} error={error} />
        ) : (
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              Upload Your Bank Statement
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              We support all major formats: CSV, Excel, PDF, or image
            </p>
            <div className="mt-8">
              <FileUpload
                onAnalysisComplete={handleAnalysisComplete}
                onError={handleError}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
