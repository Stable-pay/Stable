import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ApiError } from '@/lib/queryClient';

interface ErrorDisplayProps {
  error: Error | ApiError | unknown;
  onRetry?: () => void;
  className?: string;
  showDetails?: boolean;
}

/**
 * User-friendly error display component that handles different error types
 */
export function ErrorDisplay({ error, onRetry, className, showDetails = false }: ErrorDisplayProps) {
  // Determine if we're online
  const isOnline = navigator.onLine;

  // Extract error information
  const getErrorInfo = () => {
    if (error instanceof ApiError) {
      return {
        title: getErrorTitle(error.code),
        message: error.getUserMessage(),
        code: error.code,
        requestId: error.requestId,
        canRetry: error.statusCode >= 500 || error.code === 'REQUEST_TIMEOUT'
      };
    }

    if (error instanceof Error) {
      // Handle network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          code: 'NETWORK_ERROR',
          canRetry: true
        };
      }

      return {
        title: 'Error',
        message: error.message,
        code: 'UNKNOWN_ERROR',
        canRetry: true
      };
    }

    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      canRetry: true
    };
  };

  const errorInfo = getErrorInfo();

  const getErrorTitle = (code: string): string => {
    switch (code) {
      case 'VALIDATION_ERROR':
        return 'Invalid Input';
      case 'NOT_FOUND':
        return 'Not Found';
      case 'UNAUTHORIZED':
        return 'Access Denied';
      case 'FORBIDDEN':
        return 'Permission Denied';
      case 'REQUEST_TIMEOUT':
        return 'Request Timeout';
      case 'EXTERNAL_SERVICE_ERROR':
        return 'Service Unavailable';
      case 'NETWORK_ERROR':
        return 'Connection Error';
      default:
        return 'Error';
    }
  };

  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }

    if (errorInfo.code === 'NETWORK_ERROR' || errorInfo.code === 'REQUEST_TIMEOUT') {
      return <Wifi className="h-4 w-4" />;
    }

    return <AlertTriangle className="h-4 w-4" />;
  };

  const getVariant = (): "default" | "destructive" => {
    if (errorInfo.canRetry || errorInfo.code === 'VALIDATION_ERROR') {
      return 'default';
    }
    return 'destructive';
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {getIcon()}
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>{errorInfo.message}</p>
          
          {/* Offline indicator */}
          {!isOnline && (
            <p className="text-sm text-orange-600 dark:text-orange-400">
              You appear to be offline. Please check your internet connection.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {onRetry && errorInfo.canRetry && (
              <Button 
                onClick={onRetry} 
                size="sm" 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            )}
          </div>

          {/* Debug information (dev mode only) */}
          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-sm cursor-pointer text-gray-600 dark:text-gray-400">
                Debug Information
              </summary>
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                <div>Code: {errorInfo.code}</div>
                {errorInfo.requestId && <div>Request ID: {errorInfo.requestId}</div>}
                {error instanceof Error && (
                  <div className="mt-2">
                    <div>Stack: {error.stack}</div>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Simple error boundary for React components
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <ErrorDisplay 
          error={this.state.error} 
          onRetry={this.retry}
          showDetails={true}
          className="m-4"
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async operation errors with user feedback
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | ApiError | null>(null);

  const handleError = React.useCallback((err: Error | ApiError | unknown) => {
    console.error('Handled error:', err);
    
    if (err instanceof Error || err instanceof ApiError) {
      setError(err);
    } else {
      setError(new Error('An unknown error occurred'));
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null
  };
}