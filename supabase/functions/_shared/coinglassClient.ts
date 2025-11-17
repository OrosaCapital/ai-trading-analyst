import { rateLimiter } from './rateLimiter.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

// Cache for endpoint lookups (reduce DB queries)
const endpointCache = new Map<string, {
  endpoint_path: string;
  base_url: string;
  cached_at: number;
}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch endpoint from database with caching
async function getEndpoint(endpointKey: string): Promise<{ path: string; baseUrl: string }> {
  // Check cache first
  const cached = endpointCache.get(endpointKey);
  if (cached && Date.now() - cached.cached_at < CACHE_TTL) {
    return { path: cached.endpoint_path, baseUrl: cached.base_url };
  }

  // Query database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase
    .from('coinglass_api_endpoints')
    .select('endpoint_path, base_url')
    .eq('endpoint_key', endpointKey)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error(`Endpoint lookup failed for ${endpointKey}:`, error);
    throw new Error(`CoinGlass endpoint '${endpointKey}' not found in database`);
  }

  // Update cache
  endpointCache.set(endpointKey, {
    endpoint_path: data.endpoint_path,
    base_url: data.base_url,
    cached_at: Date.now(),
  });

  return { path: data.endpoint_path, baseUrl: data.base_url };
}

// Exponential backoff retry logic for 429 errors
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  await rateLimiter.waitForSlot(); // Wait for rate limit slot

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited (429), waiting ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Return response for caller to handle
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Request failed, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Max retries exceeded');
}

// NEW: Fetch using endpoint key from database
export async function fetchFromCoinglassV2(
  endpointKey: string,
  queryParams: Record<string, string>,
  apiKey: string
): Promise<any> {
  const { path, baseUrl } = await getEndpoint(endpointKey);
  
  // Build query string
  const queryString = new URLSearchParams(queryParams).toString();
  const fullEndpoint = `${path}?${queryString}`;
  
  console.log(`CoinGlass API call [${endpointKey}]: ${fullEndpoint}`);
  const stats = rateLimiter.getStats();
  console.log(`Rate limit: ${stats.requestsInWindow}/${stats.maxRequests} (${stats.slotsAvailable} slots available)`);

  const response = await fetchWithRetry(`${baseUrl}${fullEndpoint}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'CG-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`CoinGlass API error [${endpointKey}]: ${response.status} - ${errorText}`);
    throw new Error(`CoinGlass API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// KEEP OLD METHOD for backward compatibility
export async function fetchFromCoinglass(
  endpoint: string,
  apiKey: string
): Promise<any> {
  const url = `https://open-api-v4.coinglass.com${endpoint}`;
  
  console.log(`CoinGlass API call: ${endpoint}`);
  const stats = rateLimiter.getStats();
  console.log(`Rate limit: ${stats.requestsInWindow}/${stats.maxRequests} (${stats.slotsAvailable} slots available)`);

  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'CG-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`CoinGlass API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
