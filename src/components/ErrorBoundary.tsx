import React, { Component, ReactNode } from 'react';
import { logErrorToSystem } from '@/store/useSystemAlertsStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to admin dashboard instead of showing dialog
    logErrorToSystem(error, 'React Error Boundary');
    
    console.error('Error caught by boundary:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or null to hide error dialog
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}