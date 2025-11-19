import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FundingRateCandle {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

interface CoinglassResponse {
  code: string;
  msg: string;
  data: FundingRateCandle[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval = '8h' } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    if (!apiKey) {
      throw new Error('COINGLASS_API_KEY not configured');
    }

    console.log(`Fetching funding rate history for ${symbol} with interval ${interval}...`);

    const url = new URL('https://open-api-v4.coinglass.com/api/futures/funding-rate/history');
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('interval', interval);

    const response = await fetch(url.toString(), {
      headers: {
        'CG-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGlass API returned ${response.status}: ${response.statusText}`);
    }

    const data: CoinglassResponse = await response.json();

    if (data.code !== '0' || !data.data) {
      throw new Error(`CoinGlass API error: ${data.msg}`);
    }

    // Calculate average funding rate
    const avgFunding = data.data.length > 0
      ? data.data.reduce((sum, candle) => sum + candle.c, 0) / data.data.length
      : 0;

    // Find min and max
    const rates = data.data.map(c => c.c);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    console.log(`Successfully fetched ${data.data.length} funding rate candles. Avg: ${avgFunding.toFixed(4)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        interval,
        candles: data.data,
        stats: {
          count: data.data.length,
          average: avgFunding,
          min: minRate,
          max: maxRate,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching funding rate history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        candles: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
