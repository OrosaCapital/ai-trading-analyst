import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

interface FundingCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface FundingHistoryState {
  candles: FundingCandle[];
  stats: {
    count: number;
    average: number;
    min: number;
    max: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const CACHE: Record<string, { data: FundingHistoryState; timestamp: number }> = {};
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

export function useFundingHistory(symbol: string, exchange: string = 'Binance') {
  const [state, setState] = useState<FundingHistoryState>({
    candles: [],
    stats: null,
    isLoading: true,
    error: null,
  });

  const fetchFundingHistory = useCallback(async () => {
    if (!symbol || symbol.trim() === '') {
      setState({
        candles: [],
        stats: null,
        isLoading: false,
        error: 'Invalid symbol',
      });
      return;
    }

    const cacheKey = `${symbol}:${exchange}:4h`;
    const cached = CACHE[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached funding history for ${symbol}`);
      setState(cached.data);
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('fetch-funding-history', {
          body: { 
            symbol, 
            exchange,
            interval: '4h',
            limit: 100 
          },
        });

        if (error) {
          if (error instanceof FunctionsHttpError) {
            const errorData = await error.context.json().catch(() => ({}));
            throw new Error(errorData.message || error.message);
          } else if (error instanceof FunctionsRelayError) {
            throw new Error(`Connection Error: ${error.message}`);
          } else if (error instanceof FunctionsFetchError) {
            throw new Error(`Network Error: ${error.message}`);
          }
          throw error;
        }

        if (!data?.success || !data.candles) {
          throw new Error(data?.error || 'No funding data received');
        }

        return data;
      }, 3, 2000);

      const newState: FundingHistoryState = {
        candles: result.candles,
        stats: result.stats,
        isLoading: false,
        error: null,
      };

      CACHE[cacheKey] = { data: newState, timestamp: Date.now() };
      setState(newState);
    } catch (error) {
      console.error('Funding history fetch failed:', error);
      
      setState({
        candles: [],
        stats: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch funding history',
      });
    }
  }, [symbol, exchange]);

  useEffect(() => {
    fetchFundingHistory();
  }, [fetchFundingHistory]);

  return {
    ...state,
    refetch: fetchFundingHistory,
  };
}
