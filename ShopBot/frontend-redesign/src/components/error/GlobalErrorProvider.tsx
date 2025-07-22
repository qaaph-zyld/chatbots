'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ErrorHandler, ErrorSeverity, StructuredError } from '@/lib/error/ErrorHandlingService';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { AlertCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

// Context for global error state
interface ErrorContextType {
  errors: StructuredError[];
  clearErrors: () => void;
  clearError: (timestamp: number) => void;
  hasErrors: boolean;
  lastError: StructuredError | null;
}

const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  clearErrors: () => {},
  clearError: () => {},
  hasErrors: false,
  lastError: null
});

/**
 * Hook to access the error context
 */
export const useErrorContext = () => useContext(ErrorContext);

interface GlobalErrorProviderProps {
  children: ReactNode;
  showErrorNotifications?: boolean;
}

/**
 * Provider component that wraps the application with error handling capabilities
 */
export function GlobalErrorProvider({
  children,
  showErrorNotifications = true
}: GlobalErrorProviderProps) {
  const [errors, setErrors] = useState<StructuredError[]>([]);
  const { toast } = useToast();

  // Clear all errors
  const clearErrors = () => {
    setErrors([]);
    ErrorHandler.clearErrorHistory();
  };

  // Clear a specific error by timestamp
  const clearError = (timestamp: number) => {
    setErrors(prevErrors => prevErrors.filter(error => error.timestamp !== timestamp));
  };

  // Subscribe to error events from the ErrorHandler
  useEffect(() => {
    const unsubscribe = ErrorHandler.addErrorListener((error) => {
      setErrors(prevErrors => [error, ...prevErrors]);

      if (showErrorNotifications) {
        showErrorNotification(error);
      }
    });

    // Initial error history
    setErrors(ErrorHandler.getErrorHistory());

    return unsubscribe;
  }, [showErrorNotifications]);

  // Show toast notification for errors
  const showErrorNotification = (error: StructuredError) => {
    // Skip notifications for info level errors
    if (error.severity === ErrorSeverity.INFO) {
      return;
    }

    const severityConfig = getSeverityConfig(error.severity);

    toast({
      title: severityConfig.title,
      description: error.message,
      variant: severityConfig.variant as any,
      duration: severityConfig.duration,
      action: error.severity !== ErrorSeverity.FATAL ? (
        <ToastAction altText="Dismiss">Dismiss</ToastAction>
      ) : undefined,
      icon: severityConfig.icon
    });
  };

  // Get configuration based on error severity
  const getSeverityConfig = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.FATAL:
        return {
          title: 'Critical Error',
          variant: 'destructive',
          duration: 10000, // 10 seconds for fatal errors
          icon: <XCircle className="h-5 w-5" />
        };
      case ErrorSeverity.ERROR:
        return {
          title: 'Error',
          variant: 'destructive',
          duration: 5000,
          icon: <AlertCircle className="h-5 w-5" />
        };
      case ErrorSeverity.WARNING:
        return {
          title: 'Warning',
          variant: 'warning',
          duration: 4000,
          icon: <AlertTriangle className="h-5 w-5" />
        };
      case ErrorSeverity.INFO:
      default:
        return {
          title: 'Information',
          variant: 'default',
          duration: 3000,
          icon: <Info className="h-5 w-5" />
        };
    }
  };

  // Set up global window error handlers
  useEffect(() => {
    // Handle uncaught errors
    const handleWindowError = (event: ErrorEvent) => {
      ErrorHandler.handleError(
        event.error || new Error(event.message),
        ErrorSeverity.ERROR,
        {
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: 'window.onerror'
          }
        }
      );
      
      // Prevent default browser error handling
      event.preventDefault();
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      
      ErrorHandler.handleError(error, ErrorSeverity.ERROR, {
        context: {
          type: 'unhandledrejection',
          reason: String(event.reason)
        }
      });
      
      // Prevent default browser error handling
      event.preventDefault();
    };

    // Add event listeners
    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Context value
  const contextValue = {
    errors,
    clearErrors,
    clearError,
    hasErrors: errors.length > 0,
    lastError: errors.length > 0 ? errors[0] : null
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          ErrorHandler.handleError(error, ErrorSeverity.ERROR, {
            context: {
              componentStack: errorInfo.componentStack,
              type: 'react-error-boundary'
            }
          });
        }}
      >
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
}

/**
 * Higher-order component that wraps a component with error handling
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const WithErrorHandling: React.FC<P> = (props) => {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Set display name for debugging
  WithErrorHandling.displayName = `WithErrorHandling(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WithErrorHandling;
}

export default GlobalErrorProvider;
