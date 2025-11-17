// Technical indicator calculation functions

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
  type: 'high' | 'low';
}

export interface LiquiditySweep {
  time: number;
  price: number;
  type: 'high' | 'low';
  significance: number;
}

// Calculate Exponential Moving Average
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // Calculate initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
}

// Calculate EMA slope (determines if trending up or down)
export function calculateEMASlope(ema: number[], lookback: number = 3): number {
  if (ema.length < lookback) return 0;
  
  const recent = ema.slice(-lookback);
  let slope = 0;
  
  for (let i = 1; i < recent.length; i++) {
    slope += recent[i] - recent[i - 1];
  }
  
  return slope / (lookback - 1);
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];
  
  const rsi: number[] = [];
  let gains: number[] = [];
  let losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain/loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // Calculate RSI
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi[i] = 100 - (100 / (1 + rs));
  }
  
  return rsi;
}

// Calculate Volume Simple Moving Average
export function calculateVolumeSMA(volumes: number[], period: number = 6): number[] {
  if (volumes.length < period) return [];
  
  const sma: number[] = [];
  
  for (let i = period - 1; i < volumes.length; i++) {
    const sum = volumes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  
  return sma;
}

// Detect swing highs and lows
export function detectSwingPoints(candles: Candle[], lookback: number = 5): SwingPoint[] {
  const swingPoints: SwingPoint[] = [];
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    
    // Check for swing high
    let isSwingHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].high >= currentHigh) {
        isSwingHigh = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      swingPoints.push({
        time: candles[i].time,
        price: currentHigh,
        type: 'high',
      });
    }
    
    // Check for swing low
    let isSwingLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].low <= currentLow) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingLow) {
      swingPoints.push({
        time: candles[i].time,
        price: currentLow,
        type: 'low',
      });
    }
  }
  
  return swingPoints;
}

// Detect liquidity sweeps (when price sweeps a swing point then reverses)
export function detectLiquiditySweeps(
  candles: Candle[],
  swingPoints: SwingPoint[],
  reversalThreshold: number = 0.002
): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];
  
  for (let i = 0; i < candles.length - 3; i++) {
    const candle = candles[i];
    const nextCandles = candles.slice(i + 1, i + 4);
    
    // Check for swing high sweep
    const nearbyHighs = swingPoints.filter(
      sp => sp.type === 'high' && Math.abs(sp.time - candle.time) < 3600 * 10
    );
    
    for (const swing of nearbyHighs) {
      // Price swept above swing high
      if (candle.high > swing.price) {
        // Check for reversal (price closes back below)
        const hasReversal = nextCandles.some(
          nc => nc.close < swing.price * (1 - reversalThreshold)
        );
        
        if (hasReversal) {
          sweeps.push({
            time: candle.time,
            price: candle.high,
            type: 'high',
            significance: (candle.high - swing.price) / swing.price,
          });
        }
      }
    }
    
    // Check for swing low sweep
    const nearbyLows = swingPoints.filter(
      sp => sp.type === 'low' && Math.abs(sp.time - candle.time) < 3600 * 10
    );
    
    for (const swing of nearbyLows) {
      // Price swept below swing low
      if (candle.low < swing.price) {
        // Check for reversal (price closes back above)
        const hasReversal = nextCandles.some(
          nc => nc.close > swing.price * (1 + reversalThreshold)
        );
        
        if (hasReversal) {
          sweeps.push({
            time: candle.time,
            price: candle.low,
            type: 'low',
            significance: (swing.price - candle.low) / swing.price,
          });
        }
      }
    }
  }
  
  return sweeps;
}

// Detect support and resistance levels
export function detectSupportResistance(
  candles: Candle[],
  threshold: number = 0.005
): { support: number[]; resistance: number[] } {
  const swingPoints = detectSwingPoints(candles);
  const support: number[] = [];
  const resistance: number[] = [];
  
  // Cluster swing lows for support
  const lows = swingPoints.filter(sp => sp.type === 'low').map(sp => sp.price);
  const lowClusters = clusterPrices(lows, threshold);
  support.push(...lowClusters);
  
  // Cluster swing highs for resistance
  const highs = swingPoints.filter(sp => sp.type === 'high').map(sp => sp.price);
  const highClusters = clusterPrices(highs, threshold);
  resistance.push(...highClusters);
  
  return { support, resistance };
}

// Helper: Cluster prices that are close together
function clusterPrices(prices: number[], threshold: number): number[] {
  if (prices.length === 0) return [];
  
  const sorted = [...prices].sort((a, b) => a - b);
  const clusters: number[] = [];
  let currentCluster: number[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs(sorted[i] - sorted[i - 1]) / sorted[i - 1];
    
    if (diff <= threshold) {
      currentCluster.push(sorted[i]);
    } else {
      // Calculate cluster average
      const avg = currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length;
      clusters.push(avg);
      currentCluster = [sorted[i]];
    }
  }
  
  // Add last cluster
  if (currentCluster.length > 0) {
    const avg = currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length;
    clusters.push(avg);
  }
  
  return clusters;
}

// Aggregate 1-minute candles into higher timeframes
export function aggregateCandles(
  candles1m: Candle[],
  timeframeMinutes: number
): Candle[] {
  const aggregated: Candle[] = [];
  const intervalMs = timeframeMinutes * 60 * 1000;
  
  if (candles1m.length === 0) return [];
  
  let currentInterval = Math.floor(candles1m[0].time / intervalMs) * intervalMs;
  let currentCandle: Candle | null = null;
  
  for (const candle of candles1m) {
    const candleInterval = Math.floor(candle.time / intervalMs) * intervalMs;
    
    if (candleInterval !== currentInterval) {
      if (currentCandle) {
        aggregated.push(currentCandle);
      }
      currentInterval = candleInterval;
      currentCandle = null;
    }
    
    if (!currentCandle) {
      currentCandle = {
        time: candleInterval,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
    } else {
      currentCandle.high = Math.max(currentCandle.high, candle.high);
      currentCandle.low = Math.min(currentCandle.low, candle.low);
      currentCandle.close = candle.close;
      currentCandle.volume += candle.volume;
    }
  }
  
  if (currentCandle) {
    aggregated.push(currentCandle);
  }
  
  return aggregated;
}

// Build candles in-memory from price stream data
export function buildCandleFromPriceUpdates(
  existingCandles: Candle[],
  currentPrice: number,
  volume: number,
  timestamp: number
): Candle[] {
  const candleTime = Math.floor(timestamp / 60) * 60; // Round down to minute
  const candles = [...existingCandles];
  
  // Find or create candle for this minute
  const lastCandle = candles[candles.length - 1];
  
  if (!lastCandle || lastCandle.time < candleTime) {
    // New candle
    candles.push({
      time: candleTime,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume: volume,
    });
  } else if (lastCandle.time === candleTime) {
    // Update existing candle
    lastCandle.high = Math.max(lastCandle.high, currentPrice);
    lastCandle.low = Math.min(lastCandle.low, currentPrice);
    lastCandle.close = currentPrice;
    lastCandle.volume += volume;
  }
  
  return candles;
}

// Generate sample candles for immediate display
export function generateSampleCandles(basePrice: number, count: number): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = count; i > 0; i--) {
    const time = now - (i * 60);
    const randomChange = (Math.random() - 0.5) * basePrice * 0.01; // ±0.5% variation
    const open = basePrice + randomChange;
    const close = open + (Math.random() - 0.5) * basePrice * 0.005;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.002;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.002;
    
    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000,
    });
    
    basePrice = close; // Continue from last close
  }
  
  return candles;
}

