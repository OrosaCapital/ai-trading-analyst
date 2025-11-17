import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate market health score from metrics
function calculateMarketHealth(fundingRate: number, oiChange: number, liqRatio: number) {
  let score = 50; // Base score
  let signals: string[] = [];
  
  // Funding rate analysis (max +/-15 points)
  if (fundingRate > 0.0003) {
    score += 10;
    signals.push('Positive funding rate indicates strong bullish sentiment');
  } else if (fundingRate < -0.0003) {
    score -= 10;
    signals.push('Negative funding rate indicates bearish sentiment');
  } else {
    score += 5;
    signals.push('Neutral funding rate suggests balanced market');
  }
  
  // OI change analysis (max +/-20 points)
  if (oiChange > 5) {
    score -= 15;
    signals.push('Rapidly increasing OI suggests overleveraged positions - caution advised');
  } else if (oiChange > 2) {
    score += 5;
    signals.push('Rising OI indicates growing market interest');
  } else if (oiChange < -5) {
    score += 10;
    signals.push('Declining OI suggests deleveraging - potentially healthier market');
  }
  
  // Liquidation ratio analysis (max +/-15 points)
  if (liqRatio > 2) {
    score -= 10;
    signals.push('High long liquidations may signal local top or capitulation');
  } else if (liqRatio < 0.5) {
    score -= 10;
    signals.push('High short liquidations may indicate strong uptrend continuation');
  } else {
    score += 10;
    signals.push('Balanced liquidations indicate stable market conditions');
  }
  
  // Cap score between 0-100
  score = Math.max(0, Math.min(100, score));
  
  let status: 'HEALTHY' | 'CAUTIOUS' | 'VOLATILE' | 'DANGEROUS';
  if (score >= 70) status = 'HEALTHY';
  else if (score >= 50) status = 'CAUTIOUS';
  else if (score >= 30) status = 'VOLATILE';
  else status = 'DANGEROUS';
  
  return { score, status, signals };
}

// Generate mock market overview
function generateMockOverview(symbol: string) {
  const fundingRate = (Math.random() * 0.01 - 0.005);
  const fundingTrend = fundingRate > 0 ? 'RISING' : 'FALLING';
  const oiChange = (Math.random() * 10 - 5);
  const oiTrend = oiChange > 0 ? 'INCREASING' : 'DECREASING';
  const liqRatio = 0.5 + Math.random() * 2;
  
  const health = calculateMarketHealth(fundingRate, oiChange, liqRatio);
  
  return {
    marketHealth: health,
    metrics: {
      fundingRate: {
        current: `${(fundingRate * 100).toFixed(4)}%`,
        value: fundingRate,
        trend: fundingTrend
      },
      openInterest: {
        total: `${(8 + Math.random() * 8).toFixed(2)}B`,
        change24h: `${oiChange > 0 ? '+' : ''}${oiChange.toFixed(2)}%`,
        trend: oiTrend
      },
      liquidations24h: {
        total: `${(150 + Math.random() * 150).toFixed(1)}M`,
        longShortRatio: liqRatio.toFixed(2)
      }
    },
    timestamp: new Date().toISOString(),
    isMockData: true
  };
}

// Aggregate data from other endpoints
async function fetchMarketOverview(symbol: string, supabase: any) {
  try {
    // Fetch from cache or invoke other functions
    const [fundingRes, oiRes, liqRes] = await Promise.all([
      supabase.functions.invoke('fetch-funding-rate', { body: { symbol } }),
      supabase.functions.invoke('fetch-open-interest', { body: { symbol } }),
      supabase.functions.invoke('fetch-liquidations', { body: { symbol } })
    ]);

    const funding = fundingRes.data;
    const oi = oiRes.data;
    const liq = liqRes.data;

    if (!funding || !oi || !liq) {
      throw new Error('Failed to fetch market data');
    }

    const fundingRate = funding.current.rateValue;
    const oiChange = parseFloat(oi.total.change24h);
    const liqRatio = parseFloat(liq.last24h.longShortRatio);

    const health = calculateMarketHealth(fundingRate, oiChange, liqRatio);

    return {
      marketHealth: health,
      metrics: {
        fundingRate: {
          current: funding.current.rate,
          value: fundingRate,
          trend: funding.current.sentiment === 'BULLISH' ? 'RISING' : 'FALLING'
        },
        openInterest: {
          total: oi.total.value,
          change24h: oi.total.change24h,
          trend: oi.total.sentiment
        },
        liquidations24h: {
          total: liq.last24h.total,
          longShortRatio: liq.last24h.longShortRatio
        }
      },
      timestamp: new Date().toISOString(),
      isMockData: funding.isMockData || oi.isMockData || liq.isMockData
    };
  } catch (error) {
    console.error('Error aggregating market data:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTC' } = await req.json();
    console.log(`🌐 Market overview request for ${symbol}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('data_type', 'overview')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log('✅ Cache hit for market overview');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('❌ Cache miss, fetching market overview');

    let result;
    
    try {
      result = await fetchMarketOverview(symbol, supabase);
    } catch (error) {
      console.warn('⚠️ Failed to fetch market data, using mock overview');
      result = generateMockOverview(symbol);
    }

    // Cache the result
    await supabase.from('market_data_cache').insert({
      data_type: 'overview',
      symbol,
      data: result,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in fetch-market-overview:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...generateMockOverview('BTC')
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
