/**
 * Coinglass Service with retry, backoff, and fallback logic
 */

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Execute an API call with exponential backoff retry
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: { endpoint: string; symbol: string }
): Promise<T> {
  const { log } = await import('../monitoring/logger.ts');
  const { trackMetric } = await import('../monitoring/metrics.ts');
  
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      log('info', `Attempt ${attempt}/${config.maxRetries} for ${context.endpoint}`, {
        symbol: context.symbol,
        endpoint: context.endpoint,
        attempt,
      });

      const result = await fn();
      
      // Success - track metric
      trackMetric('coinglass_success_count', 1, {
        endpoint: context.endpoint,
        symbol: context.symbol,
      });
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      log('warn', `Attempt ${attempt} failed for ${context.endpoint}`, {
        symbol: context.symbol,
        endpoint: context.endpoint,
        attempt,
        error: lastError.message,
      });

      // Track failure metric
      trackMetric('coinglass_failure_count', 1, {
        endpoint: context.endpoint,
        symbol: context.symbol,
        attempt: attempt.toString(),
      });

      // If this was the last attempt, don't delay
      if (attempt === config.maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 * delay;
      const waitTime = Math.min(delay + jitter, config.maxDelay);
      
      log('info', `Retrying after ${waitTime.toFixed(0)}ms`, {
        symbol: context.symbol,
        endpoint: context.endpoint,
        waitTime,
      });

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= config.backoffMultiplier;
    }
  }

  // All retries exhausted
  log('error', `All retries exhausted for ${context.endpoint}`, {
    symbol: context.symbol,
    endpoint: context.endpoint,
    finalError: lastError?.message,
  });

  throw lastError || new Error('All retries failed');
}

/**
 * Fetch from Coinglass with retry and fallback to cache
 */
export async function fetchCoinglassWithRetry(
  endpoint: string,
  symbol: string,
  params: Record<string, string>,
  apiKey: string,
  supabaseClient: any
): Promise<any> {
  const { log } = await import('../monitoring/logger.ts');
  const { trackMetric } = await import('../monitoring/metrics.ts');
  const { getCachedData, setCachedData } = await import('../middleware/cacheMiddleware.ts');
  const { fetchFromCoinglassV2 } = await import('../coinglassClient.ts');

  const cacheKey = `coinglass_${endpoint}_${symbol}`;

  try {
    // Try to fetch with retry
    const data = await withRetry(
      () => fetchFromCoinglassV2(endpoint, params, apiKey),
      DEFAULT_RETRY_CONFIG,
      { endpoint, symbol }
    );

    // Cache successful response
    await setCachedData(supabaseClient, cacheKey, data, 60); // 60 second TTL

    return data;
  } catch (error) {
    log('error', 'Coinglass call failed after all retries, checking cache', {
      symbol,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    trackMetric('derivatives_na_count', 1, {
      endpoint,
      symbol,
      reason: 'all_retries_failed',
    });

    // Try to get cached data as fallback
    const cached = await getCachedData(supabaseClient, cacheKey, 300); // Accept cache up to 5 min old
    
    if (cached) {
      log('info', 'Serving stale cached data as fallback', {
        symbol,
        endpoint,
        cacheAge: Date.now() - cached.timestamp,
      });

      trackMetric('cache_fallback_count', 1, {
        endpoint,
        symbol,
      });

      return {
        ...cached.data,
        _cached: true,
        _cacheAge: Date.now() - cached.timestamp,
      };
    }

    // No cache available - throw error
    log('error', 'No cached data available for fallback', {
      symbol,
      endpoint,
    });

    throw error;
  }
}
