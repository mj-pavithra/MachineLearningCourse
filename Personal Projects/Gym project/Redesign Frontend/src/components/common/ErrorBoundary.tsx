import React, { Component, ReactNode } from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { ModernButton } from '@/components/ui/ModernButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching route-level errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={8} textAlign="center">
          <VStack gap={4}>
            <Heading size="lg">Something went wrong</Heading>
            <Text color="gray.600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <ModernButton onClick={this.handleReset} colorPalette="blue">
              Try Again
            </ModernButton>
            <ModernButton
              variant="ghost"
              onClick={() => (window.location.href = '/dashboard')}
            >
              Go to Dashboard
            </ModernButton>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

