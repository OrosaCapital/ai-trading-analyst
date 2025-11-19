import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FundingRateCandle {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
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
    const { symbol, exchange = 'Binance', interval = '8h', limit = 100 } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    // Format symbol for CoinGlass (they expect BTCUSDT format, not BTC)
    const formattedSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    if (!apiKey) {
      throw new Error('COINGLASS_API_KEY not configured');
    }

    console.log(`Fetching funding rate history for ${formattedSymbol} on ${exchange} with interval ${interval}...`);

    const url = new URL('https://open-api-v4.coinglass.com/api/futures/funding-rate/history');
    url.searchParams.append('exchange', exchange);
    url.searchParams.append('symbol', formattedSymbol);
    url.searchParams.append('interval', interval);
    url.searchParams.append('limit', limit.toString());

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

    // Convert string values to numbers and calculate stats
    const numericCandles = data.data.map(candle => ({
      time: candle.time,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
    }));

    // Calculate average funding rate
    const avgFunding = numericCandles.length > 0
      ? numericCandles.reduce((sum, candle) => sum + candle.close, 0) / numericCandles.length
      : 0;

    // Find min and max
    const rates = numericCandles.map(c => c.close);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    console.log(`Successfully fetched ${numericCandles.length} funding rate candles. Avg: ${avgFunding.toFixed(4)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        exchange,
        interval,
        candles: numericCandles,
        stats: {
          count: numericCandles.length,
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
