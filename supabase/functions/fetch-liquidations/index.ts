import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock data removed - only using live CoinGlass API data

// Fetch real liquidation data from Coinglass
async function fetchLiquidationsFromCoinglass(symbol: string, apiKey: string) {
  try {
    // Convert symbol to USDT pair format
    // Fix: Replace USDT first, then USD to avoid corrupting symbols
    const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '') + 'USDT';
    
    // Import shared client function
    const { fetchFromCoinglassV2 } = await import('../_shared/coinglassClient.ts');
    
    // Use database lookup for endpoint
    const data = await fetchFromCoinglassV2(
      'liquidations',
      {
        exchange: 'Binance',
        symbol: cleanSymbol,
        interval: '4h',
        limit: '24'
      },
      apiKey
    );

    if (data.code !== '0' || !data.data || data.data.length === 0) {
      console.error('Invalid Coinglass response:', data);
      throw new Error('Invalid Coinglass response');
    }

    const totalLongs = data.data.reduce((sum: number, item: any) => 
      sum + parseFloat(item.long_liquidation_usd || item.longLiquidation || 0), 0);
    const totalShorts = data.data.reduce((sum: number, item: any) => 
      sum + parseFloat(item.short_liquidation_usd || item.shortLiquidation || 0), 0);
    const total = totalLongs + totalShorts;
    const longRatio = (totalLongs / total * 100).toFixed(1);

    // Find major liquidation events (> 20M)
    const majorEvents = data.data
      .filter((item: any) => {
        const longLiq = parseFloat(item.long_liquidation_usd || item.longLiquidation || 0);
        const shortLiq = parseFloat(item.short_liquidation_usd || item.shortLiquidation || 0);
        return longLiq > 20000000 || shortLiq > 20000000;
      })
      .map((item: any) => {
        const longLiq = parseFloat(item.long_liquidation_usd || item.longLiquidation || 0);
        const shortLiq = parseFloat(item.short_liquidation_usd || item.shortLiquidation || 0);
        return {
          time: new Date(item.time).toISOString(),
          amount: longLiq > shortLiq 
            ? `${(longLiq / 1000000).toFixed(1)}M`
            : `${(shortLiq / 1000000).toFixed(1)}M`,
          type: longLiq > shortLiq ? 'LONG' : 'SHORT',
          price: item.price || 0
        };
      })
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
        longLiq: parseFloat(item.long_liquidation_usd || item.longLiquidation || 0),
        shortLiq: parseFloat(item.short_liquidation_usd || item.shortLiquidation || 0),
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
    
    if (!COINGLASS_API_KEY) {
      throw new Error('CoinGlass API key not configured. Please add COINGLASS_API_KEY secret.');
    }

    let result;
    try {
      result = await fetchLiquidationsFromCoinglass(symbol, COINGLASS_API_KEY);
    } catch (error) {
      // If symbol not available on Coinglass, return graceful fallback
      console.log(`Symbol ${symbol} not available for liquidations data`);
      const fallbackData = {
        last24h: {
          totalLongs: 'N/A',
          totalShorts: 'N/A',
          total: 'N/A',
          ratio: 'N/A',
          longShortRatio: 'N/A',
          majorEvents: []
        },
        recentLiquidations: [],
        heatmap: { levels: [] },
        isMockData: false,
        unavailable: true,
        message: 'Derivatives data not available for this symbol'
      };

      // Cache the result
      await supabase.from('market_data_cache').insert({
        data_type: 'liquidations',
        symbol,
        interval: null,
        data: fallbackData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify(fallbackData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
        error: error instanceof Error ? error.message : 'Failed to fetch liquidations data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
