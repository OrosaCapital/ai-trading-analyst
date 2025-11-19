import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Candle } from "@/lib/indicators";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

interface AIAnalysis {
  signal: string;
  message: string;
  timestamp: number;
}

export function useAIAnalysis(
  symbol: string,
  candles1h: Candle[],
  candles15m: Candle[],
  indicators: any
) {
  const hasShownToast = useRef(false);

  // Check if symbol is tracked and active
  const { data: isTracked } = useQuery({
    queryKey: ["isTracked", symbol],
    queryFn: async () => {
      if (!symbol) return false;
      const { data } = await supabase
        .from("tracked_symbols")
        .select("active")
        .eq("symbol", symbol)
        .maybeSingle();
      return data?.active ?? false;
    },
    enabled: !!symbol,
    staleTime: 60000, // 1 minute
  });

  // Run AI analysis with 5-minute polling, only for tracked symbols
  const { data: analysis, isLoading: isAnalyzing } = useQuery({
    queryKey: ["aiAnalysis", symbol, candles1h.length, candles15m.length],
    queryFn: async () => {
      if (!symbol || candles1h.length < 10) return null;

      const latest1h = candles1h.slice(-50);
      const latest15m = candles15m.slice(-20);
      const last1h = latest1h[latest1h.length - 1];

      const summary = `Symbol: ${symbol}
Current Price: ${last1h?.close || 0}
1H Trend: ${indicators["1h"]?.ema50?.slice(-1)[0] > last1h?.close ? "Below EMA50" : "Above EMA50"}
RSI 1H: ${indicators["1h"]?.rsi?.slice(-1)[0]?.toFixed(1) || "N/A"}
RSI 15M: ${indicators["15m"]?.rsi?.slice(-1)[0]?.toFixed(1) || "N/A"}
Recent 1H High: ${Math.max(...latest1h.map(c => c.high))}
Recent 1H Low: ${Math.min(...latest1h.map(c => c.low))}`;

      console.log("AI Analysis: Sending request for tracked symbol:", symbol);
      
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Analyze this trading data and give ONE decisive signal:\n${summary}`
            }
          ],
          symbol,
          stream: false
        }
      });

      if (error) throw error;

      return {
        signal: "ANALYZED",
        message: data?.message || "Analysis complete",
        timestamp: Date.now()
      } as AIAnalysis;
    },
    enabled: !!symbol && !!isTracked && candles1h.length >= 10,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
    refetchIntervalInBackground: false, // Stop polling when tab is inactive
  });

  // Show toast only once when analysis completes for the active symbol
  useEffect(() => {
    if (analysis && !hasShownToast.current) {
      toast({
        title: "✅ AI Analysis Complete",
        description: `${symbol}: ${analysis.message}`,
      });
      hasShownToast.current = true;
    }
  }, [analysis, symbol]);

  // Reset toast flag when symbol changes
  useEffect(() => {
    hasShownToast.current = false;
  }, [symbol]);

  return { analysis, isAnalyzing };
}
