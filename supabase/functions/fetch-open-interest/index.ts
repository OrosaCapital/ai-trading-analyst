import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock data removed - only using live CoinGlass API data

// Fetch real open interest from Coinglass
async function fetchOpenInterestFromCoinglass(symbol: string, apiKey: string) {
  try {
    // Convert symbol to USDT pair format
    const cleanSymbol = symbol.toUpperCase().replace('USD', '').replace('USDT', '') + 'USDT';
    
    // CoinGlass API v4 endpoints
    const historyUrl = `https://open-api-v4.coinglass.com/api/futures/open-interest-ohlc/history?exchange=Binance&symbol=${cleanSymbol}&interval=1h&limit=24`;
    const exchangeUrl = `https://open-api-v4.coinglass.com/api/futures/open-interest/list?symbol=${cleanSymbol.replace('USDT', '')}`;

    const [historyRes, exchangeRes] = await Promise.all([
      fetch(historyUrl, { headers: { 'accept': 'application/json', 'CG-API-KEY': apiKey } }),
      fetch(exchangeUrl, { headers: { 'accept': 'application/json', 'CG-API-KEY': apiKey } })
    ]);

    if (!historyRes.ok || !exchangeRes.ok) {
      const historyError = await historyRes.text();
      const exchangeError = await exchangeRes.text();
      console.error('Coinglass API errors:', { historyError, exchangeError });
      throw new Error('Coinglass API error');
    }

    const historyData = await historyRes.json();
    const exchangeData = await exchangeRes.json();

    if (historyData.code !== '0' || !historyData.data || historyData.data.length === 0) {
      throw new Error('Invalid history data from Coinglass');
    }

    const latestOI = historyData.data[historyData.data.length - 1];
    const firstOI = historyData.data[0];
    const change24hValue = ((parseFloat(latestOI.close) - parseFloat(firstOI.open)) / parseFloat(firstOI.open) * 100);
    const change24h = change24hValue.toFixed(2);

    const byExchange = exchangeData.code === '0' && exchangeData.data ? 
      exchangeData.data.map((ex: any) => ({
        exchange: ex.exchange || ex.exchangeName || 'Unknown',
        value: `${(parseFloat(ex.open_interest || ex.openInterest) / 1000000000).toFixed(2)}B`,
        valueRaw: parseFloat(ex.open_interest || ex.openInterest),
        percentage: ex.percentage || ((parseFloat(ex.open_interest || ex.openInterest) / parseFloat(latestOI.close)) * 100).toFixed(2)
      })) : [];

    return {
      total: {
        value: `${(parseFloat(latestOI.close) / 1000000000).toFixed(2)}B`,
        valueRaw: parseFloat(latestOI.close),
        change24h: `${change24hValue > 0 ? '+' : ''}${change24h}%`,
        sentiment: change24hValue > 0 ? 'INCREASING' : 'DECREASING'
      },
      byExchange,
      history: historyData.data.map((item: any) => ({
        time: item.time,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close)
      })),
      isMockData: false
    };
  } catch (error) {
    console.error('Coinglass OI fetch error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTC' } = await req.json();
    console.log(`📈 Open interest request for ${symbol}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('data_type', 'open_interest')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log('✅ Cache hit for open interest');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('❌ Cache miss, fetching open interest data');

    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
    
    if (!COINGLASS_API_KEY) {
      throw new Error('CoinGlass API key not configured. Please add COINGLASS_API_KEY secret.');
    }

    let result;
    try {
      result = await fetchOpenInterestFromCoinglass(symbol, COINGLASS_API_KEY);
    } catch (error) {
      throw new Error(`Failed to fetch open interest for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cache the result
    await supabase.from('market_data_cache').insert({
      data_type: 'open_interest',
      symbol,
      data: result,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in fetch-open-interest:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch open interest data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
