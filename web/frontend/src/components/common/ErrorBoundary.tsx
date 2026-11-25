import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-lg">
          <h1 className="font-display text-display text-error mb-md">Something went wrong.</h1>
          <p className="font-body-md text-secondary max-w-lg text-center mb-lg">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-md">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary text-on-primary font-label-bold text-label-bold px-6 py-2 rounded-full hover:opacity-90 transition-all"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="bg-surface-container border border-outline-variant text-primary font-label-bold text-label-bold px-6 py-2 rounded-full hover:border-primary transition-all"
            >
              Return Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
