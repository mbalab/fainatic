'use client';

import { useState } from 'react';
import { FileUpload } from '../upload/FileUpload';
import { AnalysisResults } from '../upload/AnalysisResults';
import type { AnalysisResult } from '../upload/types';

export const UploadSection = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  return (
    <div className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          {analysis ? (
            <AnalysisResults data={analysis} />
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Upload Your Bank Statement
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We support all major file formats: CSV, Excel, PDF, or image
                format
              </p>
              <div className="mt-16">
                <FileUpload onAnalysisComplete={setAnalysis} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
