import { callEdgeFunction } from './httpClient';
import { supabase } from '@/integrations/supabase/client';
import type { TradingData, MarketData } from '@/types/market';
import type { PriceData } from '@/types/api';

export const startPriceLogger = (symbol: string) => 
  callEdgeFunction('tatum-price-logger', { symbol });

export const fetchTradingData = (symbol: string) => 
  callEdgeFunction<TradingData>('fetch-trading-data', { symbol });

export const fetchTatumPrice = (symbol: string) =>
  callEdgeFunction<PriceData>('fetch-tatum-price', { symbol: `${symbol}USD` });

export const fetchMarketOverview = (symbol: string) =>
  callEdgeFunction<MarketData>('fetch-market-overview', { symbol });

export async function fetchPriceOneMinuteAgo(symbol: string): Promise<number | null> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const { data: logData, error } = await supabase
    .from('tatum_price_logs')
    .select('price')
    .eq('symbol', `${symbol}USD`)
    .eq('interval', '1m')
    .lte('timestamp', oneMinuteAgo.toISOString())
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !logData) return null;
  return logData.price;
}
