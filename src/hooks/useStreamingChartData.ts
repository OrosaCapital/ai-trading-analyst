import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import type { Candle } from '@/lib/indicators';
import { generateSampleCandles } from '@/lib/indicators';

interface StreamingChartDataState {
  candles: Candle[];
  isLoading: boolean;
  error: string | null;
  isUsingFallback: boolean;
  lastUpdateTime: number | null;
}

const CACHE: Record<string, { candles: Candle[]; timestamp: number }> = {};
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function generateFallbackCandles(symbol: string, basePrice: number): Candle[] {
  console.log(`Generating fallback candles for ${symbol}`);
  return generateSampleCandles(basePrice, 100);
}

function getCachedCandles(symbol: string): Candle[] | null {
  const cached = CACHE[symbol];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached candles for ${symbol}`);
    return cached.candles;
  }
  return null;
}

export function useStreamingChartData(
  symbol: string,
  limit: number = 50000,
  dateRange: { from: Date; to: Date } | null = null,
  timeframe: "15m" | "1h" | "4h" | "1d" | "1w" = "1h",
  filters: { minVolume: number; maxVolume: number; showOnlySignals: boolean } = { minVolume: 0, maxVolume: Infinity, showOnlySignals: false }
) {
  const [state, setState] = useState<StreamingChartDataState>({
    candles: [],
    isLoading: true,
    error: null,
    isUsingFallback: false,
    lastUpdateTime: null,
  });

  const candlesRef = useRef<Candle[]>([]);
  const isInitialLoadRef = useRef(true);

  // Load initial historical data
  const loadHistoricalData = useCallback(async () => {
    if (!symbol) return;

    console.log(`Loading historical data for ${symbol} with timeframe ${timeframe}`);

    // Check cache first
    const cached = getCachedCandles(`${symbol}_${timeframe}`);
    if (cached) {
      console.log(`Using cached data for ${symbol}_${timeframe}`);
      candlesRef.current = cached;
      setState(prev => ({
        ...prev,
        candles: cached,
        isLoading: false,
        isUsingFallback: false,
        lastUpdateTime: Date.now(),
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await fetchWithRetry(() =>
        supabase.functions.invoke('get-candles', {
          body: {
            symbol,
            timeframe,
            limit,
            dateRange: dateRange ? {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            } : null,
          },
        })
      );

      if (error) throw error;

      let candles: Candle[] = data?.candles || [];

      // Apply filters
      if (filters.minVolume > 0) {
        candles = candles.filter(c => (c.volume || 0) >= filters.minVolume);
      }
      if (filters.maxVolume < Infinity) {
        candles = candles.filter(c => (c.volume || 0) <= filters.maxVolume);
      }

      // Sort by timestamp ascending (oldest first for charts)
      candles.sort((a, b) => a.timestamp - b.timestamp);

      console.log(`Loaded ${candles.length} candles for ${symbol}`);

      // Cache the data
      CACHE[`${symbol}_${timeframe}`] = { candles: [...candles], timestamp: Date.now() };

      candlesRef.current = candles;
      setState({
        candles,
        isLoading: false,
        error: null,
        isUsingFallback: false,
        lastUpdateTime: Date.now(),
      });

    } catch (error) {
      console.error('Error loading historical data:', error);

      // Try fallback data
      try {
        const fallbackCandles = generateFallbackCandles(symbol, 50000);
        candlesRef.current = fallbackCandles;
        setState({
          candles: fallbackCandles,
          isLoading: false,
          error: null,
          isUsingFallback: true,
          lastUpdateTime: Date.now(),
        });
      } catch (fallbackError) {
        console.error('Fallback data generation failed:', fallbackError);
        setState({
          candles: [],
          isLoading: false,
          error: `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isUsingFallback: false,
          lastUpdateTime: null,
        });
      }
    }
  }, [symbol, limit, dateRange, timeframe, filters]);

  // Update candles with streaming data
  const updateWithStreamingData = useCallback((streamingCandle: Candle) => {
    if (!streamingCandle || !candlesRef.current.length) return;

    const currentCandles = [...candlesRef.current];
    const lastCandle = currentCandles[currentCandles.length - 1];

    // Check if this is a new candle or update to existing one
    const timeDiff = Math.abs(streamingCandle.timestamp - lastCandle.timestamp);
    const timeframeMs = getTimeframeMs(timeframe);

    if (timeDiff < timeframeMs) {
      // Update the last candle with new price data
      const updatedCandles = [...currentCandles];
      updatedCandles[updatedCandles.length - 1] = {
        ...lastCandle,
        close: streamingCandle.close,
        high: Math.max(lastCandle.high, streamingCandle.close),
        low: Math.min(lastCandle.low, streamingCandle.close),
        volume: lastCandle.volume + (streamingCandle.volume || 0),
      };

      candlesRef.current = updatedCandles;
      setState(prev => ({
        ...prev,
        candles: updatedCandles,
        lastUpdateTime: Date.now(),
      }));
    } else if (streamingCandle.timestamp > lastCandle.timestamp) {
      // Add new candle
      const newCandles = [...currentCandles, streamingCandle];
      // Keep only the most recent candles to prevent memory issues
      const trimmedCandles = newCandles.slice(-limit);

      candlesRef.current = trimmedCandles;
      setState(prev => ({
        ...prev,
        candles: trimmedCandles,
        lastUpdateTime: Date.now(),
      }));
    }
  }, [timeframe, limit]);

  // Load initial data on mount or when parameters change
  useEffect(() => {
    if (symbol && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadHistoricalData();
    }
  }, [symbol, loadHistoricalData]);

  // Reset when symbol changes
  useEffect(() => {
    if (symbol) {
      isInitialLoadRef.current = true;
      candlesRef.current = [];
      setState({
        candles: [],
        isLoading: true,
        error: null,
        isUsingFallback: false,
        lastUpdateTime: null,
      });
    }
  }, [symbol]);

  return {
    ...state,
    updateWithStreamingData,
    reloadData: loadHistoricalData,
  };
}

// Helper function to get timeframe in milliseconds
function getTimeframeMs(timeframe: "15m" | "1h" | "4h" | "1d" | "1w"): number {
  switch (timeframe) {
    case "15m": return 15 * 60 * 1000;
    case "1h": return 60 * 60 * 1000;
    case "4h": return 4 * 60 * 60 * 1000;
    case "1d": return 24 * 60 * 60 * 1000;
    case "1w": return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}