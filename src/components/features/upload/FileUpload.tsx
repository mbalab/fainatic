'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';

interface FileUploadProps {
  onUploadComplete: (transactions: Transaction[]) => void;
  onError: (error: Error) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Add file size validation (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        onError(new Error('File size exceeds 10MB limit'));
        return;
      }

      setIsProcessing(true);
      try {
        logger.debug('Processing file:', file.name);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/process-file', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process file');
        }

        const { transactions } = await response.json();

        logger.debug(
          'File processed successfully:',
          transactions.length,
          'transactions found'
        );
        onUploadComplete(transactions);
      } catch (error) {
        logger.error('Error processing file:', error);
        onError(
          error instanceof Error ? error : new Error('Unknown error occurred')
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onUploadComplete, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
      }}
    >
      <input {...getInputProps()} />
      {isProcessing ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress />
          <Typography>Processing file...</Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h6" component="div">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag and drop a file here or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: CSV, XLSX, PDF, PNG, JPG (max 10MB)
          </Typography>
          <Button variant="contained" component="span">
            Select File
          </Button>
        </Box>
      )}
    </Box>
  );
};
