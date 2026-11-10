import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full overflow-auto border border-red-500/30">
            <p className="text-xl mb-4 font-semibold text-red-400">Error Details:</p>
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
              {this.state.error?.toString()}
            </pre>
            <p className="mt-6 text-gray-400 text-sm">
              Please check the console for more details.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
