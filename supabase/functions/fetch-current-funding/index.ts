import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateSymbol } from '../_shared/symbolFormatter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FundingRateData {
  symbol: string;
  rate: string;
  time: number;
}

interface CoinglassResponse {
  code: string;
  msg: string;
  data: FundingRateData[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, exchange = 'Binance' } = await req.json();
    
    // Validate symbol
    const validation = validateSymbol(symbol);
    if (!validation.valid) {
      throw new Error(`Invalid symbol: ${validation.error}`);
    }

    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    if (!apiKey) {
      throw new Error('COINGLASS_API_KEY not configured');
    }

    console.log(`Fetching current funding rate for ${symbol} on ${exchange}...`);

    const url = new URL('https://open-api-v4.coinglass.com/api/futures/funding-rate/current');
    url.searchParams.append('symbol', symbol);

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

    // Find the funding rate for the specified exchange
    const exchangeData = data.data.find(item => 
      item.symbol.toLowerCase().includes(exchange.toLowerCase())
    ) || data.data[0]; // Fallback to first exchange if not found

    const rate = parseFloat(exchangeData.rate);

    console.log(`Current funding rate for ${symbol}: ${rate}%`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        exchange: exchangeData.symbol,
        rate,
        timestamp: exchangeData.time,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching current funding rate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        rate: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
