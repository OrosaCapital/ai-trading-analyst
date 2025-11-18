// Legacy exports
export const logInfo = (msg: string, meta?: any): void => {
  log('info', msg, meta);
};

export const logError = (msg: string, error?: Error): void => {
  log('error', msg, error ? { error: error.message, stack: error.stack } : {});
};

// New structured logging
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function log(level: LogLevel, message: string, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  switch (level) {
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    case 'info':
      console.log(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
  }
}

export function logAPICall(
  source: string,
  symbol: string,
  statusCode: number,
  success: boolean,
  context?: Record<string, any>
): void {
  log(success ? 'info' : 'error', `API call ${success ? 'succeeded' : 'failed'}`, {
    source,
    symbol,
    statusCode,
    success,
    ...context,
  });
}

export function logRetry(
  source: string,
  symbol: string,
  attempt: number,
  maxAttempts: number,
  error: string
): void {
  log('warn', `Retry attempt ${attempt}/${maxAttempts}`, {
    source,
    symbol,
    attempt,
    maxAttempts,
    error,
  });
}

export function logFallback(
  source: string,
  symbol: string,
  fallbackType: 'cache' | 'mock' | 'last_known',
  context?: Record<string, any>
): void {
  log('warn', `Using fallback data: ${fallbackType}`, {
    source,
    symbol,
    fallbackType,
    ...context,
  });
}
