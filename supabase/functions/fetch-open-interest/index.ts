import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate mock open interest data
function generateMockOpenInterest(symbol: string) {
  const totalOI = 8000000000 + Math.random() * 8000000000; // 8-16B
  const change24hValue = Math.random() * 10 - 5; // -5% to +5%
  const change24h = change24hValue.toFixed(2);
  const sentiment = change24hValue > 0 ? 'INCREASING' : 'DECREASING';

  const exchanges = [
    { exchange: 'Binance', percentage: 35 + Math.random() * 5 },
    { exchange: 'Bybit', percentage: 20 + Math.random() * 5 },
    { exchange: 'OKX', percentage: 15 + Math.random() * 5 },
    { exchange: 'Deribit', percentage: 12 + Math.random() * 3 },
    { exchange: 'Bitget', percentage: 10 + Math.random() * 3 },
  ];

  const normalized = exchanges.map(e => ({
    ...e,
    percentage: parseFloat((e.percentage / exchanges.reduce((sum, ex) => sum + ex.percentage, 0) * 100).toFixed(2))
  }));

  const byExchange = normalized.map(e => ({
    exchange: e.exchange,
    value: `${((totalOI * e.percentage) / 100 / 1000000000).toFixed(2)}B`,
    valueRaw: (totalOI * e.percentage) / 100,
    percentage: e.percentage
  }));

  const history = Array.from({ length: 24 }, (_, i) => {
    const timestamp = Date.now() - (23 - i) * 3600000;
    const variance = (Math.random() - 0.5) * 0.1;
    return {
      time: timestamp,
      value: totalOI * (1 + variance),
      change: (variance * 100).toFixed(2)
    };
  });

  return {
    total: {
      value: `${(totalOI / 1000000000).toFixed(2)}B`,
      valueRaw: totalOI,
      change24h: `${change24hValue > 0 ? '+' : ''}${change24h}%`,
      sentiment
    },
    byExchange,
    history,
    isMockData: true
  };
}

// Fetch real open interest from Coinglass
async function fetchOpenInterestFromCoinglass(symbol: string, apiKey: string) {
  try {
    const historyUrl = `https://open-api-v3.coinglass.com/api/openInterest/ohlc-history?symbol=${symbol}&interval=h1&limit=24`;
    const exchangeUrl = `https://open-api-v3.coinglass.com/api/openInterest/exchange-history?symbol=${symbol}&interval=0`;

    const [historyRes, exchangeRes] = await Promise.all([
      fetch(historyUrl, { headers: { 'coinglassSecret': apiKey } }),
      fetch(exchangeUrl, { headers: { 'coinglassSecret': apiKey } })
    ]);

    if (!historyRes.ok || !exchangeRes.ok) {
      throw new Error('Coinglass API error');
    }

    const historyData = await historyRes.json();
    const exchangeData = await exchangeRes.json();

    const latestOI = historyData.data[historyData.data.length - 1];
    const change24hValue = ((latestOI.close - historyData.data[0].open) / historyData.data[0].open * 100);
    const change24h = change24hValue.toFixed(2);

    return {
      total: {
        value: `${(latestOI.close / 1000000000).toFixed(2)}B`,
        valueRaw: latestOI.close,
        change24h: `${change24hValue > 0 ? '+' : ''}${change24h}%`,
        sentiment: change24hValue > 0 ? 'INCREASING' : 'DECREASING'
      },
      byExchange: exchangeData.data.map((ex: any) => ({
        exchange: ex.exchangeName,
        value: `${(ex.openInterest / 1000000000).toFixed(2)}B`,
        valueRaw: ex.openInterest,
        percentage: ex.percentage
      })),
      history: historyData.data,
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
    let result;

    if (!COINGLASS_API_KEY) {
      console.warn('⚠️ COINGLASS_API_KEY not set, using mock data');
      result = generateMockOpenInterest(symbol);
    } else {
      try {
        result = await fetchOpenInterestFromCoinglass(symbol, COINGLASS_API_KEY);
      } catch (error) {
        console.warn('⚠️ Coinglass fetch failed, falling back to mock data');
        result = generateMockOpenInterest(symbol);
      }
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
        error: error instanceof Error ? error.message : 'Unknown error',
        ...generateMockOpenInterest('BTC')
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
