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

/**
 * Symbol support matrix for Coinglass Hobbyist plan
 * Based on actual API behavior observed in production
 */

// Symbols supported for MOST derivatives endpoints
const MAJOR_DERIVATIVES_SYMBOLS = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'MATIC', 'DOT', 'AVAX'];

// Symbols with broader support (works for long/short, taker volume, liquidations)
const EXTENDED_SYMBOLS = [...MAJOR_DERIVATIVES_SYMBOLS, 'XLM', 'LINK', 'UNI', 'ATOM', 'LTC'];

/**
 * Check if a symbol is supported for a specific Coinglass endpoint
 * @param symbol - Base symbol (e.g., BTC, ETH, XLM)
 * @param endpoint - Endpoint identifier (e.g., 'rsi', 'funding_rate', 'open_interest')
 * @returns { supported: boolean, reason?: string }
 */
export function isEndpointSupported(symbol: string, endpoint: string): { supported: boolean; reason?: string } {
  const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '');
  
  // Endpoint-specific support mapping
  const endpointSupport: Record<string, string[]> = {
    // BLOCKED for non-major coins in Hobbyist
    'rsi': MAJOR_DERIVATIVES_SYMBOLS,
    'funding_rate': MAJOR_DERIVATIVES_SYMBOLS,
    'open_interest': MAJOR_DERIVATIVES_SYMBOLS,
    'futures_basis': MAJOR_DERIVATIVES_SYMBOLS,
    
    // BROADER support (includes XLM and others)
    'long_short_ratio': EXTENDED_SYMBOLS,
    'taker_volume': EXTENDED_SYMBOLS,
    'liquidations': EXTENDED_SYMBOLS,
    'funding_rate_list': EXTENDED_SYMBOLS,
  };
  
  const supportedSymbols = endpointSupport[endpoint];
  
  if (!supportedSymbols) {
    // Unknown endpoint - allow call to proceed (fail gracefully)
    return { supported: true };
  }
  
  const isSupported = supportedSymbols.includes(cleanSymbol);
  
  if (!isSupported) {
    return {
      supported: false,
      reason: `${cleanSymbol} requires Coinglass Standard or Professional plan for ${endpoint} data. Hobbyist plan only supports: ${supportedSymbols.slice(0, 5).join(', ')}${supportedSymbols.length > 5 ? `, and ${supportedSymbols.length - 5} more` : ''}.`
    };
  }
  
  return { supported: true };
}

/**
 * Create a standard "N/A" response for blocked endpoints
 */
export function createBlockedEndpointResponse(symbol: string, endpoint: string, reason: string) {
  return {
    available: false,
    blocked: true,
    reason: reason,
    upgradeRequired: true,
    data: null,
    symbol: symbol,
    endpoint: endpoint,
    message: `Data unavailable - ${reason}`
  };
}
