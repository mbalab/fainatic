'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Transaction } from '@/types';
import { logger } from '@/utils/logger';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0037FF',
    },
  },
});

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

      // Validate PDF files
      if (file.type === 'application/pdf') {
        // Check if it's not an empty file
        if (file.size === 0) {
          onError(new Error('PDF file is empty'));
          return;
        }
      }

      setIsProcessing(true);
      try {
        logger.debug('Processing file:', file.name, 'type:', file.type);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process file');
        }

        const { transactions } = await response.json();

        if (!transactions || transactions.length === 0) {
          throw new Error('No transactions found in file');
        }

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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
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
    noClick: true, // Disable click on the entire zone
  });

  return (
    <ThemeProvider theme={theme}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? '#0037FF' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          bgcolor: isDragActive ? 'rgba(0, 55, 255, 0.04)' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: '#0037FF',
            bgcolor: 'rgba(0, 55, 255, 0.04)',
          },
        }}
      >
        <input {...getInputProps()} />
        {isProcessing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#0037FF', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & drop your bank statement here
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              or
            </Typography>
            <Button
              onClick={open}
              variant="contained"
              sx={{
                bgcolor: '#0037FF',
                '&:hover': {
                  bgcolor: 'rgba(0, 55, 255, 0.9)',
                },
              }}
            >
              Browse Files
            </Button>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Supported formats: CSV, XLSX, PDF, PNG, JPG
            </Typography>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
};
