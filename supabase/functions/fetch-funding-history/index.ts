import { createClient } from '@supabase/supabase-js'
import { validateSymbol } from '../_shared/symbolFormatter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FundingRateCandle {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
}

interface CoinglassResponse {
  code: string;
  msg: string;
  data: FundingRateCandle[];
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
    const { symbol, exchange = 'Binance', interval = '4h', limit = 100 } = body;
    
    // Validate symbol using shared validation function
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

    // Enforce 4h interval for Hobbyist plan
    if (interval !== '4h') {
      return new Response(
        JSON.stringify({
          error: 'INVALID_INTERVAL',
          message: 'Hobbyist plan requires 4h interval',
          detail: 'Please upgrade your plan for more granular intervals'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize symbol for CoinGlass API
    const cleanedSymbol = symbol.toUpperCase().trim();
    let baseSymbol = cleanedSymbol
      .replace(/USDT$/i, '')
      .replace(/USD$/i, '');
    const formattedSymbol = `${baseSymbol}USDT`;

    // Check cache first
    const cacheKey = `${formattedSymbol}:${exchange}:funding:4h`;
    const now = Date.now();
    
    if (CACHE[cacheKey] && (now - CACHE[cacheKey].time < CACHE_TTL)) {
      console.log(`Cache hit for ${formattedSymbol} funding rate history`);
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

    console.log(`Fetching funding rate history for ${formattedSymbol} on ${exchange} with interval ${interval}...`);

    const url = new URL('https://open-api-v4.coinglass.com/api/futures/funding-rate/history');
    url.searchParams.append('exchange', exchange);
    url.searchParams.append('symbol', formattedSymbol);
    url.searchParams.append('interval', interval);
    url.searchParams.append('limit', limit.toString());

    const cgResponse = await safeFetch(url.toString(), {
      headers: {
        'CG-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    if (!cgResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'COINGLASS_ERROR',
          message: 'Failed to fetch from CoinGlass API',
          detail: cgResponse.text || cgResponse.error || null,
          status: cgResponse.status
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: CoinglassResponse = cgResponse.data;

    if (data.code !== '0' || !data.data) {
      return new Response(
        JSON.stringify({
          error: 'COINGLASS_API_ERROR',
          message: `CoinGlass API error: ${data.msg}`,
          detail: data
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert string values to numbers and calculate stats
    const numericCandles = data.data.map(candle => ({
      time: candle.time,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
    }));

    // Calculate average funding rate
    const avgFunding = numericCandles.length > 0
      ? numericCandles.reduce((sum, candle) => sum + candle.close, 0) / numericCandles.length
      : 0;

    // Find min and max
    const rates = numericCandles.map(c => c.close);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    console.log(`Successfully fetched ${numericCandles.length} funding rate candles. Avg: ${avgFunding.toFixed(4)}%`);

    // 🔥 CRITICAL: Store in database per L.md architecture
    // External APIs → Database Tables → React Components
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert all funding rate candles into database
    const fundingRecords = numericCandles.map(candle => ({
      symbol: formattedSymbol,
      exchange: exchange,
      rate: candle.close,
      timestamp: candle.time
    }));

    const { error: insertError } = await supabase
      .from('market_funding_rates')
      .upsert(fundingRecords, {
        onConflict: 'symbol,exchange,timestamp',
        ignoreDuplicates: true
      });

    if (insertError) {
      console.error('Failed to store funding history in database:', insertError);
    } else {
      console.log(`✅ Stored ${fundingRecords.length} funding rate records for ${formattedSymbol}`);
    }

    const payload = {
      success: true,
      symbol,
      exchange,
      interval,
      candles: numericCandles,
      stats: {
        count: numericCandles.length,
        average: avgFunding,
        min: minRate,
        max: maxRate,
      },
      updatedAt: now
    };

    // Store in cache
    CACHE[cacheKey] = { time: now, data: payload };

    return new Response(
      JSON.stringify(payload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in fetch-funding-history:', error);
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
