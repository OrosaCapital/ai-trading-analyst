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
  'XLMUSDT': 'XXLMZUSD',
  'PAXGUSDT': 'PAXGUSD',  // Paxos Gold
};

// Reverse map for Kraken -> Standard format
const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KRAKEN_SYMBOL_MAP).map(([k, v]) => [v, k])
);

/**
 * Translate standard symbol (BTCUSDT) to Kraken format (XXBTZUSD)
 * 
 * AUTO-DETECTION: If symbol not found in map, attempts smart fallback:
 * 1. Try replacing USDT suffix with USD (e.g., PAXGUSDT -> PAXGUSD)
 * 2. Returns original if no pattern matches
 * 
 * This handles cases where Kraken uses USD pairs instead of USDT
 */
export function translateToKraken(symbol: string): string {
  // Check explicit mapping first
  if (KRAKEN_SYMBOL_MAP[symbol]) {
    return KRAKEN_SYMBOL_MAP[symbol];
  }
  
  // AUTO-FIX: Try common pattern - replace USDT with USD
  // Kraken often uses USD instead of USDT for many pairs
  if (symbol.endsWith('USDT')) {
    const usdVersion = symbol.replace(/USDT$/, 'USD');
    console.log(`🔄 Auto-translating ${symbol} -> ${usdVersion} (Kraken uses USD, not USDT)`);
    return usdVersion;
  }
  
  // Return original if no translation found
  console.log(`⚠️ No translation found for ${symbol}, using as-is`);
  return symbol;
}

/**
 * Translate Kraken symbol (XXBTZUSD) to standard format (BTCUSDT)
 */
export function translateFromKraken(krakenSymbol: string): string {
  return REVERSE_MAP[krakenSymbol] || krakenSymbol;
}
