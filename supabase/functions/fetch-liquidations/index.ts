import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate mock liquidation data
function generateMockLiquidations(symbol: string) {
  const totalLongs = 80000000 + Math.random() * 80000000; // 80-160M
  const totalShorts = 50000000 + Math.random() * 50000000; // 50-100M
  const total = totalLongs + totalShorts;
  const longRatio = (totalLongs / total * 100).toFixed(1);

  const recentLiquidations = Array.from({ length: 24 }, (_, i) => {
    const timestamp = Date.now() - (23 - i) * 3600000;
    return {
      time: timestamp,
      longLiq: Math.random() * 5000000,
      shortLiq: Math.random() * 5000000,
    };
  });

  const majorEvents = [
    {
      time: new Date(Date.now() - 3 * 3600000).toISOString(),
      amount: `${(Math.random() * 40 + 20).toFixed(1)}M`,
      type: 'LONG',
      price: 42000 + Math.random() * 2000
    },
    {
      time: new Date(Date.now() - 8 * 3600000).toISOString(),
      amount: `${(Math.random() * 30 + 15).toFixed(1)}M`,
      type: 'SHORT',
      price: 41500 + Math.random() * 2000
    }
  ];

  const heatmap = {
    levels: [
      { price: 42000, liquidity: `${(Math.random() * 100 + 50).toFixed(0)}M`, type: 'LONG' },
      { price: 42500, liquidity: `${(Math.random() * 80 + 40).toFixed(0)}M`, type: 'LONG' },
      { price: 43000, liquidity: `${(Math.random() * 120 + 60).toFixed(0)}M`, type: 'SHORT' },
      { price: 43500, liquidity: `${(Math.random() * 90 + 45).toFixed(0)}M`, type: 'SHORT' },
    ]
  };

  return {
    last24h: {
      totalLongs: `${(totalLongs / 1000000).toFixed(1)}M`,
      totalShorts: `${(totalShorts / 1000000).toFixed(1)}M`,
      total: `${(total / 1000000).toFixed(1)}M`,
      ratio: `${longRatio}% longs`,
      longShortRatio: (totalLongs / totalShorts).toFixed(2),
      majorEvents
    },
    recentLiquidations,
    heatmap,
    isMockData: true
  };
}

// Fetch real liquidation data from Coinglass
async function fetchLiquidationsFromCoinglass(symbol: string, apiKey: string) {
  try {
    const url = `https://open-api-v3.coinglass.com/api/futures/liquidation/history?symbol=${symbol}&interval=h1&limit=24`;
    
    const response = await fetch(url, {
      headers: {
        'coinglassSecret': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Coinglass API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Invalid Coinglass response');
    }

    const totalLongs = data.data.reduce((sum: number, item: any) => sum + item.longLiquidation, 0);
    const totalShorts = data.data.reduce((sum: number, item: any) => sum + item.shortLiquidation, 0);
    const total = totalLongs + totalShorts;
    const longRatio = (totalLongs / total * 100).toFixed(1);

    // Find major liquidation events (> 20M)
    const majorEvents = data.data
      .filter((item: any) => item.longLiquidation > 20000000 || item.shortLiquidation > 20000000)
      .map((item: any) => ({
        time: new Date(item.time).toISOString(),
        amount: item.longLiquidation > item.shortLiquidation 
          ? `${(item.longLiquidation / 1000000).toFixed(1)}M`
          : `${(item.shortLiquidation / 1000000).toFixed(1)}M`,
        type: item.longLiquidation > item.shortLiquidation ? 'LONG' : 'SHORT',
        price: item.price
      }))
      .slice(0, 5);

    return {
      last24h: {
        totalLongs: `${(totalLongs / 1000000).toFixed(1)}M`,
        totalShorts: `${(totalShorts / 1000000).toFixed(1)}M`,
        total: `${(total / 1000000).toFixed(1)}M`,
        ratio: `${longRatio}% longs`,
        longShortRatio: (totalLongs / totalShorts).toFixed(2),
        majorEvents
      },
      recentLiquidations: data.data.map((item: any) => ({
        time: item.time,
        longLiq: item.longLiquidation,
        shortLiq: item.shortLiquidation,
      })),
      heatmap: data.heatmap || { levels: [] },
      isMockData: false
    };
  } catch (error) {
    console.error('Coinglass liquidations fetch error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTC' } = await req.json();
    console.log(`⚡ Liquidations request for ${symbol}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('data_type', 'liquidations')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log('✅ Cache hit for liquidations');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('❌ Cache miss, fetching liquidations data');

    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
    let result;

    if (!COINGLASS_API_KEY) {
      console.warn('⚠️ COINGLASS_API_KEY not set, using mock data');
      result = generateMockLiquidations(symbol);
    } else {
      try {
        result = await fetchLiquidationsFromCoinglass(symbol, COINGLASS_API_KEY);
      } catch (error) {
        console.warn('⚠️ Coinglass fetch failed, falling back to mock data');
        result = generateMockLiquidations(symbol);
      }
    }

    // Cache the result
    await supabase.from('market_data_cache').insert({
      data_type: 'liquidations',
      symbol,
      data: result,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in fetch-liquidations:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...generateMockLiquidations('BTC')
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
