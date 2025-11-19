// Day Trader Pro Indicators - VWAP, PDH/PDL, Custom MACD
import type { Candle } from "./indicators";

export interface MACDResult {
  macdLine: { time: number; value: number }[];
  signalLine: { time: number; value: number }[];
  histogram: { time: number; value: number; color: string }[];
}

export interface PreviousDayLevels {
  prevHigh: number | null;
  prevLow: number | null;
}

/**
 * Calculate VWAP (Volume-Weighted Average Price)
 * Returns cumulative VWAP for each candle
 */
export function calculateVWAP(candles: Candle[]): { time: number; value: number }[] {
  if (!candles || candles.length === 0) return [];

  let cumulativePV = 0;
  let cumulativeVolume = 0;
  const result: { time: number; value: number }[] = [];

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume || 1;
    
    cumulativePV += typicalPrice * volume;
    cumulativeVolume += volume;

    result.push({
      time: candle.time,
      value: cumulativePV / cumulativeVolume,
    });
  }

  return result;
}

/**
 * Extract Previous Day High (PDH) and Previous Day Low (PDL)
 * Calculates the high/low of the previous calendar day
 */
export function getPreviousDayLevels(candles: Candle[]): PreviousDayLevels {
  if (!candles || candles.length === 0) {
    return { prevHigh: null, prevLow: null };
  }

  const lastCandle = candles[candles.length - 1];
  const lastDate = new Date(lastCandle.time * 1000);
  const lastDay = lastDate.getUTCDate();
  const lastMonth = lastDate.getUTCMonth();
  const lastYear = lastDate.getUTCFullYear();

  let prevHigh = -Infinity;
  let prevLow = Infinity;

  for (const candle of candles) {
    const candleDate = new Date(candle.time * 1000);
    const day = candleDate.getUTCDate();
    const month = candleDate.getUTCMonth();
    const year = candleDate.getUTCFullYear();

    const isLastDay = day === lastDay && month === lastMonth && year === lastYear;

    if (!isLastDay) {
      if (candle.high > prevHigh) prevHigh = candle.high;
      if (candle.low < prevLow) prevLow = candle.low;
    }
  }

  if (!isFinite(prevHigh) || !isFinite(prevLow)) {
    return { prevHigh: null, prevLow: null };
  }

  return { prevHigh, prevLow };
}

/**
 * Calculate MACD with custom periods (fast=3, slow=10, signal=16)
 * Optimized for day trading with faster reaction times
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod = 3,
  slowPeriod = 10,
  signalPeriod = 16
): MACDResult {
  if (!candles || candles.length === 0) {
    return { macdLine: [], signalLine: [], histogram: [] };
  }

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMAForMACD(candles, fastPeriod);
  const slowEMA = calculateEMAForMACD(candles, slowPeriod);

  // MACD Line = Fast EMA - Slow EMA
  const macdLine: { time: number; value: number }[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (fastEMA[i] !== undefined && slowEMA[i] !== undefined) {
      macdLine.push({
        time: candles[i].time,
        value: fastEMA[i] - slowEMA[i],
      });
    }
  }

  // Signal Line = EMA of MACD Line
  const signalLine = calculateEMAFromValues(macdLine, signalPeriod);

  // Histogram = MACD Line - Signal Line
  const histogram: { time: number; value: number; color: string }[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    const macdValue = macdLine[i].value;
    const signalValue = signalLine[i]?.value ?? macdValue;
    const histValue = macdValue - signalValue;

    histogram.push({
      time: macdLine[i].time,
      value: histValue,
      color: histValue >= 0 ? 'hsl(var(--chart-green))' : 'hsl(var(--chart-red))',
    });
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Helper: Calculate EMA for MACD from candles
 */
function calculateEMAForMACD(candles: Candle[], period: number): number[] {
  if (candles.length < period) return [];

  const k = 2 / (period + 1);
  const ema: number[] = [];

  // Initialize with first close
  let prevEMA = candles[0].close;
  ema[0] = prevEMA;

  for (let i = 1; i < candles.length; i++) {
    const value = candles[i].close * k + prevEMA * (1 - k);
    ema[i] = value;
    prevEMA = value;
  }

  return ema;
}

/**
 * Helper: Calculate EMA from a series of values (for signal line)
 */
function calculateEMAFromValues(
  data: { time: number; value: number }[],
  period: number
): { time: number; value: number }[] {
  if (data.length < period) return [];

  const k = 2 / (period + 1);
  const result: { time: number; value: number }[] = [];

  let prevEMA = data[0].value;
  result.push({ time: data[0].time, value: prevEMA });

  for (let i = 1; i < data.length; i++) {
    const value = data[i].value * k + prevEMA * (1 - k);
    result.push({ time: data[i].time, value });
    prevEMA = value;
  }

  return result;
}

/**
 * Format volume data for histogram display
 */
export function calculateVolumeSeries(candles: Candle[]): { time: number; value: number; color: string }[] {
  return candles.map(candle => ({
    time: candle.time,
    value: candle.volume || 0,
    color: candle.close >= candle.open 
      ? 'hsla(var(--chart-green), 0.8)' 
      : 'hsla(var(--chart-red), 0.8)',
  }));
}

/**
 * Create bias bands from 4h data (placeholder for Coinglass integration)
 */
export function createBiasBands(candles: Candle[], percentage = 0.01): {
  upper: { time: number; value: number }[];
  lower: { time: number; value: number }[];
} {
  // Simple percentage bands - replace with actual Coinglass 4h bias logic
  return {
    upper: candles.map(c => ({ time: c.time, value: c.close * (1 + percentage) })),
    lower: candles.map(c => ({ time: c.time, value: c.close * (1 - percentage) })),
  };
}
