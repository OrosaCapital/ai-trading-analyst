import { logErrorToSystem, logWarningToSystem } from '@/store/useSystemAlertsStore';

// Suppress Lovable's error dialog by handling errors globally
export function setupGlobalErrorHandlers() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    event.preventDefault(); // Prevent default error dialog
    
    const error = event.error || new Error(event.message);
    logErrorToSystem(error, `Global: ${event.filename}:${event.lineno}`);
    
    console.error('Global error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault(); // Prevent default error dialog
    
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logErrorToSystem(error, 'Unhandled Promise');
    
    console.error('Unhandled promise rejection:', event.reason);
  });

  // Handle console.error to capture all errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Check if this is a significant error worth logging
    const errorMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    // Filter out noise (e.g., React dev warnings)
    if (!errorMessage.includes('Warning:') && 
        !errorMessage.includes('Download the React DevTools')) {
      
      // Check for WebSocket errors
      if (errorMessage.includes('WebSocket')) {
        logWarningToSystem(
          'WebSocket Issue',
          'Connection issue detected - will auto-reconnect',
          'WebSocket'
        );
      } else {
        logWarningToSystem(
          'Console Error',
          errorMessage.slice(0, 200),
          'Console'
        );
      }
    }
    
    // Still log to console for debugging
    originalConsoleError.apply(console, args);
  };
}

// Export for use in edge functions or API calls
export function logAPIError(
  endpoint: string,
  error: Error,
  statusCode?: number
) {
  logErrorToSystem(
    error,
    `API: ${endpoint}${statusCode ? ` (${statusCode})` : ''}`
  );
}