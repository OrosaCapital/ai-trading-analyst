import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
              body: { symbol: `${item.symbol}USD` }
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
      const response = await (supabase as any)
        .from('user_watchlists')
        .insert([{
          user_id: user.id,
          symbol: symbol.toUpperCase(),
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

      toast.success(`${symbol.toUpperCase()} added to watchlist`);
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

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistItem,
    refetch: fetchWatchlist
  };
};
