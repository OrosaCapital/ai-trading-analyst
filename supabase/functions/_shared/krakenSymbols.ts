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
 * Convert Kraken symbol to WebSocket v1 API format with slash
 * Example: XXBTZUSD -> XBT/USD
 */
export function toKrakenWSFormat(krakenSymbol: string): string {
  // Common Kraken WebSocket v1 API pair formats
  const wsFormatMap: Record<string, string> = {
    'XXBTZUSD': 'XBT/USD',
    'XETHZUSD': 'ETH/USD',
    'XXRPZUSD': 'XRP/USD',
    'SOLUSD': 'SOL/USD',
    'BNBUSD': 'BNB/USD',
    'ADAUSD': 'ADA/USD',
    'XDGUSD': 'DOGE/USD',
    'MATICUSD': 'MATIC/USD',
    'DOTUSD': 'DOT/USD',
    'AVAXUSD': 'AVAX/USD',
    'LINKUSD': 'LINK/USD',
    'UNIUSD': 'UNI/USD',
    'ATOMUSD': 'ATOM/USD',
    'XLTCZUSD': 'LTC/USD',
    'XETCZUSD': 'ETC/USD',
    'XXLMZUSD': 'XLM/USD',
    'PAXGUSD': 'PAXG/USD',
  };
  
  if (wsFormatMap[krakenSymbol]) {
    return wsFormatMap[krakenSymbol];
  }
  
  // Fallback: try to add slash before last 3-4 chars (USD/USDT)
  if (krakenSymbol.endsWith('USD')) {
    const base = krakenSymbol.slice(0, -3);
    return `${base}/USD`;
  }
  
  return krakenSymbol;
}
