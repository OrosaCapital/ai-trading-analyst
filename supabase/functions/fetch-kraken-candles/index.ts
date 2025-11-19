import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { translateToKraken } from '../_shared/krakenSymbols.ts';
import { isPairSupported } from '../_shared/krakenPairDiscovery.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const symbol = body.symbol || 'BTCUSDT';
    const interval = body.interval || 60; // minutes (60 = 1h)
    
    // Map interval to timeframe label
    const timeframeMap: Record<number, string> = {
      1: '1m',
      5: '5m',
      15: '15m',
      60: '1h',
      240: '4h',
      1440: '1d'
    };
    const timeframe = timeframeMap[interval] || '1h';
    
    console.log(`📊 Fetching ${timeframe} candles for ${symbol} from Kraken...`);
    
    // Translate and validate symbol
    const krakenSymbol = translateToKraken(symbol);
    const supported = await isPairSupported(krakenSymbol);
    
    if (!supported) {
      console.log(`⚠️ ${symbol} (${krakenSymbol}) not supported by Kraken`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Symbol ${symbol} not supported by Kraken` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Fetch 720 candles from Kraken
    const url = `https://api.kraken.com/0/public/OHLC?pair=${krakenSymbol}&interval=${interval}`;
    console.log(`🌐 Kraken API URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API error: ${data.error.join(', ')}`);
    }
    
    // Kraken returns data with the pair name as key
    const pairData = data.result[krakenSymbol] || data.result[Object.keys(data.result)[0]];
    
    if (!pairData) {
      throw new Error(`No candle data returned for ${krakenSymbol}`);
    }
    
    // Transform Kraken format to our format
    const candles = pairData.map((c: any[]) => ({
      symbol,
      timeframe,
      timestamp: c[0], // Unix timestamp
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[6])
    }));
    
    console.log(`✅ Fetched ${candles.length} candles for ${symbol}`);
    
    // Insert into market_candles (upsert to avoid duplicates)
    const { error } = await supabaseClient
      .from('market_candles')
      .upsert(candles, { 
        onConflict: 'symbol,timestamp,timeframe',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }
    
    console.log(`💾 Stored ${candles.length} candles in database`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        symbol,
        timeframe,
        count: candles.length,
        source: 'kraken'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Kraken candles:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
