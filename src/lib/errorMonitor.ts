import { logErrorToSystem, logWarningToSystem } from "@/store/useSystemAlertsStore";

// Global error monitoring setup
export const initializeErrorMonitoring = () => {
  // Capture uncaught errors
  window.addEventListener('error', (event) => {
    logErrorToSystem(
      new Error(event.message),
      event.filename ? `${event.filename}:${event.lineno}` : 'Global'
    );
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logErrorToSystem(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      'Promise Rejection'
    );
  });

  // Override console.error to capture all console errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original console.error
    originalConsoleError.apply(console, args);
    
    // Log to system alerts
    const errorMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    // Extract source if available
    const errorObj = args.find(arg => arg instanceof Error);
    const source = errorObj?.stack?.split('\n')[1]?.trim() || 'Console';
    
    logErrorToSystem(
      new Error(errorMessage.substring(0, 200)), // Limit message length
      source
    );
  };

  // Override console.warn to capture warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);
    
    const warningMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    logWarningToSystem(
      'System Warning',
      warningMessage.substring(0, 200),
      'Console'
    );
  };

  console.info('🔍 Error monitoring initialized');
};

// Cleanup function
export const cleanupErrorMonitoring = () => {
  // Note: In a real implementation, you'd need to store references to remove listeners
  console.info('🔍 Error monitoring cleaned up');
};
