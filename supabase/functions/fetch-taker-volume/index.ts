import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateMockTakerVolume(symbol: string) {
  const intervals = ['5m', '15m', '1h', '4h'];
  const cvdData: any = {};
  
  intervals.forEach(interval => {
    const baseValue = Math.random() * 1000000;
    const trend = Math.random() > 0.5 ? 1 : -1;
    
    cvdData[interval] = {
      current_cvd: (baseValue * trend).toFixed(2),
      buy_volume: (Math.abs(baseValue) + Math.random() * 500000).toFixed(2),
      sell_volume: (Math.abs(baseValue) + Math.random() * 500000).toFixed(2),
      delta: (Math.random() * 200000 * trend).toFixed(2),
      trend: trend > 0 ? 'BULLISH' : 'BEARISH',
    };
  });

  return {
    symbol,
    timestamp: new Date().toISOString(),
    cvd: cvdData,
    summary: {
      dominant_trend: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
      strength: (50 + Math.random() * 50).toFixed(0),
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'NEUTRAL' : 'SELL',
    },
    historical: Array.from({ length: 48 }, (_, i) => ({
      timestamp: new Date(Date.now() - (47 - i) * 1800000).toISOString(),
      cvd: (Math.random() * 1000000 * (Math.random() > 0.5 ? 1 : -1)).toFixed(2),
      buy_volume: (Math.random() * 500000).toFixed(2),
      sell_volume: (Math.random() * 500000).toFixed(2),
    })),
    mock: true,
  };
}

async function fetchTakerVolumeFromCoinglass(symbol: string, apiKey: string) {
  console.log(`Fetching taker volume (CVD) from Coinglass for ${symbol}`);
  
  try {
    const response = await fetch(
      `https://open-api.coinglass.com/public/v2/indicator/taker_buy_sell_volume?symbol=${symbol}&interval=h1`,
      {
        headers: {
          'CG-API-KEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Coinglass API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Coinglass taker volume data received');

    const intervals = ['5m', '15m', '1h', '4h'];
    const cvdData: any = {};
    
    intervals.forEach(interval => {
      const intervalData = data.data.filter((item: any) => item.interval === interval);
      if (intervalData.length > 0) {
        const latest = intervalData[0];
        const buyVol = parseFloat(latest.buyVolume);
        const sellVol = parseFloat(latest.sellVolume);
        const delta = buyVol - sellVol;
        const cvd = intervalData.reduce((sum: number, item: any) => 
          sum + (parseFloat(item.buyVolume) - parseFloat(item.sellVolume)), 0
        );

        cvdData[interval] = {
          current_cvd: cvd.toFixed(2),
          buy_volume: buyVol.toFixed(2),
          sell_volume: sellVol.toFixed(2),
          delta: delta.toFixed(2),
          trend: delta > 0 ? 'BULLISH' : 'BEARISH',
        };
      }
    });

    const allDeltas = Object.values(cvdData).map((d: any) => parseFloat(d.delta));
    const avgDelta = allDeltas.reduce((a, b) => a + b, 0) / allDeltas.length;

    return {
      symbol,
      timestamp: new Date().toISOString(),
      cvd: cvdData,
      summary: {
        dominant_trend: avgDelta > 0 ? 'BULLISH' : 'BEARISH',
        strength: Math.min(100, Math.abs(avgDelta / 10000)).toFixed(0),
        signal: avgDelta > 50000 ? 'BUY' : avgDelta < -50000 ? 'SELL' : 'NEUTRAL',
      },
      historical: data.data.slice(0, 48).map((item: any) => ({
        timestamp: new Date(item.createTime).toISOString(),
        cvd: (parseFloat(item.buyVolume) - parseFloat(item.sellVolume)).toFixed(2),
        buy_volume: item.buyVolume,
        sell_volume: item.sellVolume,
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

    // Try to fetch real data
    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    let volumeData;

    if (apiKey) {
      try {
        volumeData = await fetchTakerVolumeFromCoinglass(symbol, apiKey);
      } catch (error) {
        console.error('Coinglass fetch failed, using mock data:', error);
        volumeData = generateMockTakerVolume(symbol);
      }
    } else {
      console.log('No API key, using mock data');
      volumeData = generateMockTakerVolume(symbol);
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
