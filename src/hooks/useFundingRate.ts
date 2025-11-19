import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FundingRateResponse {
  success: boolean;
  symbol: string;
  exchange: string;
  rate: number;
  timestamp: number;
  error?: string;
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
        
        // Double check after cleaning
        if (!cleanSymbol) {
          setIsLoading(false);
          return;
        }
        
        const { data: result, error } = await supabase.functions.invoke<FundingRateResponse>(
          "fetch-current-funding",
          {
            body: { 
              symbol: cleanSymbol, 
              exchange: "Binance"
            },
          }
        );

        if (error) throw error;
        if (result?.success) {
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch funding rate:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFundingRate();
    
    // Refresh every 8 hours (funding rate interval)
    const interval = setInterval(fetchFundingRate, 8 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  return { data, isLoading };
};
