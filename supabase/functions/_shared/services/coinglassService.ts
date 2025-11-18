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
  maxRetries: 2,
  initialDelay: 500,
  maxDelay: 3000,
  backoffMultiplier: 2,
};

/**
 * Execute an API call with exponential backoff retry
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: { endpoint: string; symbol: string },
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxRetries) break;

      const jitter = Math.random() * 0.3 * delay;
      const waitTime = Math.min(delay + jitter, config.maxDelay);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= config.backoffMultiplier;
    }
  }

  throw lastError || new Error("All retries failed");
}

/**
 * Fetch from Coinglass with retry and fallback to cache
 */
export async function fetchCoinglassWithRetry(
  endpoint: string,
  symbol: string,
  params: Record<string, string>,
  apiKey: string,
  supabaseClient: any,
): Promise<any> {
  const { getCachedData, setCachedData } = await import("../middleware/cacheMiddleware.ts");
  const { fetchFromCoinglassV2 } = await import("../coinglassClient.ts");

  const cacheKey = `coinglass_${endpoint}_${symbol}`;

  try {
    const data = await withRetry(() => fetchFromCoinglassV2(endpoint, params, apiKey), DEFAULT_RETRY_CONFIG, {
      endpoint,
      symbol,
    });

    await setCachedData(supabaseClient, cacheKey, data, 60);
    return data;
  } catch (_) {
    const cached = await getCachedData(supabaseClient, cacheKey, 300);
    if (cached) {
      return {
        ...cached.data,
        _cached: true,
        _cacheAge: Date.now() - cached.timestamp,
      };
    }
    throw _;
  }
}
