import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FundingRateResponse {
  success: boolean;
  symbol: string;
  exchange: string;
  rate: number;
  timestamp: number | string;
  updatedAt?: number;
  error?: string;
  message?: string;
  detail?: any;
}

export const useFundingRate = (symbol: string) => {
  const [data, setData] = useState<FundingRateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't fetch if symbol is empty or invalid
    if (!symbol || symbol.trim() === "" || symbol === "USDT" || symbol === "USD") {
      setIsLoading(false);
      setData(null);
      return;
    }

    const fetchFundingRate = async () => {
      setIsLoading(true);
      try {
        const cleanSymbol = symbol.replace("USDT", "").replace("USD", "").trim();
        
        if (!cleanSymbol) {
          setIsLoading(false);
          return;
        }
        
        // Fetch from database
        const { data: dbRate, error: dbError } = await supabase
          .from('market_funding_rates')
          .select('*')
          .eq('symbol', symbol)
          .eq('exchange', 'Binance')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbError) {
          console.error("Database fetch error:", dbError);
          setIsLoading(false);
          return;
        }

        if (dbRate) {
          setData({
            success: true,
            symbol: dbRate.symbol,
            exchange: dbRate.exchange,
            rate: parseFloat(String(dbRate.rate)),
            timestamp: Number(dbRate.timestamp),
            updatedAt: new Date(dbRate.created_at).getTime()
          });
        }
      } catch (err) {
        console.error("Failed to fetch funding rate:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFundingRate();
    
    // Refresh every 4 hours (matching cache TTL)
    const interval = setInterval(fetchFundingRate, 4 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  return { data, isLoading };
};
