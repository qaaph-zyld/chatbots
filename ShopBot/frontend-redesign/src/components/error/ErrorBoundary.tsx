'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Analytics } from '@/lib/analytics/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnChange?: any[];
  showResetButton?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  errorBoundaryKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * A component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Track error in analytics
    Analytics.trackEvent('error_boundary_triggered', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      location: window.location.href
    });
    
    this.setState({ errorInfo });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // If resetOnChange props have changed, reset the error boundary
    if (
      this.state.hasError &&
      this.props.resetOnChange &&
      prevProps.resetOnChange &&
      this.props.resetOnChange.some((value, index) => value !== prevProps.resetOnChange![index])
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Track reset in analytics
    Analytics.trackEvent('error_boundary_reset', {
      location: window.location.href
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback 
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
          showResetButton={this.props.showResetButton}
          showHomeButton={this.props.showHomeButton}
          showBackButton={this.props.showBackButton}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetErrorBoundary: () => void;
  showResetButton?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

/**
 * Default fallback UI component that is displayed when an error occurs
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetErrorBoundary,
  showResetButton = true,
  showHomeButton = true,
  showBackButton = true
}) => {
  const router = useRouter();

  const goHome = () => {
    router.push('/');
  };

  const goBack = () => {
    router.back();
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We've encountered an unexpected error
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-sm font-medium">Error details:</div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm font-mono overflow-auto max-h-[200px]">
              {error.toString()}
              {errorInfo && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {errorInfo.componentStack}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please try refreshing the page or returning to the home page.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {showResetButton && (
            <Button 
              variant="outline" 
              onClick={resetErrorBoundary}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Button 
              variant="default" 
              onClick={goHome}
              className="flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
          )}
          {showBackButton && (
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

/**
 * A hook that creates a key for ErrorBoundary based on provided dependencies
 * This is useful for resetting the ErrorBoundary when certain dependencies change
 */
export function useErrorBoundaryKey(dependencies: any[] = []): string {
  const [key, setKey] = React.useState(0);
  
  React.useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, dependencies);
  
  return `error-boundary-${key}`;
}

/**
 * A wrapper component that provides an ErrorBoundary with a key
 * This is useful for resetting the ErrorBoundary when certain dependencies change
 */
export function ErrorBoundary({ 
  children, 
  resetOnChange, 
  errorBoundaryKey,
  ...props 
}: Props): JSX.Element {
  const key = errorBoundaryKey || (resetOnChange ? resetOnChange.join('-') : undefined);
  
  return (
    <ErrorBoundaryClass key={key} resetOnChange={resetOnChange} {...props}>
      {children}
    </ErrorBoundaryClass>
  );
}

export default ErrorBoundary;
