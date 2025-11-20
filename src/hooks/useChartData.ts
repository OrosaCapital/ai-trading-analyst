import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import type { Candle } from '@/lib/indicators';
import { generateSampleCandles } from '@/lib/indicators';

interface ChartDataState {
  candles: Candle[];
  isLoading: boolean;
  error: string | null;
  isUsingFallback: boolean;
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

function setCachedCandles(symbol: string, candles: Candle[]): void {
  CACHE[symbol] = { candles, timestamp: Date.now() };
}

export function useChartData(
  symbol: string, 
  basePrice: number = 50000,
  dateRange?: { from: Date; to: Date } | null,
  timeframe: "1h" | "4h" | "1d" | "1w" = "1h"
) {
  const [state, setState] = useState<ChartDataState>({
    candles: [],
    isLoading: true,
    error: null,
    isUsingFallback: false,
  });

  const fetchCandles = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // DON'T use cache - always fetch fresh data to avoid stale prices
      // const cached = getCachedCandles(symbol);
      // if (cached) { ... }

      // Build query
      let query = supabase
        .from('market_candles')
        .select('*')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe); // Use selected timeframe

      // Apply date range filter if provided
      if (dateRange?.from && dateRange?.to) {
        const fromTimestamp = Math.floor(dateRange.from.getTime() / 1000);
        const toTimestamp = Math.floor(dateRange.to.getTime() / 1000);
        query = query
          .gte('timestamp', fromTimestamp)
          .lte('timestamp', toTimestamp);
      }

      // Fetch from database
      const { data: dbCandles, error: dbError } = await query
        .order('timestamp', { ascending: false })
        .limit(dateRange ? 10000 : 200); // Higher limit when date range is set

      if (dbError) {
        console.error("Database fetch error:", dbError);
        throw new Error(dbError.message);
      }

      if (dbCandles && dbCandles.length > 0) {
        // Reverse to chronological order (newest fetched first, need oldest first for display)
        const formattedCandles = dbCandles.reverse().map((c: any) => ({
          time: c.timestamp,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
          volume: parseFloat(c.volume || 0)
        }));

        // Cache for this symbol
        setCachedCandles(symbol, formattedCandles);
        setState({
          candles: formattedCandles,
          isLoading: false,
          error: null,
          isUsingFallback: false,
        });
        return;
      }

      // If no data in database, fetch correct basePrice from market_snapshots
      console.warn("No candles in database, fetching price for fallback data");
      const { data: snapshot } = await supabase
        .from('market_snapshots')
        .select('price')
        .eq('symbol', symbol)
        .single();

      const correctBasePrice = snapshot?.price || basePrice;
      const fallbackCandles = generateFallbackCandles(symbol, correctBasePrice);
      setState({
        candles: fallbackCandles,
        isLoading: false,
        error: null,
        isUsingFallback: true,
      });
    } catch (err: any) {
      console.error("Error in fetchCandles:", err);
      
      // Try to get correct price for fallback
      const { data: snapshot } = await supabase
        .from('market_snapshots')
        .select('price')
        .eq('symbol', symbol)
        .single();
      
      const correctBasePrice = snapshot?.price || basePrice;
      const fallbackCandles = generateFallbackCandles(symbol, correctBasePrice);
      setState({
        candles: fallbackCandles,
        isLoading: false,
        error: err.message,
        isUsingFallback: true,
      });
    }
  }, [symbol, basePrice, dateRange, timeframe]);

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  return {
    ...state,
    refetch: fetchCandles,
  };
}
