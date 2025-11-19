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

const CACHE: Record<string, { candles: FundingCandle[]; stats: any; timestamp: number }> = {};
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function getCachedHistory(key: string) {
  const cached = CACHE[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { candles: cached.candles, stats: cached.stats };
  }
  return null;
}

function setCachedHistory(key: string, data: { candles: FundingCandle[]; stats: any }) {
  CACHE[key] = { ...data, timestamp: Date.now() };
}

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
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check cache first
      const cacheKey = `${symbol}:${exchange}:4h`;
      const cached = getCachedHistory(cacheKey);
      if (cached) {
        console.log(`Using cached funding history for ${symbol} on ${exchange}`);
        setState({
          candles: cached.candles,
          stats: cached.stats,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Fetch from database
      const { data: dbHistory, error: dbError } = await supabase
        .from('market_funding_rates')
        .select('*')
        .eq('symbol', symbol)
        .eq('exchange', exchange)
        .order('timestamp', { ascending: true })
        .limit(200);

      if (dbError) {
        console.error("Database fetch error:", dbError);
        throw new Error(dbError.message);
      }

      if (!dbHistory || dbHistory.length === 0) {
        setState({
          candles: [],
          stats: null,
          isLoading: false,
          error: "No funding history available",
        });
        return;
      }

      // Transform to candle format (multiply timestamp by 1000 for milliseconds)
      const candles: FundingCandle[] = dbHistory.map((entry: any) => ({
        time: entry.timestamp * 1000,
        open: parseFloat(entry.rate),
        high: parseFloat(entry.rate),
        low: parseFloat(entry.rate),
        close: parseFloat(entry.rate),
      }));

      const rates = candles.map((c) => c.close);
      const stats = {
        count: candles.length,
        average: rates.reduce((a, b) => a + b, 0) / rates.length,
        min: Math.min(...rates),
        max: Math.max(...rates),
      };

      // Store in cache
      setCachedHistory(cacheKey, { candles, stats });

      setState({ candles, stats, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Error fetching funding history:", err);
      setState({
        candles: [],
        stats: null,
        isLoading: false,
        error: err.message || "Failed to fetch funding history",
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
