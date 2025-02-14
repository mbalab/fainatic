'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import type { AnalysisResult } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type UploadError =
  | 'size'
  | 'type'
  | 'upload'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_ANALYSIS_RESULT'
  | 'ANALYSIS_FAILED'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'UPLOAD_FAILED'
  | null;
type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

type FileUploadProps = {
  onAnalysisComplete: (analysis: AnalysisResult) => void;
  onError: (error: string) => void;
};

export const FileUpload = ({
  onAnalysisComplete,
  onError,
}: FileUploadProps) => {
  const [error, setError] = useState<UploadError>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');

  const getContainerStyles = () => {
    if (error) {
      return 'border-red-500 bg-red-50/50';
    }
    if (status === 'uploading' || status === 'analyzing') {
      return 'border-blue-500 bg-blue-50/50';
    }
    if (status === 'success') {
      return 'border-green-500 bg-green-50/50';
    }
    if (isDragActive) {
      return 'border-blue-500 bg-blue-50/50';
    }
    return 'border-gray-300 hover:border-blue-400';
  };

  const handleUploadError = () => {
    setError('upload');
    setStatus('error');
    onError('upload');
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((e) => e.code === 'file-too-large')) {
          setError('size');
          setStatus('error');
          onError('size');
          return;
        }
        setError('type');
        setStatus('error');
        onError('type');
        return;
      }

      if (acceptedFiles.length > 0) {
        try {
          setError(null);
          setStatus('uploading');

          const formData = new FormData();
          formData.append('file', acceptedFiles[0]);
          formData.append('filename', acceptedFiles[0].name);
          formData.append('type', acceptedFiles[0].type);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to upload file');
          }

          setStatus('analyzing');

          onAnalysisComplete(data.analysis);
          setStatus('success');
        } catch (error) {
          if (error instanceof Error) {
            const errorMessage = error.message;
            const knownErrors = [
              'INVALID_STATEMENT_FORMAT',
              'RATE_LIMIT_EXCEEDED',
              'INVALID_ANALYSIS_RESULT',
              'ANALYSIS_FAILED',
              'UNSUPPORTED_FILE_TYPE',
              'UPLOAD_FAILED',
            ] as const;

            if (
              knownErrors.includes(errorMessage as (typeof knownErrors)[number])
            ) {
              setError(errorMessage as UploadError);
              onError(errorMessage);
            } else {
              console.error('Unknown error:', errorMessage);
              setError('upload');
              onError('upload');
            }
            setStatus('error');
          } else {
            handleUploadError();
          }
        }
      }
    },
    // setState functions are stable and don't need to be dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onAnalysisComplete, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.csv', '.txt'],
      'application/vnd.ms-excel': ['.xls', '.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all ${getContainerStyles()}`}
    >
      <input
        {...getInputProps()}
        disabled={status === 'uploading' || status === 'analyzing'}
      />
      <div className="text-center">
        {error ? (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm font-medium text-red-600">
              {error === 'size'
                ? 'File is too large (max 10MB)'
                : error === 'type'
                  ? 'Unsupported file format'
                  : error === 'RATE_LIMIT_EXCEEDED'
                    ? 'The file is too large to process at the moment'
                    : error === 'INVALID_ANALYSIS_RESULT'
                      ? 'Unable to analyze this bank statement'
                      : error === 'ANALYSIS_FAILED'
                        ? 'Failed to analyze the bank statement'
                        : error === 'UNSUPPORTED_FILE_TYPE'
                          ? 'This file type is not supported'
                          : 'Upload error'}
            </p>
            <p className="text-xs text-red-500">
              Please try uploading a different file
            </p>
          </div>
        ) : status === 'uploading' ? (
          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm font-medium text-blue-600">
              Uploading file...
            </p>
            <div className="max-w-xs mx-auto">
              <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-full animate-progress" />
              </div>
            </div>
          </div>
        ) : status === 'analyzing' ? (
          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-blue-400 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium text-blue-600">
              Analyzing your data...
            </p>
            <div className="max-w-xs mx-auto space-y-2">
              <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-full animate-progress" />
              </div>
              <p className="text-xs text-blue-500">
                AI is processing your transactions
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Drag and drop your file here or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supported formats: CSV, Excel, PDF, JPG, PNG
              </p>
              <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
