import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TradingPair {
  symbol: string;
  displayName: string;
}

interface CoinglassCoinsResponse {
  success: boolean;
  coins: string[];
  count: number;
  error?: string;
}

export const useTradingPairs = () => {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke<CoinglassCoinsResponse>(
          "fetch-coinglass-coins"
        );

        if (fetchError) throw fetchError;

        if (data?.success && data.coins) {
          // Transform coin list into trading pairs with USDT
          const tradingPairs: TradingPair[] = data.coins.map(coin => ({
            symbol: `${coin}USDT`,
            displayName: `${coin}/USDT`,
          }));

          // Sort alphabetically
          tradingPairs.sort((a, b) => a.symbol.localeCompare(b.symbol));

          setPairs(tradingPairs);
        } else {
          throw new Error(data?.error || "Failed to fetch trading pairs");
        }
      } catch (err) {
        console.error("Failed to fetch trading pairs:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        
        // Fallback to popular pairs
        setPairs([
          { symbol: "BTCUSDT", displayName: "BTC/USDT" },
          { symbol: "ETHUSDT", displayName: "ETH/USDT" },
          { symbol: "BNBUSDT", displayName: "BNB/USDT" },
          { symbol: "SOLUSDT", displayName: "SOL/USDT" },
          { symbol: "XRPUSDT", displayName: "XRP/USDT" },
          { symbol: "ADAUSDT", displayName: "ADA/USDT" },
          { symbol: "DOGEUSDT", displayName: "DOGE/USDT" },
          { symbol: "MATICUSDT", displayName: "MATIC/USDT" },
          { symbol: "DOTUSDT", displayName: "DOT/USDT" },
          { symbol: "AVAXUSDT", displayName: "AVAX/USDT" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPairs();
  }, []);

  return { pairs, isLoading, error };
};
