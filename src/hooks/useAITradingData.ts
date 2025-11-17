import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISignal {
  decision: 'LONG' | 'SHORT' | 'NO TRADE';
  confidence: number;
  summary: {
    trend: string;
    volume: string;
    liquidity: string;
    coinglass: string;
    entryTrigger: string;
  };
  action: {
    entry?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    reason?: string | null;
  };
}

interface TradingData {
  status: 'accumulating' | 'ready';
  message?: string;
  progress?: number;
  aiSignal?: AISignal;
  priceData?: any;
  emas?: any;
  coinglass?: any;
  liquiditySweep?: any;
  currentPrice?: number;
}

export const useAITradingData = (symbol: string | null) => {
  const [data, setData] = useState<TradingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const startPriceLogger = async () => {
      // Start logging prices
      await supabase.functions.invoke('tatum-price-logger', {
        body: { symbol }
      });
    };

    const fetchTradingData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: tradingData, error: fetchError } = await supabase.functions.invoke('fetch-trading-data', {
          body: { symbol }
        });

        if (fetchError) throw fetchError;

        setData(tradingData);

        if (tradingData.status === 'ready') {
          toast.success('AI analysis complete!');
        }
      } catch (err) {
        console.error('Trading data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        toast.error('Failed to load trading data');
      } finally {
        setIsLoading(false);
      }
    };

    // Start price logging immediately
    startPriceLogger();

    // Fetch trading data initially
    fetchTradingData();

    // Poll every minute while accumulating, every 5 minutes when ready
    const interval = setInterval(() => {
      fetchTradingData();
    }, data?.status === 'accumulating' ? 60000 : 300000);

    return () => clearInterval(interval);
  }, [symbol, data?.status]);

  return { data, isLoading, error };
};
