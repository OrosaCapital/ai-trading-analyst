// Technical indicator calculation functions (safe version)
// All functions hardened against NaN, missing data, and partial arrays.

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingPoint {
  time: number;
  price: number;
  type: "high" | "low";
}

export interface LiquiditySweep {
  time: number;
  price: number;
  type: "high" | "low";
  significance: number;
}

/*──────────────────────────────────────────────────────────────
  SAFE HELPERS
──────────────────────────────────────────────────────────────*/
function safeNumber(v: any, fallback = 0): number {
  return typeof v === "number" && !isNaN(v) ? v : fallback;
}

function safeArray<T>(vals: T[]): T[] {
  return Array.isArray(vals) ? vals : [];
}

/*──────────────────────────────────────────────────────────────
  EMA (Exponential Moving Average)
──────────────────────────────────────────────────────────────*/
export function calculateEMA(prices: number[], period: number): number[] {
  prices = safeArray(prices).map((p) => safeNumber(p));

  if (prices.length < period) return [];

  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  ema[period - 1] = sum / period;

  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return sma;
}

/*──────────────────────────────────────────────────────────────
  MACD (Moving Average Convergence Divergence)
──────────────────────────────────────────────────────────────*/
export function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): { macd: number[]; signal: number[]; histogram: number[] } {
  prices = safeArray(prices).map((p) => safeNumber(p));

  if (prices.length < slowPeriod) return { macd: [], signal: [], histogram: [] };

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  const macd: number[] = prices.map((_, i) => {
    const a = fastEMA[i];
    const b = slowEMA[i];
    return (a === undefined || b === undefined) ? undefined : a - b;
  });

  const macdFiltered = macd.map(v => v === undefined ? 0 : v);
  const signal = calculateEMA(macdFiltered, signalPeriod);

  const histogram: number[] = macd.map((v, i) => {
    return (v === undefined || signal[i] === undefined) ? undefined : v - signal[i];
  });

  return { macd, signal, histogram };
}

/*──────────────────────────────────────────────────────────────
  Bollinger Bands
──────────────────────────────────────────────────────────────*/
export function calculateBollingerBands(prices: number[], period = 20, stdDevMult = 2): { middle: number[]; upper: number[]; lower: number[] } {
  prices = safeArray(prices).map((p) => safeNumber(p));

  if (prices.length < period) return { middle: [], upper: [], lower: [] };

  const middle: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle[i] = mean;
    upper[i] = mean + stdDevMult * stdDev;
    lower[i] = mean - stdDevMult * stdDev;
  }

  return { middle, upper, lower };
}

/*──────────────────────────────────────────────────────────────
  SMA (Simple Moving Average)
──────────────────────────────────────────────────────────────*/
export function calculateSMA(values: number[], period: number): number[] {
  values = safeArray(values).map((v) => safeNumber(v));

  if (values.length < period) return [];

  const sma: number[] = [];

  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    sma[i] = slice.reduce((a, b) => a + b, 0) / period;
  }

  return sma;
}

export function calculateEMASlope(ema: number[], lookback = 3): number {
  ema = safeArray(ema).map((e) => safeNumber(e));

  if (ema.length < lookback + 1) return 0;

  const recent = ema.slice(-lookback);
  let slope = 0;

  for (let i = 1; i < recent.length; i++) {
    if (isNaN(recent[i]) || isNaN(recent[i - 1])) return 0;
    slope += recent[i] - recent[i - 1];
  }

  return slope / (lookback - 1);
}

/*──────────────────────────────────────────────────────────────
  RSI (Relative Strength Index)
──────────────────────────────────────────────────────────────*/
export function calculateRSI(prices: number[], period = 14): number[] {
  prices = safeArray(prices).map((p) => safeNumber(p));

  if (prices.length < period + 1) return [];

  const rsi: number[] = [];
  const gains = [];
  const losses = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgGain / (avgLoss === 0 ? 0.0001 : avgLoss);
    rsi[i] = 100 - 100 / (1 + rs);
  }

  return rsi.map((v) => safeNumber(v, 50)); // fallback to neutral RSI
}

/*──────────────────────────────────────────────────────────────
  Volume SMA
──────────────────────────────────────────────────────────────*/
export function calculateVolumeSMA(volumes: number[], period = 6): number[] {
  volumes = safeArray(volumes).map((v) => safeNumber(v));

  if (volumes.length < period) return [];

  const sma: number[] = [];

  for (let i = period - 1; i < volumes.length; i++) {
    const slice = volumes.slice(i - period + 1, i + 1);
    sma[i] = slice.reduce((a, b) => a + b, 0) / period;
  }

  return sma.map((v) => safeNumber(v));
}

/*──────────────────────────────────────────────────────────────
  Swing Points
──────────────────────────────────────────────────────────────*/
export function detectSwingPoints(candles: Candle[], lookback = 5): SwingPoint[] {
  candles = safeArray(candles);

  const points: SwingPoint[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    if (!c) continue;

    const isHigh = candles
      .slice(i - lookback, i + lookback + 1)
      .every((x, idx) => (idx !== lookback ? x.high < c.high : true));

    const isLow = candles
      .slice(i - lookback, i + lookback + 1)
      .every((x, idx) => (idx !== lookback ? x.low > c.low : true));

    if (isHigh) {
      points.push({ time: c.time, price: c.high, type: "high" });
    }
    if (isLow) {
      points.push({ time: c.time, price: c.low, type: "low" });
    }
  }

  return points;
}

/*──────────────────────────────────────────────────────────────
  Liquidity Sweeps
──────────────────────────────────────────────────────────────*/
export function detectLiquiditySweeps(
  candles: Candle[],
  swingPoints: SwingPoint[],
  reversalThreshold = 0.002,
): LiquiditySweep[] {
  candles = safeArray(candles);
  swingPoints = safeArray(swingPoints);

  const sweeps: LiquiditySweep[] = [];

  for (let i = 0; i < candles.length - 3; i++) {
    const c = candles[i];
    if (!c) continue;

    const next3 = candles.slice(i + 1, i + 4);

    const highs = swingPoints.filter((sp) => sp.type === "high" && Math.abs(sp.time - c.time) < 3600 * 10);

    for (const sp of highs) {
      if (c.high > sp.price) {
        const reversed = next3.some((n) => n.close < sp.price * (1 - reversalThreshold));
        if (reversed) {
          sweeps.push({
            time: c.time,
            price: c.high,
            type: "high",
            significance: (c.high - sp.price) / sp.price,
          });
        }
      }
    }

    const lows = swingPoints.filter((sp) => sp.type === "low" && Math.abs(sp.time - c.time) < 3600 * 10);

    for (const sp of lows) {
      if (c.low < sp.price) {
        const reversed = next3.some((n) => n.close > sp.price * (1 + reversalThreshold));
        if (reversed) {
          sweeps.push({
            time: c.time,
            price: c.low,
            type: "low",
            significance: (sp.price - c.low) / sp.price,
          });
        }
      }
    }
  }

  return sweeps;
}

/*──────────────────────────────────────────────────────────────
  Support / Resistance
──────────────────────────────────────────────────────────────*/
export function detectSupportResistance(candles: Candle[], threshold = 0.005) {
  const swings = detectSwingPoints(candles);

  const lows = swings.filter((s) => s.type === "low").map((s) => s.price);
  const highs = swings.filter((s) => s.type === "high").map((s) => s.price);

  return {
    support: clusterPrices(lows, threshold),
    resistance: clusterPrices(highs, threshold),
  };
}

function clusterPrices(prices: number[], threshold: number): number[] {
  prices = safeArray(prices).map((p) => safeNumber(p));
  if (!prices.length) return [];

  const sorted = [...prices].sort((a, b) => a - b);
  const groups: number[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const diff = Math.abs(curr - prev) / prev;

    if (diff <= threshold) {
      groups[groups.length - 1].push(curr);
    } else {
      groups.push([curr]);
    }
  }

  return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
}

/*──────────────────────────────────────────────────────────────
  Aggregate 1m Candles to Higher Timeframes
──────────────────────────────────────────────────────────────*/
export function aggregateCandles(candles1m: Candle[], timeframeMinutes: number): Candle[] {
  candles1m = safeArray(candles1m);
  if (!candles1m.length) return [];

  const intervalMs = timeframeMinutes * 60 * 1000;
  const out: Candle[] = [];

  let bucketStart = Math.floor(candles1m[0].time / intervalMs) * intervalMs;
  let candle: Candle | null = null;

  for (const c of candles1m) {
    const t = Math.floor(c.time / intervalMs) * intervalMs;

    if (t !== bucketStart) {
      if (candle) out.push(candle);
      candle = null;
      bucketStart = t;
    }

    if (!candle) {
      candle = { time: t, ...c };
    } else {
      candle.high = Math.max(candle.high, c.high);
      candle.low = Math.min(candle.low, c.low);
      candle.close = c.close;
      candle.volume += c.volume;
    }
  }

  if (candle) out.push(candle);
  return out;
}

/*──────────────────────────────────────────────────────────────
  Live Candle Construction from Price Streams
──────────────────────────────────────────────────────────────*/
export function buildCandleFromPriceUpdates(
  candles: Candle[],
  currentPrice: number,
  volume: number,
  timestamp: number, // Expected in seconds
): Candle[] {
  candles = safeArray(candles);

  // Bucket time to nearest minute in seconds
  const bucketTime = Math.floor(timestamp / 60) * 60;

  const out = [...candles];
  const last = out[out.length - 1];

  if (!last || last.time !== bucketTime) {
    out.push({
      time: bucketTime,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume,
    });
  } else {
    last.high = Math.max(last.high, currentPrice);
    last.low = Math.min(last.low, currentPrice);
    last.close = currentPrice;
    last.volume += volume;
  }

  return out;
}

/*──────────────────────────────────────────────────────────────
  Generate Mock Candles
──────────────────────────────────────────────────────────────*/
export function generateSampleCandles(basePrice: number, count: number): Candle[] {
  const output: Candle[] = [];
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000); // Convert to seconds for TradingView charts

  for (let i = count; i > 0; i--) {
    const t = now - i * 60; // Subtract minutes in seconds

    const o = price;
    const c = o + (Math.random() - 0.5) * 0.005 * o;
    const h = Math.max(o, c) + Math.random() * 0.002 * o;
    const l = Math.min(o, c) - Math.random() * 0.002 * o;

    output.push({
      time: t,
      open: o,
      high: h,
      low: l,
      close: c,
      volume: Math.random() * 500000,
    });

    price = c;
  }

  return output;
}

/*──────────────────────────────────────────────────────────────
  Momentum
──────────────────────────────────────────────────────────────*/
export function calculateMomentum(prices: number[], period = 14): number[] {
  prices = safeArray(prices).map((p) => safeNumber(p));

  if (prices.length <= period) return [];

  const momentum: number[] = [];

  for (let i = period; i < prices.length; i++) {
    momentum[i] = prices[i] - prices[i - period];
  }

  return momentum;
}

/*──────────────────────────────────────────────────────────────
  Ichimoku Cloud
──────────────────────────────────────────────────────────────*/
export function calculateIchimoku(highs: number[], lows: number[], closes: number[],
  conversionPeriods = 9, basePeriods = 26, laggingSpan2Periods = 52, displacement = 26):
  { conversionLine: number[]; baseLine: number[]; leadSpanA: number[]; leadSpanB: number[]; laggingSpan: number[] } {

  highs = safeArray(highs).map((p) => safeNumber(p));
  lows = safeArray(lows).map((p) => safeNumber(p));
  closes = safeArray(closes).map((p) => safeNumber(p));

  if (highs.length < laggingSpan2Periods || lows.length < laggingSpan2Periods) {
    return { conversionLine: [], baseLine: [], leadSpanA: [], leadSpanB: [], laggingSpan: [] };
  }

  const conversionLine: number[] = [];
  const baseLine: number[] = [];
  const leadSpanA: number[] = [];
  const leadSpanB: number[] = [];
  const laggingSpan: number[] = [];

  // Calculate Conversion Line (Tenkan-sen)
  for (let i = conversionPeriods - 1; i < highs.length; i++) {
    const highSlice = highs.slice(i - conversionPeriods + 1, i + 1);
    const lowSlice = lows.slice(i - conversionPeriods + 1, i + 1);
    const high = Math.max(...highSlice);
    const low = Math.min(...lowSlice);
    conversionLine[i] = (high + low) / 2;
  }

  // Calculate Base Line (Kijun-sen)
  for (let i = basePeriods - 1; i < highs.length; i++) {
    const highSlice = highs.slice(i - basePeriods + 1, i + 1);
    const lowSlice = lows.slice(i - basePeriods + 1, i + 1);
    const high = Math.max(...highSlice);
    const low = Math.min(...lowSlice);
    baseLine[i] = (high + low) / 2;
  }

  // Calculate Leading Span A and B
  for (let i = basePeriods - 1; i < highs.length; i++) {
    if (conversionLine[i] !== undefined && baseLine[i] !== undefined) {
      leadSpanA[i + displacement] = (conversionLine[i] + baseLine[i]) / 2;
    }

    const highSlice = highs.slice(i - laggingSpan2Periods + 1, i + 1);
    const lowSlice = lows.slice(i - laggingSpan2Periods + 1, i + 1);
    const high = Math.max(...highSlice);
    const low = Math.min(...lowSlice);
    leadSpanB[i + displacement] = (high + low) / 2;
  }

  // Calculate Lagging Span (Chikou Span)
  for (let i = laggingSpan2Periods - 1; i < closes.length; i++) {
    laggingSpan[i - laggingSpan2Periods + 1] = closes[i];
  }

  return { conversionLine, baseLine, leadSpanA, leadSpanB, laggingSpan };
}

/*──────────────────────────────────────────────────────────────
  Pivot Points Detection
──────────────────────────────────────────────────────────────*/
export function detectPivotPoints(highs: number[], lows: number[], lookback = 5): { pivotHighs: number[]; pivotLows: number[] } {
  highs = safeArray(highs).map((p) => safeNumber(p));
  lows = safeArray(lows).map((p) => safeNumber(p));

  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  for (let i = lookback; i < highs.length - lookback; i++) {
    let isPivotHigh = true;
    let isPivotLow = true;

    // Check if current high is higher than surrounding highs
    for (let j = 1; j <= lookback; j++) {
      if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) {
        isPivotHigh = false;
        break;
      }
    }

    // Check if current low is lower than surrounding lows
    for (let j = 1; j <= lookback; j++) {
      if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) {
        isPivotLow = false;
        break;
      }
    }

    pivotHighs[i] = isPivotHigh ? highs[i] : NaN;
    pivotLows[i] = isPivotLow ? lows[i] : NaN;
  }

  return { pivotHighs, pivotLows };
}

/*──────────────────────────────────────────────────────────────
  RSI Divergence Detection
──────────────────────────────────────────────────────────────*/
export function detectRSIDivergence(rsiValues: number[], prices: number[], pivotHighs: number[], pivotLows: number[]):
  { bullishDivergence: boolean[]; bearishDivergence: boolean[] } {

  rsiValues = safeArray(rsiValues).map((p) => safeNumber(p));
  prices = safeArray(prices).map((p) => safeNumber(p));

  const bullishDivergence: boolean[] = [];
  const bearishDivergence: boolean[] = [];

  let lastPivotHighPrice = NaN;
  let lastPivotHighRSI = NaN;
  let lastPivotLowPrice = NaN;
  let lastPivotLowRSI = NaN;

  for (let i = 0; i < prices.length; i++) {
    // Check for pivot highs (potential bearish divergence)
    if (!isNaN(pivotHighs[i])) {
      if (!isNaN(lastPivotHighPrice) && !isNaN(lastPivotHighRSI)) {
        const priceHigher = prices[i] > lastPivotHighPrice;
        const rsiLower = rsiValues[i] < lastPivotHighRSI;
        bearishDivergence[i] = priceHigher && rsiLower;
      }
      lastPivotHighPrice = prices[i];
      lastPivotHighRSI = rsiValues[i];
    }

    // Check for pivot lows (potential bullish divergence)
    if (!isNaN(pivotLows[i])) {
      if (!isNaN(lastPivotLowPrice) && !isNaN(lastPivotLowRSI)) {
        const priceLower = prices[i] < lastPivotLowPrice;
        const rsiHigher = rsiValues[i] > lastPivotLowRSI;
        bullishDivergence[i] = priceLower && rsiHigher;
      }
      lastPivotLowPrice = prices[i];
      lastPivotLowRSI = rsiValues[i];
    }
  }

  return { bullishDivergence, bearishDivergence };
}
