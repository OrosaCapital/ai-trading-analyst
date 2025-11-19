/**
 * Kraken Symbol Translation Map
 * Maps standard trading pair format (BTCUSDT) to Kraken format (XXBTZUSD)
 */

export const KRAKEN_SYMBOL_MAP: Record<string, string> = {
  'BTCUSDT': 'XXBTZUSD',
  'ETHUSDT': 'XETHZUSD',
  'XRPUSDT': 'XXRPZUSD',
  'SOLUSDT': 'SOLUSD',
  'BNBUSDT': 'BNBUSD',
  'ADAUSDT': 'ADAUSD',
  'DOGEUSDT': 'XDGUSD',
  'MATICUSDT': 'MATICUSD',
  'DOTUSDT': 'DOTUSD',
  'AVAXUSDT': 'AVAXUSD',
  'LINKUSDT': 'LINKUSD',
  'UNIUSDT': 'UNIUSD',
  'ATOMUSDT': 'ATOMUSD',
  'LTCUSDT': 'XLTCZUSD',
  'ETCUSDT': 'XETCZUSD',
};

// Reverse map for Kraken -> Standard format
const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KRAKEN_SYMBOL_MAP).map(([k, v]) => [v, k])
);

/**
 * Translate standard symbol (BTCUSDT) to Kraken format (XXBTZUSD)
 */
export function translateToKraken(symbol: string): string {
  return KRAKEN_SYMBOL_MAP[symbol] || symbol;
}

/**
 * Translate Kraken symbol (XXBTZUSD) to standard format (BTCUSDT)
 */
export function translateFromKraken(krakenSymbol: string): string {
  return REVERSE_MAP[krakenSymbol] || krakenSymbol;
}
