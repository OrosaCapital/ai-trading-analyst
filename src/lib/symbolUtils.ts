/**
 * Utility functions for normalizing cryptocurrency symbols
 */

/**
 * Normalize a symbol by removing USD/USDT suffix
 * Examples: BTCUSD -> BTC, ETHUSDT -> ETH, XRP -> XRP
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  return symbol.toUpperCase().replace(/USD$|USDT$/, '');
}

/**
 * Add USD suffix to a symbol
 * Examples: BTC -> BTCUSD, ETH -> ETHUSD
 */
export function addUsdSuffix(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  return `${normalized}USD`;
}
