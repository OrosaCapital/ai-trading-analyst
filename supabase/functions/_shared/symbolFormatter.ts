/**
 * Symbol formatting utilities for API calls
 */

/**
 * Format symbol for Coinglass derivatives APIs
 * Coinglass Hobbyist plan only supports major perpetual USDT pairs
 * @param symbol - Base symbol (e.g., BTC, ETH, XLM)
 * @returns Formatted symbol for Coinglass (e.g., BTCUSDT)
 */
export function formatForCoinglass(symbol: string): string {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '');
  return `${cleanSymbol}USDT`;
}

/**
 * Check if a symbol is supported by Coinglass Hobbyist plan
 * Hobbyist plan typically only supports major coins with USDT perpetuals
 * @param symbol - Symbol to check
 * @returns true if likely supported
 */
export function isCoinglassSupported(symbol: string): boolean {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '');
  const majorCoins = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'MATIC', 'DOT', 'AVAX'];
  return majorCoins.includes(cleanSymbol);
}

/**
 * Get a user-friendly message for unsupported symbols
 * @param symbol - The unsupported symbol
 * @returns Error message explaining the limitation
 */
export function getUnsupportedMessage(symbol: string): string {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '');
  return `${cleanSymbol} derivatives data requires a higher Coinglass API plan. Upgrade to access data for this symbol.`;
}
