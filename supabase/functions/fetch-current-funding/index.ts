import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateSymbol } from '../_shared/symbolFormatter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FundingRateData {
  symbol: string;
  rate: string;
  time: number;
}

interface CoinglassResponse {
  code: string;
  msg: string;
  data: FundingRateData[];
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
    const { symbol, exchange = 'Binance' } = body;
    
    // Validate symbol
    const validation = validateSymbol(symbol);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
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
    const cacheKey = `${formattedSymbol}:${exchange}:current`;
    const now = Date.now();
    
    if (CACHE[cacheKey] && (now - CACHE[cacheKey].time < CACHE_TTL)) {
      console.log(`Cache hit for ${formattedSymbol} current funding rate`);
      return new Response(
        JSON.stringify(CACHE[cacheKey].data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'CONFIG_ERROR',
          message: 'COINGLASS_API_KEY not configured',
          detail: null
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching current funding rate for ${formattedSymbol} on ${exchange}...`);

    const url = new URL('https://open-api-v4.coinglass.com/api/futures/funding-rate/current');
    url.searchParams.append('symbol', formattedSymbol);

    const cgResponse = await safeFetch(url.toString(), {
      headers: {
        'CG-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    const data: CoinglassResponse = cgResponse.data;
    
    if (!cgResponse.ok || data.code !== '0' || !data.data) {
      // CoinGlass doesn't support this symbol - return empty data gracefully
      console.log(`CoinGlass doesn't support ${formattedSymbol} (404)`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SYMBOL_NOT_SUPPORTED',
          message: `${formattedSymbol} not available in CoinGlass`,
          symbol: formattedSymbol,
          data: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the funding rate for the specified exchange
    const exchangeData = data.data.find(item => 
      item.symbol.toLowerCase().includes(exchange.toLowerCase())
    ) || data.data[0]; // Fallback to first exchange if not found

    const rate = parseFloat(exchangeData.rate);

    console.log(`Current funding rate for ${formattedSymbol}: ${rate}%`);

    const payload = {
      success: true,
      symbol: formattedSymbol,
      exchange: exchangeData.symbol,
      rate,
      timestamp: exchangeData.time,
      updatedAt: now
    };

    // Store in cache
    CACHE[cacheKey] = { time: now, data: payload };

    return new Response(
      JSON.stringify(payload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in fetch-current-funding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'UNEXPECTED_ERROR',
        message: errorMessage,
        detail: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
