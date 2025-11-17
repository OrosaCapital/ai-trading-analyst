import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { fetchFromCoinglass } from '../_shared/coinglassClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchTakerVolumeFromCoinglass(symbol: string, apiKey: string) {
  console.log(`Fetching taker volume (CVD) from Coinglass for ${symbol}`);
  
  try {
    // Use v4 API endpoint
    const data = await fetchFromCoinglass(
      `/api/futures/taker-buy-sell-ratio?symbol=${symbol}&interval=h1`,
      apiKey
    );
    console.log('Coinglass taker volume data received:', data);

    // Handle v4 API response structure
    if (!data.success || !data.data) {
      throw new Error('Invalid response from Coinglass API');
    }

    const responseData = data.data;
    const intervals = ['5m', '15m', '1h', '4h'];
    const cvdData: any = {};
    
    // Parse v4 API response (structure may vary)
    intervals.forEach(interval => {
      if (responseData[interval]) {
        const intervalData = responseData[interval];
        const buyVol = parseFloat(intervalData.buyVolume || intervalData.buy || 0);
        const sellVol = parseFloat(intervalData.sellVolume || intervalData.sell || 0);
        const delta = buyVol - sellVol;

        cvdData[interval] = {
          current_cvd: delta.toFixed(2),
          buy_volume: buyVol.toFixed(2),
          sell_volume: sellVol.toFixed(2),
          delta: delta.toFixed(2),
          trend: delta > 0 ? 'BULLISH' : 'BEARISH',
        };
      }
    });

    // If no interval data, try to parse as array
    if (Object.keys(cvdData).length === 0 && Array.isArray(responseData)) {
      intervals.forEach(interval => {
        const intervalData = responseData.filter((item: any) => item.interval === interval);
        if (intervalData.length > 0) {
          const latest = intervalData[0];
          const buyVol = parseFloat(latest.buyVolume || latest.buy || 0);
          const sellVol = parseFloat(latest.sellVolume || latest.sell || 0);
          const delta = buyVol - sellVol;

          cvdData[interval] = {
            current_cvd: delta.toFixed(2),
            buy_volume: buyVol.toFixed(2),
            sell_volume: sellVol.toFixed(2),
            delta: delta.toFixed(2),
            trend: delta > 0 ? 'BULLISH' : 'BEARISH',
          };
        }
      });
    }

    const allDeltas = Object.values(cvdData).map((d: any) => parseFloat(d.delta));
    const avgDelta = allDeltas.length > 0 ? allDeltas.reduce((a, b) => a + b, 0) / allDeltas.length : 0;

    return {
      symbol,
      timestamp: new Date().toISOString(),
      cvd: cvdData,
      summary: {
        dominant_trend: avgDelta > 0 ? 'BULLISH' : 'BEARISH',
        strength: Math.min(100, Math.abs(avgDelta / 10000)).toFixed(0),
        signal: avgDelta > 50000 ? 'BUY' : avgDelta < -50000 ? 'SELL' : 'NEUTRAL',
      },
      raw_data: responseData, // Include raw data for debugging
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
