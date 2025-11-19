import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeSymbol } from "@/lib/symbolUtils";

export interface WatchlistItem {
  id: string;
  symbol: string;
  nickname: string | null;
  notes: string | null;
  added_at: string;
  current_price?: number;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lastUserRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const priceCacheRef = useRef<Record<string, number>>({});

  const fetchWatchlist = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const watchlistResponse = await supabase
        .from("user_watchlists")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("added_at", { ascending: false });

      if (watchlistResponse.error) throw watchlistResponse.error;

      const items = watchlistResponse.data || [];

      const enriched = await Promise.all(
        items.map(async (item) => {
          // Price (cached to prevent flooding)
          let price = priceCacheRef.current[item.symbol];

          if (!price) {
            try {
              const priceRes = await supabase.functions.invoke("fetch-cmc-price", {
                body: { symbol: item.symbol },
              });

              if (priceRes.data?.price) {
                price = parseFloat(priceRes.data.price);
                priceCacheRef.current[item.symbol] = price;
              }
            } catch (_) {}
          }

          return {
            id: item.id,
            symbol: item.symbol,
            nickname: item.nickname,
            notes: item.notes,
            added_at: item.added_at,
            current_price: price || null,
          };
        }),
      );

      setWatchlist(enriched);
    } catch (err) {
      console.error("Error fetching watchlist:", err);
      toast.error("Failed to load watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, nickname?: string, notes?: string) => {
    if (!user) {
      toast.error("Please sign in to add symbols");
      return { error: "Not authenticated" };
    }

    try {
      const normalizedSymbol = normalizeSymbol(symbol);

      const response = await supabase.from("user_watchlists").insert([
        {
          user_id: user.id,
          symbol: normalizedSymbol,
          nickname: nickname ?? null,
          notes: notes ?? null,
          is_active: true,
          priority: 0,
        },
      ]);

      if (response.error) {
        if (response.error.code === "23505") {
          toast.error("This symbol is already in your watchlist");
          return { error: "Duplicate symbol" };
        }
        throw response.error;
      }

      toast.success(`${normalizedSymbol} added to watchlist`);
      await fetchWatchlist();
      return { error: null };
    } catch (err) {
      console.error("Error adding to watchlist:", err);
      toast.error("Failed to add symbol");
      return { error: err };
    }
  };

  const removeFromWatchlist = async (id: string, symbol: string) => {
    if (!user) return;

    try {
      const response = await supabase.from("user_watchlists").delete().eq("id", id).eq("user_id", user.id);

      if (response.error) throw response.error;

      toast.success(`${symbol} removed`);
      await fetchWatchlist();
    } catch (err) {
      console.error("Error removing:", err);
      toast.error("Failed to remove symbol");
    }
  };

  const updateWatchlistItem = async (id: string, updates: Partial<Pick<WatchlistItem, "nickname" | "notes">>) => {
    if (!user) return;

    try {
      const response = await supabase.from("user_watchlists").update(updates).eq("id", id).eq("user_id", user.id);

      if (response.error) throw response.error;

      toast.success("Item updated");
      await fetchWatchlist();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update");
    }
  };

  useEffect(() => {
    if (!user) return;

    if (lastUserRef.current === user.id) return;
    lastUserRef.current = user.id;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      fetchWatchlist();
    }, 300);
  }, [user]);

  const analyzeSymbol = async (watchlistId: string, symbol: string) => {
    if (!user) {
      toast.error("Please sign in first");
      return { success: false };
    }

    try {
      const response = await supabase.functions.invoke("analyze-watchlist-symbol", {
        body: { symbol, watchlist_id: watchlistId },
      });

      if (response.error) throw response.error;

      const data = response.data;

      if (!data.success) {
        if (data.status === "insufficient_data") {
          toast.error(data.message);
          return { success: false, status: "insufficient_data" };
        }
        throw new Error(data.error || "Analysis failed");
      }

      toast.success(`${symbol}: ${data.decision} (${data.confidence}%)`);
      await fetchWatchlist();
      return { success: true, data };
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Failed to analyze");
      return { success: false };
    }
  };

  const analyzeAllSymbols = async () => {
    if (!user || watchlist.length === 0) return;

    toast.info(`Analyzing ${watchlist.length} symbols...`);

    for (let i = 0; i < watchlist.length; i++) {
      const item = watchlist[i];
      await analyzeSymbol(item.id, item.symbol);

      // throttle (Prevents supabase flood)
      await new Promise((r) => setTimeout(r, 1500));
    }

    toast.success("All symbols analyzed");
  };

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistItem,
    analyzeSymbol,
    analyzeAllSymbols,
    refetch: fetchWatchlist,
  };
};
