'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type UploadError = 'size' | 'type' | 'upload' | null;
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export const FileUpload = () => {
  const [error, setError] = useState<UploadError>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.file.size > MAX_FILE_SIZE) {
          setError('size');
          setStatus('error');
          return;
        }
        setError('type');
        setStatus('error');
        return;
      }

      if (acceptedFiles.length > 0) {
        setError(null);
        setStatus('uploading');
        // TODO: Добавим загрузку файла позже
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
        error
          ? 'border-red-500 bg-red-50/50'
          : status === 'uploading'
            ? 'border-blue-500 bg-blue-50/50'
            : isDragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-gray-300 hover:border-blue-400'
      }`}
    >
      <input {...getInputProps()} disabled={status === 'uploading'} />
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
                : 'Unsupported file format'}
            </p>
            <p className="text-xs text-red-500">
              Please try again with a valid file
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
        ) : (
          <div className="text-center">
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
            <p className="mt-4 text-sm text-gray-600">
              {isDragActive
                ? 'Drop your bank statement here'
                : 'Drag and drop your bank statement, or click to select'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Supported formats: CSV, XLS/XLSX, PDF
            </p>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
