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
    if (!symbol || symbol.trim() === '') {
      setState({
        candles: [],
        isLoading: false,
        error: 'Invalid symbol',
        isUsingFallback: false,
      });
      return;
    }

    // Check cache first
    const cached = getCachedCandles(symbol);
    if (cached) {
      setState({
        candles: cached,
        isLoading: false,
        error: null,
        isUsingFallback: false,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('websocket-price-stream', {
          body: { symbol },
        });

        if (error) {
          if (error instanceof FunctionsHttpError) {
            const errorData = await error.context.json().catch(() => ({}));
            throw new Error(`API Error: ${errorData.message || error.message}`);
          } else if (error instanceof FunctionsRelayError) {
            throw new Error(`Connection Error: ${error.message}`);
          } else if (error instanceof FunctionsFetchError) {
            throw new Error(`Network Error: ${error.message}`);
          }
          throw error;
        }

        if (!data?.candles || !Array.isArray(data.candles) || data.candles.length === 0) {
          throw new Error('No candle data received');
        }

        return data.candles;
      }, 3, 1000);

      const validCandles = result.filter((c: Candle) => 
        c && typeof c.time === 'number' && 
        typeof c.open === 'number' && 
        typeof c.high === 'number' &&
        typeof c.low === 'number' && 
        typeof c.close === 'number'
      );

      if (validCandles.length === 0) {
        throw new Error('No valid candles after filtering');
      }

      setCachedCandles(symbol, validCandles);
      
      setState({
        candles: validCandles,
        isLoading: false,
        error: null,
        isUsingFallback: false,
      });
    } catch (error) {
      console.error('Chart data fetch failed, using fallback:', error);
      
      const fallbackCandles = generateFallbackCandles(symbol, basePrice);
      
      setState({
        candles: fallbackCandles,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
