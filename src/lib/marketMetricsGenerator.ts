interface LocalMarketMetrics {
  fundingRate: number;
  openInterest: number;
  longShortRatio: number;
  liquidations24h: number;
  volume24h: number;
  timestamp: number;
}

/**
 * Generate realistic market metrics locally without external APIs
 * Uses symbol hash, time-based variance, and market correlation patterns
 */
export function generateLocalMarketMetrics(
  symbol: string,
  currentPrice?: number
): LocalMarketMetrics {
  const now = Date.now();
  const symbolHash = hashSymbol(symbol);
  const timeVariance = Math.sin(now / 60000) * 0.3;
  const priceInfluence = currentPrice ? Math.log10(currentPrice) / 10 : 0;

  // Funding Rate: -0.1% to +0.1% (annualized ~-36% to +36%)
  // Correlates with market sentiment
  const baseFundingRate = (Math.sin(symbolHash) * 0.0005) + (timeVariance * 0.0002);
  const fundingRate = baseFundingRate + (priceInfluence * 0.0001);

  // Open Interest: $100M to $5B range
  // Higher for major symbols like BTC, lower for alts
  const baseOI = 500000000 + (symbolHash % 2000000000);
  const oiVariance = Math.cos(now / 120000) * 200000000;
  const openInterest = Math.max(100000000, baseOI + oiVariance);

  // Long/Short Ratio: 0.5 to 2.0
  // Tends toward 1.0, correlates weakly with funding
  const baseLongShort = 1.0 + (Math.sin(symbolHash * 2) * 0.3);
  const lsVariance = timeVariance * 0.2;
  const longShortRatio = Math.max(0.5, Math.min(2.0, baseLongShort + lsVariance + (fundingRate * 100)));

  // Liquidations 24h: $1M to $200M
  // Spikes during high volatility, inversely correlated with price stability
  const baseLiqs = 10000000 + (symbolHash % 80000000);
  const liqSpike = Math.abs(Math.sin(now / 180000)) * 50000000;
  const volatilityFactor = Math.abs(fundingRate) * 1000000000;
  const liquidations24h = baseLiqs + liqSpike + volatilityFactor;

  // Volume 24h: $500M to $20B
  // Higher for liquid markets, correlates with OI
  const baseVolume = 2000000000 + (symbolHash % 8000000000);
  const volumeVariance = Math.sin(now / 90000) * 1000000000;
  const volume24h = Math.max(500000000, baseVolume + volumeVariance + (openInterest * 0.5));

  return {
    fundingRate: Number(fundingRate.toFixed(6)),
    openInterest: Math.round(openInterest),
    longShortRatio: Number(longShortRatio.toFixed(3)),
    liquidations24h: Math.round(liquidations24h),
    volume24h: Math.round(volume24h),
    timestamp: now,
  };
}

/**
 * Create deterministic hash from symbol for consistent base values
 */
function hashSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Add realistic market noise that updates over time
 */
export function addMarketNoise(baseValue: number, volatility: number = 0.05): number {
  const noise = (Math.random() - 0.5) * 2 * volatility;
  return baseValue * (1 + noise);
}

/**
 * Simulate market cycle effects (bull/bear trends)
 */
export function getMarketCycleMultiplier(): number {
  const cycleLength = 3600000; // 1 hour cycle
  const phase = (Date.now() % cycleLength) / cycleLength;
  return 0.8 + (Math.sin(phase * Math.PI * 2) * 0.2);
}
