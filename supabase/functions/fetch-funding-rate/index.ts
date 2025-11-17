import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate cache key
function getCacheKey(symbol: string, interval: string): string {
  return `funding_rate_${symbol}_${interval}`;
}

// Generate mock funding rate data
function generateMockFundingRate(symbol: string) {
  const baseRate = Math.random() * 0.01 - 0.005; // -0.5% to +0.5%
  const sentiment = baseRate > 0 ? 'BULLISH' : baseRate < -0.002 ? 'BEARISH' : 'NEUTRAL';
  
  const history = Array.from({ length: 24 }, (_, i) => {
    const timestamp = Date.now() - (23 - i) * 3600000;
    const rate = baseRate + (Math.random() * 0.004 - 0.002);
    return {
      time: timestamp,
      rate: rate,
      open: rate - 0.0005,
      high: rate + 0.001,
      low: rate - 0.001,
      close: rate
    };
  });

  return {
    current: {
      rate: `${(baseRate * 100).toFixed(4)}%`,
      rateValue: baseRate,
      nextFunding: new Date(Date.now() + 8 * 3600000).toISOString(),
      sentiment
    },
    history,
    isMockData: true
  };
}

// Fetch real funding rate from Coinglass
async function fetchFundingRateFromCoinglass(symbol: string, interval: string, apiKey: string) {
  try {
    const url = `https://open-api-v3.coinglass.com/api/fundingRate/ohlc-history?symbol=${symbol}&interval=${interval}&limit=24`;
    
    const response = await fetch(url, {
      headers: {
        'coinglassSecret': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('⚠️ Coinglass rate limit exceeded');
        throw new Error('RATE_LIMIT');
      }
      throw new Error(`Coinglass API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('Invalid Coinglass response');
    }

    const currentRate = data.data[data.data.length - 1]?.rate || 0;
    const sentiment = currentRate > 0.0001 ? 'BULLISH' : currentRate < -0.0001 ? 'BEARISH' : 'NEUTRAL';

    return {
      current: {
        rate: `${(currentRate * 100).toFixed(4)}%`,
        rateValue: currentRate,
        nextFunding: data.nextFundingTime || new Date(Date.now() + 8 * 3600000).toISOString(),
        sentiment
      },
      history: data.data,
      isMockData: false
    };
  } catch (error) {
    console.error('Coinglass API error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTC', interval = 'h1' } = await req.json();
    console.log(`📊 Funding rate request for ${symbol} (${interval})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const cacheKey = getCacheKey(symbol, interval);
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('data_type', 'funding_rate')
      .eq('symbol', symbol)
      .eq('interval', interval)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log('✅ Cache hit for funding rate');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('❌ Cache miss, fetching funding rate data');

    // Try to fetch from Coinglass if API key exists
    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
    let result;

    if (!COINGLASS_API_KEY) {
      console.warn('⚠️ COINGLASS_API_KEY not set, using mock data');
      console.log('💡 Add your API key via Lovable secrets to get real-time data');
      result = generateMockFundingRate(symbol);
    } else {
      try {
        result = await fetchFundingRateFromCoinglass(symbol, interval, COINGLASS_API_KEY);
      } catch (error) {
        console.warn('⚠️ Coinglass fetch failed, falling back to mock data:', error);
        result = generateMockFundingRate(symbol);
      }
    }

    // Cache the result
    await supabase.from('market_data_cache').insert({
      data_type: 'funding_rate',
      symbol,
      interval,
      data: result,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in fetch-funding-rate:', error);
    const mockData = generateMockFundingRate('BTC');
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...mockData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
