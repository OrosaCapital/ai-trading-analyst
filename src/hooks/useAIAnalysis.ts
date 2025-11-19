import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Candle } from "@/lib/indicators";
import { toast } from "@/hooks/use-toast";

interface AIAnalysis {
  signal: string;
  message: string;
  timestamp: number;
}

const cache = new Map<string, { result: AIAnalysis; expiresAt: number }>();

export function useAIAnalysis(
  symbol: string,
  candles1h: Candle[],
  candles15m: Candle[],
  indicators: any
) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log("AI Analysis Hook:", { 
      symbol, 
      candles1hCount: candles1h.length, 
      candles15mCount: candles15m.length,
      indicators,
      hasIndicators1h: !!indicators?.["1h"],
      hasIndicators15m: !!indicators?.["15m"]
    });
    
    if (!symbol || candles1h.length < 10) {
      console.log("AI Analysis: Not enough data yet", { symbol, count: candles1h.length });
      return;
    }

    // Check cache
    const cached = cache.get(symbol);
    if (cached && cached.expiresAt > Date.now()) {
      console.log("AI Analysis: Using cached result");
      setAnalysis(cached.result);
      return;
    }

    // Debounce 500ms
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      console.log("AI Analysis: Starting analysis for", symbol);
      toast({
        title: "🤖 AI Analysis",
        description: `Analyzing ${symbol}...`,
      });
      setIsAnalyzing(true);

      try {
        const latest1h = candles1h.slice(-50);
        const latest15m = candles15m.slice(-20);
        const last1h = latest1h[latest1h.length - 1];
        const last15m = latest15m[latest15m.length - 1];

        const summary = `Symbol: ${symbol}
Current Price: ${last1h?.close || 0}
1H Trend: ${indicators["1h"]?.ema50?.slice(-1)[0] > last1h?.close ? "Below EMA50" : "Above EMA50"}
RSI 1H: ${indicators["1h"]?.rsi?.slice(-1)[0]?.toFixed(1) || "N/A"}
RSI 15M: ${indicators["15m"]?.rsi?.slice(-1)[0]?.toFixed(1) || "N/A"}
Recent 1H High: ${Math.max(...latest1h.map(c => c.high))}
Recent 1H Low: ${Math.min(...latest1h.map(c => c.low))}`;

        console.log("AI Analysis: Sending request with summary:", summary);
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

        console.log("AI Analysis: Response received", { data, error });
        if (error) throw error;

        const result: AIAnalysis = {
          signal: "ANALYZED",
          message: data?.message || "Analysis complete",
          timestamp: Date.now()
        };

        toast({
          title: "✅ AI Analysis Complete",
          description: data?.message || "Analysis complete",
        });

        setAnalysis(result);
        cache.set(symbol, { result, expiresAt: Date.now() + 300000 }); // 5 min
      } catch (err) {
        console.error("AI analysis failed:", err);
        toast({
          title: "❌ AI Analysis Failed",
          description: "Could not complete analysis",
          variant: "destructive"
        });
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [symbol, candles1h.length, candles15m.length, indicators]);

  return { analysis, isAnalyzing };
}
