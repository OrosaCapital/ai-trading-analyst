import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface FreshDataState {
  isFetching: boolean;
  error: string | null;
  lastFetched: number | null;
}

/**
 * Hook that ensures fresh data is available for a given symbol.
 * Triggers API calls to populate data when:
 * 1. Symbol changes to a new value
 * 2. No data exists in database for the symbol
 * 3. Data is older than 4 hours (CoinGlass cache TTL)
 */
export function useFreshSymbolData(symbol: string) {
  const [state, setState] = useState<FreshDataState>({
    isFetching: false,
    error: null,
    lastFetched: null,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    async function ensureFreshData() {
      if (!symbol || symbol === 'USDT' || symbol === 'USD') return;

      setState(prev => ({ ...prev, isFetching: true, error: null }));

      try {
        // Check if we have recent candle data (within 4 hours)
        const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
        const { data: recentCandles, error: candleError } = await supabase
          .from('market_candles')
          .select('timestamp, updated_at')
          .eq('symbol', symbol)
          .eq('timeframe', '1h')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (candleError) {
          console.error('Error checking candle freshness:', candleError);
        }

        const hasRecentCandles = recentCandles && 
          new Date(recentCandles.updated_at || 0).getTime() > fourHoursAgo;

        // Check if we have recent funding data (within 4 hours)
        const { data: recentFunding, error: fundingError } = await supabase
          .from('market_funding_rates')
          .select('timestamp, created_at')
          .eq('symbol', symbol)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fundingError) {
          console.error('Error checking funding freshness:', fundingError);
        }

        const hasRecentFunding = recentFunding && 
          new Date(recentFunding.created_at || 0).getTime() > fourHoursAgo;

        // If data is missing or stale, trigger populate-market-data
        if (!hasRecentCandles || !hasRecentFunding) {
          console.log(`Triggering fresh data fetch for ${symbol} via populate-market-data`);
          
          // Use populate-market-data (CoinMarketCap) for price + candles - per LOVABLE_ROLE.md
          const marketDataResult = await supabase.functions.invoke('populate-market-data', {
            body: { symbol }
          });

          if (marketDataResult.error) {
            console.error('populate-market-data error:', marketDataResult.error);
          } else {
            console.log(`populate-market-data succeeded for ${symbol}`);
          }

          // Still fetch funding data from CoinGlass if needed
          if (!hasRecentFunding) {
            console.log(`Fetching funding data for ${symbol}`);
            const fundingPromises = [
              supabase.functions.invoke('fetch-current-funding', {
                body: { symbol }
              }),
              supabase.functions.invoke('fetch-funding-history', {
                body: { symbol, interval: '4h' }
              })
            ];

            const fundingResults = await Promise.allSettled(fundingPromises);
            fundingResults.forEach((result, index) => {
              if (result.status === 'rejected') {
                console.error(`Funding function ${index} failed:`, result.reason);
              } else if (result.value.error) {
                console.log(`Funding function ${index} returned:`, result.value.error);
              }
            });
          }

          // Invalidate queries to refetch from database
          queryClient.invalidateQueries({ queryKey: ['funding-rates', symbol] });
          queryClient.invalidateQueries({ queryKey: ['chart-data', symbol] });

          if (isMounted) {
            setState({
              isFetching: false,
              error: null,
              lastFetched: Date.now(),
            });
          }
        } else {
          console.log(`Using cached data for ${symbol} (fresh within 4 hours)`);
          if (isMounted) {
            setState({
              isFetching: false,
              error: null,
              lastFetched: null,
            });
          }
        }
      } catch (error) {
        console.error('Error ensuring fresh data:', error);
        if (isMounted) {
          setState({
            isFetching: false,
            error: error instanceof Error ? error.message : 'Failed to fetch fresh data',
            lastFetched: null,
          });
        }
      }
    }

    ensureFreshData();

    return () => {
      isMounted = false;
    };
  }, [symbol, queryClient]);

  return state;
}
