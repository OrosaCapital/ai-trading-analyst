import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DURATION_MS = 30 * 1000; // 30 seconds

// Fetch price from Tatum API with caching
async function fetchTatumPrice(
  symbol: string, 
  apiKey: string, 
  supabase: any
): Promise<{ price: number; volume: number; fromCache: boolean }> {
  // Check cache first
  const { data: cachedData } = await supabase
    .from('tatum_price_cache')
    .select('*')
    .eq('symbol', symbol)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cachedData) {
    console.log(`✅ Cache HIT for ${symbol} - Using cached price`);
    return {
      price: cachedData.price_data.price,
      volume: cachedData.price_data.volume || 0,
      fromCache: true
    };
  }

  console.log(`❌ Cache MISS for ${symbol} - Fetching from Tatum API`);
  
  // Extract base symbol (BTC from BTCUSD)
  const baseSymbol = symbol.replace(/USD$|USDT$/, '');
  const url = `https://api.tatum.io/v4/data/rate/symbol?symbol=${baseSymbol}&basePair=USD`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Tatum API error: ${response.status}`);
  }

  const data = await response.json();
  const price = parseFloat(data.value);
  const priceData = {
    symbol,
    price,
    timestamp: Date.now(),
    source: 'tatum',
    high24h: 0,
    low24h: 0,
    change24h: 0,
    volume: 0
  };

  // Cache the fresh data
  const expiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();
  await supabase
    .from('tatum_price_cache')
    .upsert({
      symbol,
      price_data: priceData,
      expires_at: expiresAt,
      cached_at: new Date().toISOString()
    }, {
      onConflict: 'symbol'
    });

  console.log(`💾 Cached ${symbol} price until ${expiresAt}`);

  return {
    price,
    volume: 0,
    fromCache: false
  };
}

// Determine which intervals should be logged based on current time
function getIntervalsToLog(timestamp: Date): string[] {
  const minutes = timestamp.getMinutes();
  const intervals = ['1m']; // Always log 1m

  if (minutes % 5 === 0) intervals.push('5m');
  if (minutes % 10 === 0) intervals.push('10m');
  if (minutes % 15 === 0) intervals.push('15m');

  return intervals;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const TATUM_API_KEY = Deno.env.get('TATUM_API_KEY');
    if (!TATUM_API_KEY) {
      throw new Error('TATUM_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch current price from Tatum (with caching)
    const { price, volume, fromCache } = await fetchTatumPrice(symbol, TATUM_API_KEY, supabase);
    const timestamp = new Date();
    
    console.log(`📊 Logging price for ${symbol}: $${price.toFixed(2)} ${fromCache ? '(cached)' : '(fresh)'}`);

    // Determine which intervals to log
    const intervals = getIntervalsToLog(timestamp);
    console.log(`⏰ Logging intervals: ${intervals.join(', ')}`);

    // Insert logs for each interval
    const insertPromises = intervals.map(interval =>
      supabase.from('tatum_price_logs').insert({
        symbol,
        price,
        volume,
        timestamp: timestamp.toISOString(),
        interval
      })
    );

    await Promise.all(insertPromises);

    // Clean up old logs (keep last 24 hours only)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      await supabase
        .from('tatum_price_logs')
        .delete()
        .eq('symbol', symbol)
        .lt('timestamp', oneDayAgo.toISOString());
      console.log('🧹 Cleaned up old price logs');
    } catch (err) {
      console.error('Cleanup error:', err);
    }

    return new Response(JSON.stringify({
      success: true,
      symbol,
      price,
      intervals,
      timestamp: timestamp.toISOString(),
      cached: fromCache
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tatum-price-logger:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
