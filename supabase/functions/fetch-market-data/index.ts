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
        `https://open-api-v4.coinglass.com/api/futures/price/history?exchange=Binance&symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=100`,
        {
          headers: {
            "CG-API-KEY": COINGLASS_KEY,
          },
        }
      ),
      // Tatum v4 - uses base symbol (BTC) and base pair (USD)
      fetch(`https://api.tatum.io/v4/data/rate/symbol?symbol=${encodeURIComponent(baseSymbol)}&basePair=USD`, {
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
    let coinglassResponseTime = 0;
    const coinglassStart = Date.now();
    
    if (coinglassRes.status === "fulfilled" && coinglassRes.value.ok) {
      coinglassResponseTime = Date.now() - coinglassStart;
      const result = await coinglassRes.value.json();
      console.log("Coinglass response:", result);
      
      // Map Coinglass response to our Candle format
      if (result.code === "0" && result.data) {
        candles = result.data.map((item: any) => ({
          timestamp: item.time,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume_usd || item.volume || "0"),
        }));
      } else {
        candlesError = `API Error: ${result.msg || "Unknown error"}`;
      }
    } else {
      coinglassResponseTime = Date.now() - coinglassStart;
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
    let tatumResponseTime = 0;
    const tatumStart = Date.now();
    
    if (tatumRes.status === "fulfilled" && tatumRes.value.ok) {
      tatumResponseTime = Date.now() - tatumStart;
      const data = await tatumRes.value.json();
      console.log("Tatum response:", data);
      spotPrice = parseFloat(data.value || data.price);
    } else {
      tatumResponseTime = Date.now() - tatumStart;
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
    let ninjasResponseTime = 0;
    const ninjasStart = Date.now();
    
    if (ninjasRes.status === "fulfilled" && ninjasRes.value.ok) {
      ninjasResponseTime = Date.now() - ninjasStart;
      const data = await ninjasRes.value.json();
      console.log("API Ninjas response:", data);
      cryptoPrice = parseFloat(data.price);
    } else {
      ninjasResponseTime = Date.now() - ninjasStart;
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
        timestamp: new Date().toISOString(),
        validation: {
          coinglass: {
            valid: candles.length > 0,
            count: candles.length,
            error: candlesError,
            responseTime: coinglassResponseTime,
            endpoint: `https://open-api-v4.coinglass.com/api/futures/price/history`,
            plan: "Hobbyist",
            rateLimit: "30/min",
          },
          tatum: {
            valid: spotPrice !== null,
            price: spotPrice,
            error: spotError,
            responseTime: tatumResponseTime,
            endpoint: `https://api.tatum.io/v4/data/rate/symbol`,
            plan: "Free",
            credits: "100K/month",
          },
          ninjas: {
            valid: cryptoPrice !== null,
            price: cryptoPrice,
            error: cryptoPriceError,
            responseTime: ninjasResponseTime,
            endpoint: `https://api.api-ninjas.com/v1/cryptoprice`,
            plan: "Standard",
            rateLimit: "3K/month",
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
