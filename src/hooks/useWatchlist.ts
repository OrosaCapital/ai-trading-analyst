import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { normalizeSymbol } from '@/lib/symbolUtils';

export interface WatchlistItem {
  id: string;
  symbol: string;
  nickname: string | null;
  notes: string | null;
  added_at: string;
  last_analysis_time?: string;
  last_decision?: string;
  last_confidence?: number;
  current_price?: number;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWatchlist = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch watchlist items
      const watchlistResponse = await (supabase as any)
        .from('user_watchlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('added_at', { ascending: false });

      if (watchlistResponse.error) throw watchlistResponse.error;

      const items = watchlistResponse.data || [];

      // Fetch latest analysis for each symbol
      const enrichedWatchlist: WatchlistItem[] = await Promise.all(
        items.map(async (item: any) => {
          // Get latest analysis
          const analysisResponse: any = await (supabase as any)
            .from('ai_analysis_history')
            .select('created_at, decision, confidence')
            .eq('symbol', item.symbol)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get current price
          let currentPrice;
          try {
            const priceResponse = await supabase.functions.invoke('fetch-tatum-price', {
              body: { symbol: item.symbol }
            });
            currentPrice = priceResponse.data?.price;
          } catch (err) {
            console.error(`Error fetching price for ${item.symbol}:`, err);
          }

          return {
            id: item.id,
            symbol: item.symbol,
            nickname: item.nickname,
            notes: item.notes,
            added_at: item.added_at,
            last_analysis_time: analysisResponse.data?.created_at,
            last_decision: analysisResponse.data?.decision,
            last_confidence: analysisResponse.data?.confidence,
            current_price: currentPrice
          };
        })
      );

      setWatchlist(enrichedWatchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, nickname?: string, notes?: string) => {
    if (!user) {
      toast.error('Please sign in to add symbols to your watchlist');
      return { error: 'Not authenticated' };
    }

    try {
      const normalizedSymbol = normalizeSymbol(symbol);
      const response = await (supabase as any)
        .from('user_watchlists')
        .insert([{
          user_id: user.id,
          symbol: normalizedSymbol,
          nickname: nickname || null,
          notes: notes || null,
          is_active: true,
          priority: 0
        }]);

      if (response.error) {
        if (response.error.code === '23505') {
          toast.error('This symbol is already in your watchlist');
          return { error: 'Duplicate symbol' };
        }
        throw response.error;
      }

      toast.success(`${normalizedSymbol} added to watchlist`);
      await fetchWatchlist();
      return { error: null };
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add symbol to watchlist');
      return { error };
    }
  };

  const removeFromWatchlist = async (id: string, symbol: string) => {
    if (!user) return;

    try {
      const response = await (supabase as any)
        .from('user_watchlists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (response.error) throw response.error;

      toast.success(`${symbol} removed from watchlist`);
      await fetchWatchlist();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove symbol from watchlist');
    }
  };

  const updateWatchlistItem = async (id: string, updates: Partial<Pick<WatchlistItem, 'nickname' | 'notes'>>) => {
    if (!user) return;

    try {
      const response = await (supabase as any)
        .from('user_watchlists')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (response.error) throw response.error;

      toast.success('Watchlist item updated');
      await fetchWatchlist();
    } catch (error) {
      console.error('Error updating watchlist item:', error);
      toast.error('Failed to update watchlist item');
    }
  };

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const analyzeSymbol = async (watchlistId: string, symbol: string) => {
    if (!user) {
      toast.error('Please sign in to analyze symbols');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log(`Analyzing ${symbol}...`);
      
      const response = await supabase.functions.invoke('analyze-watchlist-symbol', {
        body: { symbol, watchlist_id: watchlistId }
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data;

      if (!data.success) {
        if (data.status === 'insufficient_data') {
          toast.error(data.message);
          return { success: false, status: 'insufficient_data', message: data.message };
        }
        throw new Error(data.error || 'Analysis failed');
      }

      toast.success(`${symbol}: ${data.decision} (${data.confidence}% confidence)`);
      await fetchWatchlist(); // Refresh to show new data
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error analyzing symbol:', error);
      toast.error(`Failed to analyze ${symbol}`);
      return { success: false, error };
    }
  };

  const analyzeAllSymbols = async () => {
    if (!user || watchlist.length === 0) return;

    toast.info(`Analyzing ${watchlist.length} symbols...`);
    
    const results = {
      total: watchlist.length,
      success: 0,
      failed: 0,
      insufficient_data: 0,
      decisions: { LONG: 0, SHORT: 0, 'NO TRADE': 0 }
    };

    for (let i = 0; i < watchlist.length; i++) {
      const item = watchlist[i];
      toast.info(`Analyzing ${item.symbol} (${i + 1}/${watchlist.length})...`);
      
      const result = await analyzeSymbol(item.id, item.symbol);
      
      if (result.success && result.data) {
        results.success++;
        const decision = result.data.decision as 'LONG' | 'SHORT' | 'NO TRADE';
        results.decisions[decision]++;
      } else if (result.status === 'insufficient_data') {
        results.insufficient_data++;
      } else {
        results.failed++;
      }

      // Wait between requests to avoid overwhelming the system
      if (i < watchlist.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Show summary
    const summary = [
      `✅ ${results.success} analyzed`,
      results.decisions.LONG > 0 ? `📈 ${results.decisions.LONG} LONG` : null,
      results.decisions.SHORT > 0 ? `📉 ${results.decisions.SHORT} SHORT` : null,
      results.decisions['NO TRADE'] > 0 ? `⏸️ ${results.decisions['NO TRADE']} NO TRADE` : null,
      results.insufficient_data > 0 ? `⚠️ ${results.insufficient_data} need more data` : null,
      results.failed > 0 ? `❌ ${results.failed} failed` : null
    ].filter(Boolean).join(' • ');

    toast.success(summary);
  };

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistItem,
    analyzeSymbol,
    analyzeAllSymbols,
    refetch: fetchWatchlist
  };
};
