import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateSymbol } from '../_shared/symbolFormatter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// In-memory cache with TTL
const CACHE: Record<string, { time: number; data: any }> = {};
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// Safe fetch wrapper that never throws
async function safeFetch(url: string, options: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, text };
    }
    let data;
    try {
      data = await res.json();
    } catch {
      return { ok: false, status: res.status, text: "Failed to parse JSON" };
    }
    return { ok: true, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, error: e.message || "Network Failure" };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { symbol, limit = 100 } = body;
    
    // Validate symbol using shared validation function
    const validation = validateSymbol(symbol);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_SYMBOL',
          message: `Invalid symbol: ${validation.error}`,
          detail: null
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize symbol
    const cleanedSymbol = symbol.toUpperCase().trim();
    let baseSymbol = cleanedSymbol
      .replace(/USDT$/i, '')
      .replace(/USD$/i, '');
    const formattedSymbol = `${baseSymbol}USDT`;

    // Check cache first
    const cacheKey = `candles:${formattedSymbol}:${limit}`;
    const now = Date.now();
    
    if (CACHE[cacheKey] && (now - CACHE[cacheKey].time < CACHE_TTL)) {
      console.log(`Cache hit for ${formattedSymbol} candle data`);
      return new Response(
        JSON.stringify(CACHE[cacheKey].data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const coinglassApiKey = Deno.env.get('COINGLASS_API_KEY');
    const tatumApiKey = Deno.env.get('TATUM_API_KEY');
    
    if (!coinglassApiKey && !tatumApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CONFIG_ERROR',
          message: 'No API keys configured',
          detail: 'Either COINGLASS_API_KEY or TATUM_API_KEY must be set'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching historical candles for ${formattedSymbol}...`);

    let candles: Candle[] = [];

    // Try CoinGlass first (if available)
    if (coinglassApiKey) {
      const cgUrl = new URL('https://open-api-v4.coinglass.com/api/futures/ohlc-history');
      cgUrl.searchParams.append('symbol', formattedSymbol);
      cgUrl.searchParams.append('interval', '4h'); // Hobbyist plan requirement
      cgUrl.searchParams.append('limit', limit.toString());

      const cgResponse = await safeFetch(cgUrl.toString(), {
        headers: {
          'CG-API-KEY': coinglassApiKey,
          'accept': 'application/json'
        }
      });

      if (cgResponse.ok && cgResponse.data?.code === '0' && cgResponse.data?.data) {
        console.log(`CoinGlass returned ${cgResponse.data.data.length} candles`);
        candles = cgResponse.data.data.map((c: any) => ({
          time: Math.floor(c.time / 1000), // Convert ms to seconds for lightweight-charts
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
          volume: parseFloat(c.volume || 0)
        }));
      } else {
        console.log(`CoinGlass failed: ${cgResponse.text || cgResponse.error}`);
      }
    }

    // Fallback to Binance if CoinGlass didn't work
    if (candles.length === 0) {
      console.log(`Trying Binance API for ${formattedSymbol}...`);
      
      try {
        // Binance uses different intervals: 1m, 5m, 15m, 30m, 1h, 4h, 1d
        const binanceUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${formattedSymbol}&interval=1h&limit=${limit}`;
        const binanceResponse = await safeFetch(binanceUrl, {
          headers: { 'accept': 'application/json' }
        });

        if (binanceResponse.ok && Array.isArray(binanceResponse.data)) {
          console.log(`Binance returned ${binanceResponse.data.length} candles`);
          candles = binanceResponse.data.map((k: any) => ({
            time: Math.floor(k[0] / 1000), // Convert ms to seconds
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
          }));
        } else {
          console.log(`Binance failed: ${binanceResponse.text || binanceResponse.error}`);
        }
      } catch (binanceError: any) {
        console.error('Binance API error:', binanceError.message);
      }
    }

    if (candles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NO_DATA',
          message: 'No candle data available from any provider',
          detail: 'Both CoinGlass and Tatum failed to return data'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sort by time ascending
    candles.sort((a, b) => a.time - b.time);

    const responseData = {
      success: true,
      symbol: formattedSymbol,
      candles,
      count: candles.length
    };

    // Cache the result
    CACHE[cacheKey] = { time: now, data: responseData };
    console.log(`Successfully fetched ${candles.length} candles for ${formattedSymbol}`);

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in fetch-historical-candles:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Unknown error occurred',
        detail: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
