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

    // Parse symbol for different API formats
    // BTCUSDT -> BTC for Tatum, BTCUSD for Ninjas
    const baseSymbol = symbol.replace(/USDT$/, "");
    const ninjasSymbol = symbol.replace(/USDT$/, "USD");

    console.log(`Fetching data for ${symbol} (base: ${baseSymbol}, ninjas: ${ninjasSymbol})`);

    // Fetch all data in parallel
    const [coinglassRes, tatumRes, ninjasRes] = await Promise.allSettled([
      // Coinglass OHLC - uses full symbol like BTCUSDT
      fetch(
        `https://open-api-v4.coinglass.com/api/price/ohlc-history?symbol=${encodeURIComponent(symbol)}&interval=${interval}&exchange=binance`,
        {
          headers: {
            "CG-API-KEY": COINGLASS_KEY,
          },
        }
      ),
      // Tatum v4 - uses base symbol (BTC) and base pair (USD)
      fetch(`https://api.tatum.io/v4/data/rate?symbol=${encodeURIComponent(baseSymbol)}&basePair=USD`, {
        headers: {
          "x-api-key": TATUM_KEY,
        },
      }),
      // API Ninjas crypto price - uses BTCUSD format
      fetch(`https://api.api-ninjas.com/v1/cryptoprice?symbol=${encodeURIComponent(ninjasSymbol)}`, {
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
      console.log("Coinglass response:", data);
      candles = data.data || [];
    } else {
      const errorText = coinglassRes.status === "fulfilled" 
        ? await coinglassRes.value.text()
        : coinglassRes.reason.message;
      candlesError = coinglassRes.status === "rejected" 
        ? coinglassRes.reason.message 
        : `HTTP ${coinglassRes.value.status}: ${errorText}`;
      console.error("Coinglass error:", candlesError);
    }

    // Process Tatum data
    let spotPrice = null;
    let spotError = null;
    if (tatumRes.status === "fulfilled" && tatumRes.value.ok) {
      const data = await tatumRes.value.json();
      console.log("Tatum response:", data);
      spotPrice = parseFloat(data.value || data.price);
    } else {
      const errorText = tatumRes.status === "fulfilled" 
        ? await tatumRes.value.text()
        : tatumRes.reason.message;
      spotError = tatumRes.status === "rejected" 
        ? tatumRes.reason.message 
        : `HTTP ${tatumRes.value.status}: ${errorText}`;
      console.error("Tatum error:", spotError);
    }

    // Process API Ninjas data
    let cryptoPrice = null;
    let cryptoPriceError = null;
    if (ninjasRes.status === "fulfilled" && ninjasRes.value.ok) {
      const data = await ninjasRes.value.json();
      console.log("API Ninjas response:", data);
      cryptoPrice = parseFloat(data.price);
    } else {
      const errorText = ninjasRes.status === "fulfilled" 
        ? await ninjasRes.value.text()
        : ninjasRes.reason.message;
      cryptoPriceError = ninjasRes.status === "rejected" 
        ? ninjasRes.reason.message 
        : `HTTP ${ninjasRes.value.status}: ${errorText}`;
      console.error("API Ninjas error:", cryptoPriceError);
    }

    // Return combined data with validation info
    return new Response(
      JSON.stringify({
        symbol,
        timeframe,
        candles,
        spotPrice,
        cryptoPrice,
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
            valid: cryptoPrice !== null,
            price: cryptoPrice,
            error: cryptoPriceError,
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
