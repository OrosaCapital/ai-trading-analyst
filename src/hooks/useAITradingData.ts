import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISignal {
  decision: "LONG" | "SHORT" | "NO TRADE";
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
  status: "accumulating" | "ready";
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

  const lastSymbolRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!symbol) return;

    // Prevent duplicate loads for the same symbol
    if (lastSymbolRef.current === symbol) return;
    lastSymbolRef.current = symbol;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const startPriceLogger = async () => {
        try {
          await supabase.functions.invoke("tatum-price-logger", {
            body: { symbol },
          });
        } catch (_) {}
      };

      const fetchTradingData = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const { data: tradingData, error: fetchError } = await supabase.functions.invoke("fetch-trading-data", {
            body: { symbol },
          });

          if (fetchError) throw fetchError;

          setData(tradingData);

          if (tradingData.status === "ready") {
            toast.success("AI analysis complete!");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          toast.error("Failed to load trading data");
        } finally {
          setIsLoading(false);
        }
      };

      startPriceLogger();
      fetchTradingData();
    }, 300);
  }, [symbol]);

  return { data, isLoading, error };
};
