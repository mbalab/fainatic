'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          500
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Something went wrong!
        </Typography>
        <Typography color="text.secondary" paragraph>
          We apologize for the inconvenience. Please try again later.
        </Typography>
        <Button onClick={reset} variant="contained" color="primary">
          Try Again
        </Button>
      </Box>
    </Container>
  );
} 