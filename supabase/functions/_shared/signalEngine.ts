// Local trading signal generation engine (0 credits)
// Safe version for edge functions (handles partial data)

export interface TradeSignal {
  signal: "BUY" | "SELL" | "NO TRADE";
  confidence: number;
  reasons: string[];
  failedConditions: string[];
  timestamp: number;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
}

export interface ChartDataForSignal {
  price1h: number;
  ema501h: number[];
  rsi1h: number[];

  price15m: number;
  ema5015m: number[];
  rsi15m: number[];

  currentVolume: number;
  volumeSMA: number[];

  coinglassSentiment: "bullish" | "bearish" | "neutral";
}

function safeGetLatest(arr: number[], fallback = 0): number {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const v = arr[arr.length - 1];
  return typeof v === "number" && !isNaN(v) ? v : fallback;
}

function calculateEMASlope(arr: number[], lookback = 5): number {
  if (!Array.isArray(arr) || arr.length < lookback + 1) return 0;
  const recent = arr.slice(-lookback);

  let total = 0;
  for (let i = 1; i < recent.length; i++) {
    const a = recent[i - 1];
    const b = recent[i];
    if (typeof a !== "number" || typeof b !== "number") return 0;
    total += b - a;
  }
  return total / lookback;
}

export function calculateLocalTradeSignal(data: ChartDataForSignal): TradeSignal {
  const failedConditions: string[] = [];

  // Safe reads
  const currentEMA1h = safeGetLatest(data.ema501h);
  const currentEMA15m = safeGetLatest(data.ema5015m);
  const currentRSI1h = safeGetLatest(data.rsi1h, 50);
  const currentRSI15m = safeGetLatest(data.rsi15m, 50);
  const currentVolumeSMA = safeGetLatest(data.volumeSMA, 1);

  const ema1hSlope = calculateEMASlope(data.ema501h);
  const ema15mSlope = calculateEMASlope(data.ema5015m);

  // BUY conditions
  const buyConditions = {
    price1hAboveEMA: data.price1h > currentEMA1h,
    ema1hSlopePositive: ema1hSlope > 0,
    rsi1hBullish: currentRSI1h > 50,
    price15mAboveEMA: data.price15m > currentEMA15m,
    ema15mSlopePositive: ema15mSlope > 0,
    rsi15mBullish: currentRSI15m > 50,
    volumeIncreasing: data.currentVolume > currentVolumeSMA * 1.05,
    coinglassBullish: data.coinglassSentiment === "bullish",
  };

  const buyMetCount = Object.values(buyConditions).filter(Boolean).length;
  const buyConditionsMet = buyMetCount === Object.keys(buyConditions).length;

  if (buyConditionsMet) {
    const entry = data.price1h;

    return {
      signal: "BUY",
      confidence: 70 + Math.min(30, (buyMetCount / 8) * 30),
      reasons: [
        "Strong bullish alignment across 1H and 15M charts",
        `RSI: 1H ${currentRSI1h.toFixed(1)}, 15M ${currentRSI15m.toFixed(1)}`,
        "Volume increasing above SMA",
        "4H sentiment from CoinGlass confirms bullish environment",
      ],
      failedConditions: [],
      timestamp: Date.now(),
      entry_price: entry,
      stop_loss: entry * 0.97,
      take_profit: entry * 1.06,
    };
  }

  // SELL conditions
  const sellConditions = {
    price1hBelowEMA: data.price1h < currentEMA1h,
    ema1hSlopeNegative: ema1hSlope < 0,
    rsi1hBearish: currentRSI1h < 50,
    price15mBelowEMA: data.price15m < currentEMA15m,
    ema15mSlopeNegative: ema15mSlope < 0,
    rsi15mBearish: currentRSI15m < 50,
    volumeIncreasing: data.currentVolume > currentVolumeSMA * 1.05,
    coinglassBearish: data.coinglassSentiment === "bearish",
  };

  const sellMetCount = Object.values(sellConditions).filter(Boolean).length;
  const sellConditionsMet = sellMetCount === Object.keys(sellConditions).length;

  if (sellConditionsMet) {
    const entry = data.price1h;

    return {
      signal: "SELL",
      confidence: 70 + Math.min(30, (sellMetCount / 8) * 30),
      reasons: [
        "Strong bearish alignment across 1H and 15M charts",
        `RSI: 1H ${currentRSI1h.toFixed(1)}, 15M ${currentRSI15m.toFixed(1)}`,
        "Volume rising into selling pressure",
        "4H sentiment from CoinGlass confirms bearish environment",
      ],
      failedConditions: [],
      timestamp: Date.now(),
      entry_price: entry,
      stop_loss: entry * 1.03,
      take_profit: entry * 0.94,
    };
  }

  // Build failed condition log
  if (!buyConditions.price1hAboveEMA && !sellConditions.price1hBelowEMA)
    failedConditions.push("1H price not clearly above or below EMA 50");

  if (!buyConditions.ema1hSlopePositive && !sellConditions.ema1hSlopeNegative)
    failedConditions.push("1H EMA slope flat");

  if (!buyConditions.volumeIncreasing) failedConditions.push("Volume below SMA (weak conviction)");

  if (data.coinglassSentiment === "neutral") failedConditions.push("CoinGlass 4H sentiment neutral");

  return {
    signal: "NO TRADE",
    confidence: 0,
    reasons: ["Market mixed. No clean directional trend."],
    failedConditions,
    timestamp: Date.now(),
  };
}
