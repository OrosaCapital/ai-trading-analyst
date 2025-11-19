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

export function useChartData(symbol: string, basePrice: number = 50000) {
  const [state, setState] = useState<ChartDataState>({
    candles: [],
    isLoading: true,
    error: null,
    isUsingFallback: false,
  });

  const fetchCandles = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first
      const cached = getCachedCandles(symbol);
      if (cached) {
        console.log(`Using cached candles for ${symbol}`);
        setState({
          candles: cached,
          isLoading: false,
          error: null,
          isUsingFallback: false,
        });
        return;
      }

      // Fetch from database
      const { data: dbCandles, error: dbError } = await supabase
        .from('market_candles')
        .select('*')
        .eq('symbol', symbol)
        .eq('timeframe', '1h')
        .order('timestamp', { ascending: true })
        .limit(200);

      if (dbError) {
        console.error("Database fetch error:", dbError);
        throw new Error(dbError.message);
      }

      if (dbCandles && dbCandles.length > 0) {
        const formattedCandles = dbCandles.map((c: any) => ({
          time: c.timestamp,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
          volume: parseFloat(c.volume || 0)
        }));

        setCachedCandles(symbol, formattedCandles);
        setState({
          candles: formattedCandles,
          isLoading: false,
          error: null,
          isUsingFallback: false,
        });
        return;
      }

      // If no data in database, use fallback
      console.warn("No candles in database, using fallback data");
      const fallbackCandles = generateFallbackCandles(symbol, basePrice);
      setState({
        candles: fallbackCandles,
        isLoading: false,
        error: null,
        isUsingFallback: true,
      });
    } catch (err: any) {
      console.error("Error in fetchCandles:", err);
      const fallbackCandles = generateFallbackCandles(symbol, basePrice);
      setState({
        candles: fallbackCandles,
        isLoading: false,
        error: err.message,
        isUsingFallback: true,
      });
    }
  }, [symbol, basePrice]);

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  return {
    ...state,
    refetch: fetchCandles,
  };
}
