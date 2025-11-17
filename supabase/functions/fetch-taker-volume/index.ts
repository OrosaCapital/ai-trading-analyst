import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { fetchFromCoinglassV2 } from '../_shared/coinglassClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchTakerVolumeFromCoinglass(symbol: string, apiKey: string) {
  console.log(`Fetching taker volume (CVD) from Coinglass for ${symbol}`);
  
  try {
    // Convert symbol to USDT pair format
    const cleanSymbol = symbol.toUpperCase().replace('USD', '').replace('USDT', '') + 'USDT';
    
    // Use database lookup for endpoint - Hobbyist plan requires >=4h interval
    const data = await fetchFromCoinglassV2(
      'taker_volume',
      {
        exchange: 'Binance',
        symbol: cleanSymbol,
        interval: '4h',
        limit: '24'
      },
      apiKey
    );
    console.log('Coinglass taker volume data received:', data);

    // Handle v4 API response structure
    if (data.code !== '0' || !data.data || data.data.length === 0) {
      throw new Error('Invalid response from Coinglass API');
    }

    // Calculate totals from historical data (4h intervals)
    const totalBuyVolume = data.data.reduce((sum: number, item: any) => 
      sum + parseFloat(item.taker_buy_volume_usd || 0), 0);
    const totalSellVolume = data.data.reduce((sum: number, item: any) => 
      sum + parseFloat(item.taker_sell_volume_usd || 0), 0);
    
    const delta = totalBuyVolume - totalSellVolume;
    const cvd = delta; // Cumulative volume delta

    // Get latest data point for current values
    const latest = data.data[data.data.length - 1];
    const latestBuy = parseFloat(latest.taker_buy_volume_usd || 0);
    const latestSell = parseFloat(latest.taker_sell_volume_usd || 0);
    const latestDelta = latestBuy - latestSell;

    const cvdData = {
      '4h': {
        current_cvd: cvd.toFixed(2),
        buy_volume: totalBuyVolume.toFixed(2),
        sell_volume: totalSellVolume.toFixed(2),
        delta: delta.toFixed(2),
        trend: delta > 0 ? 'BULLISH' : 'BEARISH',
      },
      latest: {
        current_cvd: latestDelta.toFixed(2),
        buy_volume: latestBuy.toFixed(2),
        sell_volume: latestSell.toFixed(2),
        delta: latestDelta.toFixed(2),
        trend: latestDelta > 0 ? 'BULLISH' : 'BEARISH',
      }
    };

    const avgDelta = delta;

    return {
      symbol,
      timestamp: new Date().toISOString(),
      cvd: cvdData,
      summary: {
        dominant_trend: avgDelta > 0 ? 'BULLISH' : 'BEARISH',
        strength: Math.min(100, Math.abs(avgDelta / 10000000)).toFixed(0),
        signal: avgDelta > 50000000 ? 'BUY' : avgDelta < -50000000 ? 'SELL' : 'NEUTRAL',
      },
      historical: data.data.map((item: any) => ({
        time: item.time,
        buy_volume: item.taker_buy_volume_usd,
        sell_volume: item.taker_sell_volume_usd,
        delta: (parseFloat(item.taker_buy_volume_usd) - parseFloat(item.taker_sell_volume_usd)).toFixed(2),
      })),
    };
  } catch (error) {
    console.error('Error fetching from Coinglass:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { symbol } = await req.json();
    console.log('Fetching taker volume (CVD) for symbol:', symbol);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('symbol', symbol)
      .eq('data_type', 'taker_volume')
      .single();

    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      console.log('Returning cached taker volume data');
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only fetch from CoinGlass - NO MOCK DATA
    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    
    if (!apiKey) {
      throw new Error('CoinGlass API key not configured. Please add COINGLASS_API_KEY secret.');
    }

    let volumeData;
    try {
      volumeData = await fetchTakerVolumeFromCoinglass(symbol, apiKey);
    } catch (error) {
      throw new Error(`Failed to fetch taker volume for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cache the result
    await supabase.from('market_data_cache').upsert({
      symbol,
      data_type: 'taker_volume',
      data: volumeData,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(volumeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
