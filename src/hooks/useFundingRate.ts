import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FundingRateResponse {
  success: boolean;
  symbol: string;
  exchange: string;
  rate: number;
  timestamp: number;
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

        if (error) {
          console.error("Failed to fetch funding rate:", error);
          return;
        }
        
        if (result?.success) {
          setData(result);
        } else if (result?.error) {
          console.error("Funding rate error:", result.error, result.message);
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
