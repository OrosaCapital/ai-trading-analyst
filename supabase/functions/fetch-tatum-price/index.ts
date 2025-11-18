import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DURATION_MS = 30 * 1000; // 30 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    // Initialize Supabase client for caching
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check cache first
    const { data: cachedData } = await supabase
      .from('tatum_price_cache')
      .select('*')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cachedData) {
      console.log(`✅ Cache HIT for ${symbol} - Saved API call!`);
      return new Response(
        JSON.stringify(cachedData.price_data),
        { 
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        }
      );
    }

    console.log(`❌ Cache MISS for ${symbol} - Fetching from Tatum API`);

    const apiKey = Deno.env.get('TATUM_API_KEY');
    if (!apiKey) {
      throw new Error('TATUM_API_KEY not configured');
    }

    // Extract base symbol (BTC from BTCUSD, ETH from ETHUSD, etc.)
    const baseSymbol = symbol.replace(/USD$|USDT$/, '');
    
    console.log(`Fetching Tatum price for ${baseSymbol}/USD`);

    const response = await fetch(
      `https://api.tatum.io/v4/data/rate/symbol?symbol=${baseSymbol}&basePair=USD`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tatum API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          unavailable: true, 
          reason: 'TATUM_API_ERROR',
          message: `Tatum API returned ${response.status}`
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    console.log('Tatum API response:', JSON.stringify(data));
    
    const priceData = {
      symbol: symbol,
      price: parseFloat(data.value), // Tatum v4 uses 'value' not 'rate'
      timestamp: Date.now(),
      source: 'tatum',
      high24h: 0,
      low24h: 0,
      change24h: 0,
      volume: 0
    };

    console.log(`✅ Tatum price for ${symbol}: $${priceData.price}`);

    // Cache the fresh data with 30-second expiration
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();
    
    const { error: cacheError } = await supabase
      .from('tatum_price_cache')
      .upsert({
        symbol,
        price_data: priceData,
        expires_at: expiresAt,
        cached_at: new Date().toISOString()
      }, {
        onConflict: 'symbol'
      });

    if (cacheError) {
      console.error('Cache write error:', cacheError);
      // Continue even if caching fails - don't block the response
    } else {
      console.log(`💾 Cached ${symbol} until ${expiresAt}`);
    }

    return new Response(
      JSON.stringify(priceData),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
        }
      }
    );

  } catch (error) {
    console.error('Error in fetch-tatum-price:', error);
    
    return new Response(
      JSON.stringify({ 
        unavailable: true,
        reason: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
