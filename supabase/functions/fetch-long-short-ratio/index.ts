import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateMockLongShortRatio(symbol: string) {
  const ratio = 0.45 + Math.random() * 0.15; // 0.45-0.60 (bearish to neutral)
  const longPercent = ratio * 100;
  const shortPercent = (1 - ratio) * 100;
  
  return {
    symbol,
    timestamp: new Date().toISOString(),
    ratio: ratio.toFixed(3),
    long_percent: longPercent.toFixed(2),
    short_percent: shortPercent.toFixed(2),
    sentiment: ratio > 0.55 ? 'BULLISH' : ratio < 0.45 ? 'BEARISH' : 'NEUTRAL',
    exchanges: [
      { name: 'Binance', long: (longPercent + Math.random() * 5).toFixed(2), short: (shortPercent - Math.random() * 5).toFixed(2) },
      { name: 'OKX', long: (longPercent - Math.random() * 3).toFixed(2), short: (shortPercent + Math.random() * 3).toFixed(2) },
      { name: 'Bybit', long: (longPercent + Math.random() * 2).toFixed(2), short: (shortPercent - Math.random() * 2).toFixed(2) },
    ],
    historical: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      ratio: (0.45 + Math.random() * 0.15).toFixed(3),
    })),
    mock: true,
  };
}

async function fetchLongShortFromCoinglass(symbol: string, apiKey: string) {
  console.log(`Fetching long/short ratio from Coinglass for ${symbol}`);
  
  try {
    const response = await fetch(
      `https://open-api.coinglass.com/public/v2/indicator/long_short_ratio?symbol=${symbol}&interval=h1`,
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
    console.log('Coinglass long/short data received');

    const latest = data.data[0];
    const longPercent = parseFloat(latest.longRate) * 100;
    const shortPercent = parseFloat(latest.shortRate) * 100;
    const ratio = parseFloat(latest.longRate);

    return {
      symbol,
      timestamp: new Date().toISOString(),
      ratio: ratio.toFixed(3),
      long_percent: longPercent.toFixed(2),
      short_percent: shortPercent.toFixed(2),
      sentiment: ratio > 0.55 ? 'BULLISH' : ratio < 0.45 ? 'BEARISH' : 'NEUTRAL',
      exchanges: data.data.slice(0, 3).map((item: any) => ({
        name: item.exchangeName,
        long: (parseFloat(item.longRate) * 100).toFixed(2),
        short: (parseFloat(item.shortRate) * 100).toFixed(2),
      })),
      historical: data.data.map((item: any) => ({
        timestamp: new Date(item.createTime).toISOString(),
        ratio: parseFloat(item.longRate).toFixed(3),
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
    console.log('Fetching long/short ratio for symbol:', symbol);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('symbol', symbol)
      .eq('data_type', 'long_short_ratio')
      .single();

    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      console.log('Returning cached long/short ratio data');
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to fetch real data
    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    let ratioData;

    if (apiKey) {
      try {
        ratioData = await fetchLongShortFromCoinglass(symbol, apiKey);
      } catch (error) {
        console.error('Coinglass fetch failed, using mock data:', error);
        ratioData = generateMockLongShortRatio(symbol);
      }
    } else {
      console.log('No API key, using mock data');
      ratioData = generateMockLongShortRatio(symbol);
    }

    // Cache the result
    await supabase.from('market_data_cache').upsert({
      symbol,
      data_type: 'long_short_ratio',
      data: ratioData,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(ratioData), {
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
