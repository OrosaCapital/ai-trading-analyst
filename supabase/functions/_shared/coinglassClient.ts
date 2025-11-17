import { rateLimiter } from './rateLimiter.ts';

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

// Helper to fetch from CoinGlass API with rate limiting
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
