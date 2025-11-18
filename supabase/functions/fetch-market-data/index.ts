import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarketDataRequest {
  symbol: string;
  timeframe: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, timeframe }: MarketDataRequest = await req.json();

    const COINGLASS_KEY = Deno.env.get("VITE_COINGLASS_API_KEY");
    const TATUM_KEY = Deno.env.get("VITE_TATUM_API_KEY");
    const NINJAS_KEY = Deno.env.get("VITE_API_NINJAS_KEY");

    if (!COINGLASS_KEY || !TATUM_KEY || !NINJAS_KEY) {
      throw new Error("API keys not configured");
    }

    // Map timeframe to Coinglass interval
    const intervalMap: Record<string, string> = {
      "1m": "4h",
      "5m": "4h",
      "15m": "4h",
      "1h": "4h",
      "4h": "4h",
      "1d": "1d",
    };
    const interval = intervalMap[timeframe] || "4h";

    // Fetch all data in parallel
    const [coinglassRes, tatumRes, ninjasRes] = await Promise.allSettled([
      // Coinglass OHLC
      fetch(
        `https://open-api-v4.coinglass.com/api/price/ohlc-history?symbol=${symbol}&interval=${interval}&exchange=binance`,
        {
          headers: {
            "CG-API-KEY": COINGLASS_KEY,
          },
        }
      ),
      // Tatum spot price
      fetch(`https://api.tatum.io/v3/market/value/${symbol}`, {
        headers: {
          "x-api-key": TATUM_KEY,
        },
      }),
      // API Ninjas news
      fetch(`https://api.api-ninjas.com/v1/news?symbol=${symbol}`, {
        headers: {
          "X-Api-Key": NINJAS_KEY,
        },
      }),
    ]);

    // Process Coinglass data
    let candles = [];
    let candlesError = null;
    if (coinglassRes.status === "fulfilled" && coinglassRes.value.ok) {
      const data = await coinglassRes.value.json();
      candles = data.data || [];
    } else {
      candlesError = coinglassRes.status === "rejected" 
        ? coinglassRes.reason.message 
        : `HTTP ${coinglassRes.value.status}`;
    }

    // Process Tatum data
    let spotPrice = null;
    let spotError = null;
    if (tatumRes.status === "fulfilled" && tatumRes.value.ok) {
      const data = await tatumRes.value.json();
      spotPrice = parseFloat(data.price);
    } else {
      spotError = tatumRes.status === "rejected" 
        ? tatumRes.reason.message 
        : `HTTP ${tatumRes.value.status}`;
    }

    // Process API Ninjas data
    let news = [];
    let newsError = null;
    if (ninjasRes.status === "fulfilled" && ninjasRes.value.ok) {
      news = await ninjasRes.value.json();
    } else {
      newsError = ninjasRes.status === "rejected" 
        ? ninjasRes.reason.message 
        : `HTTP ${ninjasRes.value.status}`;
    }

    // Return combined data with validation info
    return new Response(
      JSON.stringify({
        symbol,
        timeframe,
        candles,
        spotPrice,
        news,
        validation: {
          coinglass: {
            valid: candles.length > 0,
            count: candles.length,
            error: candlesError,
          },
          tatum: {
            valid: spotPrice !== null,
            price: spotPrice,
            error: spotError,
          },
          ninjas: {
            valid: news.length > 0,
            count: news.length,
            error: newsError,
          },
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching market data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
