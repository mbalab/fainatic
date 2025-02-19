'use client';

import React, { useCallback, useState, useEffect } from 'react';
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
  const [fileId, setFileId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Poll for file processing status
  const startPolling = useCallback(
    (id: string) => {
      setFileId(id);
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/file/process?file_id=${id}`);
          
          if (!response.ok) {
            if (response.status === 404) {
              // File was processed and deleted, stop polling
              clearInterval(interval);
              setPollInterval(null);
              setFileId(null);
              setIsProcessing(false);
              return;
            }
            throw new Error('Processing failed');
          }

          const data = await response.json();
          
          if (data.transactions) {
            clearInterval(interval);
            setPollInterval(null);
            setFileId(null);
            setIsProcessing(false);
            onUploadComplete(data.transactions);
          }
        } catch (error) {
          clearInterval(interval);
          setPollInterval(null);
          setFileId(null);
          setIsProcessing(false);
          onError(error instanceof Error ? error : new Error('Processing failed'));
        }
      }, 2000);

      setPollInterval(interval);
    },
    [onUploadComplete, onError]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        onError(new Error('File size exceeds 10MB limit'));
        return;
      }

      if (file.type === 'application/pdf' && file.size === 0) {
        onError(new Error('PDF file is empty'));
        return;
      }

      setIsProcessing(true);
      try {
        logger.debug('Uploading file:', file.name, 'type:', file.type);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/file/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload file');
        }

        const { file_id } = await response.json();
        
        if (!file_id) {
          throw new Error('No file ID received');
        }

        startPolling(file_id);
      } catch (error) {
        logger.error('Error uploading file:', error);
        setIsProcessing(false);
        onError(
          error instanceof Error ? error : new Error('Unknown error occurred')
        );
      }
    },
    [onUploadComplete, onError, startPolling]
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
    noClick: true,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography color="textSecondary">
              {fileId ? 'Processing file...' : 'Uploading file...'}
            </Typography>
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
