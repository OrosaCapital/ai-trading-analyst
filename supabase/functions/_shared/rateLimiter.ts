// Global rate limiter to track and throttle CoinGlass API calls
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 25; // Stay under 30/min limit with buffer
  private readonly windowMs = 60000; // 1 minute window

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      console.log(`Rate limit reached: ${this.requests.length}/${this.maxRequests} requests in last minute`);
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  async waitForSlot(): Promise<void> {
    let attempts = 0;
    while (!(await this.checkLimit())) {
      attempts++;
      const waitTime = Math.min(2000 * attempts, 10000); // Progressive wait up to 10s
      console.log(`Waiting ${waitTime}ms for rate limit slot (attempt ${attempts})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  getStats() {
    const now = Date.now();
    const recentRequests = this.requests.filter(t => now - t < this.windowMs);
    return {
      requestsInWindow: recentRequests.length,
      maxRequests: this.maxRequests,
      slotsAvailable: this.maxRequests - recentRequests.length
    };
  }
}

export const rateLimiter = new RateLimiter();

// Request queue to prevent duplicate simultaneous calls
const requestQueue = new Map<string, Promise<any>>();

export async function queuedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // If request is already in flight, reuse it
  if (requestQueue.has(key)) {
    console.log(`Reusing in-flight request for: ${key}`);
    return await requestQueue.get(key);
  }

  const promise = fetcher();
  requestQueue.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up after request completes
    requestQueue.delete(key);
  }
}
