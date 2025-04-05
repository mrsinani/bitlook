import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You can also log to an error reporting service here
    // Example: reportError(error, errorInfo);
  }

  private resetErrorBoundary = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 border border-red-300 rounded-md bg-red-50 text-red-800">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <details className="text-sm mb-4">
            <summary>Error details</summary>
            <p className="mt-2 font-mono text-xs whitespace-pre-wrap">
              {this.state.error?.toString() || 'Unknown error'}
            </p>
            {this.state.errorInfo && (
              <pre className="mt-2 overflow-auto p-2 bg-gray-100 text-xs">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </details>
          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <button 
              className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
              onClick={this.resetErrorBoundary}
            >
              Try to Recover
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 