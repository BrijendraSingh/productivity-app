import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Container, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              textAlign: 'center',
              gap: 2,
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
            <Typography variant="h5" gutterBottom>
              Something went wrong
            </Typography>
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </Alert>
            <Button variant="contained" onClick={this.handleReset}>
              Try Again
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
