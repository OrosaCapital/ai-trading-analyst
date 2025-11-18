/**
 * Tatum Service with retry and fallback logic
 */

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

/**
 * Fetch from Tatum with retry logic
 */
export async function fetchTatumPriceWithRetry(
  symbol: string,
  tatumApiKey: string
): Promise<any> {
  const { log } = await import('../monitoring/logger.ts');
  const { trackMetric } = await import('../monitoring/metrics.ts');
  
  let lastError: Error | null = null;
  let delay = DEFAULT_RETRY_CONFIG.initialDelay;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      log('info', `Tatum attempt ${attempt}/${DEFAULT_RETRY_CONFIG.maxRetries}`, {
        symbol,
        attempt,
      });

      const response = await fetch(
        `https://api.tatum.io/v3/tatum/rate/${symbol}?basePair=USD`,
        {
          headers: {
            'x-api-key': tatumApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Tatum API returned ${response.status}`);
      }

      const data = await response.json();
      
      trackMetric('tatum_success_count', 1, { symbol });
      
      return data;
    } catch (error) {
      lastError = error as Error;
      
      log('warn', `Tatum attempt ${attempt} failed`, {
        symbol,
        attempt,
        error: lastError.message,
      });

      trackMetric('tatum_failure_count', 1, {
        symbol,
        attempt: attempt.toString(),
      });

      if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
        break;
      }

      const jitter = Math.random() * 0.3 * delay;
      const waitTime = Math.min(delay + jitter, DEFAULT_RETRY_CONFIG.maxDelay);

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= DEFAULT_RETRY_CONFIG.backoffMultiplier;
    }
  }

  log('error', 'Tatum retries exhausted', {
    symbol,
    finalError: lastError?.message,
  });

  throw lastError || new Error('Tatum retries failed');
}
