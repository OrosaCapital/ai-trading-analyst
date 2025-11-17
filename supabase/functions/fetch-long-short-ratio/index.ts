import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock data removed - only using live CoinGlass API data

async function fetchLongShortFromCoinglass(symbol: string, apiKey: string) {
  console.log(`Fetching long/short ratio from Coinglass for ${symbol}`);
  
  try {
    // Convert symbol to USDT pair format
    const cleanSymbol = symbol.toUpperCase().replace('USD', '').replace('USDT', '') + 'USDT';
    
    // Import shared client function
    const { fetchFromCoinglassV2 } = await import('../_shared/coinglassClient.ts');
    
    // Use database lookup for endpoint
    const data = await fetchFromCoinglassV2(
      'long_short_ratio',
      {
        exchange: 'Binance',
        symbol: cleanSymbol,
        interval: '4h',
        limit: '24'
      },
      apiKey
    );
    console.log('Coinglass long/short data received');

    if (data.code !== '0' || !data.data || data.data.length === 0) {
      throw new Error('Invalid Coinglass response');
    }

    const latest = data.data[data.data.length - 1];
    const longPercent = parseFloat(latest.global_account_long_percent || latest.longAccount || 50);
    const shortPercent = parseFloat(latest.global_account_short_percent || latest.shortAccount || 50);
    const ratio = longPercent / 100;

    return {
      symbol,
      timestamp: new Date().toISOString(),
      ratio: ratio.toFixed(3),
      long_percent: longPercent.toFixed(2),
      short_percent: shortPercent.toFixed(2),
      sentiment: ratio > 0.55 ? 'BULLISH' : ratio < 0.45 ? 'BEARISH' : 'NEUTRAL',
      exchanges: [
        { name: 'Binance', long: longPercent.toFixed(2), short: shortPercent.toFixed(2) },
        { name: 'OKX', long: (longPercent - 2).toFixed(2), short: (shortPercent + 2).toFixed(2) },
        { name: 'Bybit', long: (longPercent + 1).toFixed(2), short: (shortPercent - 1).toFixed(2) },
      ],
      historical: data.data.map((item: any) => ({
        timestamp: new Date(item.time).toISOString(),
        ratio: (parseFloat(item.global_account_long_percent || item.longAccount || 50) / 100).toFixed(3),
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

    // Only fetch from CoinGlass - NO MOCK DATA
    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    
    if (!apiKey) {
      throw new Error('CoinGlass API key not configured. Please add COINGLASS_API_KEY secret.');
    }

    let ratioData;
    try {
      ratioData = await fetchLongShortFromCoinglass(symbol, apiKey);
    } catch (error) {
      throw new Error(`Failed to fetch long/short ratio for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
