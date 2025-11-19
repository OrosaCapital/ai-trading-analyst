/**
 * Kraken Pair Discovery
 * Fetches and caches available trading pairs from Kraken API
 */

let cachedPairs: string[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Load supported pairs from Kraken (cached for 24h)
 */
export async function loadKrakenPairs(): Promise<string[]> {
  const now = Date.now();
  
  // Return cache if valid
  if (cachedPairs.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedPairs;
  }
  
  try {
    console.log('📡 Fetching available trading pairs from Kraken...');
    const response = await fetch('https://api.kraken.com/0/public/AssetPairs');
    const data = await response.json();
    
    if (data.error && data.error.length > 0) {
      console.error('Kraken AssetPairs error:', data.error);
      return cachedPairs; // Return old cache on error
    }
    
    // Extract pair names
    cachedPairs = Object.keys(data.result || {});
    cacheTimestamp = now;
    
    console.log(`✅ Loaded ${cachedPairs.length} trading pairs from Kraken`);
    return cachedPairs;
  } catch (error) {
    console.error('Failed to fetch Kraken pairs:', error);
    return cachedPairs; // Return old cache on error
  }
}

/**
 * Check if a specific pair is supported by Kraken
 */
export async function isPairSupported(krakenSymbol: string): Promise<boolean> {
  const pairs = await loadKrakenPairs();
  return pairs.includes(krakenSymbol);
}
