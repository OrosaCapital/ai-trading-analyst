import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExchangePair {
  exchangeName: string;
  symbol: string;
  symbolLogo?: string;
}

interface CoinglassResponse {
  code: string;
  msg: string;
  data: ExchangePair[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('COINGLASS_API_KEY');
    if (!apiKey) {
      throw new Error('COINGLASS_API_KEY not configured');
    }

    console.log('Fetching exchange pairs from CoinGlass...');

    const response = await fetch('https://open-api-v4.coinglass.com/api/futures/supported-exchange-pairs', {
      headers: {
        'CG-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGlass API returned ${response.status}: ${response.statusText}`);
    }

    const data: CoinglassResponse = await response.json();

    if (data.code !== '0') {
      throw new Error(`CoinGlass API error: ${data.msg}`);
    }

    // Ensure data.data is an array
    if (!Array.isArray(data.data)) {
      console.warn('CoinGlass returned non-array data:', data.data);
      return new Response(
        JSON.stringify({
          success: true,
          pairs: [],
          totalPairs: 0,
          exchanges: [],
          exchangeCount: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Group by exchange and count pairs
    const exchangeStats = data.data.reduce((acc, pair) => {
      if (!acc[pair.exchangeName]) {
        acc[pair.exchangeName] = {
          name: pair.exchangeName,
          pairCount: 0,
          symbols: []
        };
      }
      acc[pair.exchangeName].pairCount++;
      acc[pair.exchangeName].symbols.push(pair.symbol);
      return acc;
    }, {} as Record<string, { name: string; pairCount: number; symbols: string[] }>);

    console.log(`Successfully fetched ${data.data.length} exchange pairs across ${Object.keys(exchangeStats).length} exchanges`);

    return new Response(
      JSON.stringify({
        success: true,
        pairs: data.data,
        totalPairs: data.data.length,
        exchanges: Object.values(exchangeStats),
        exchangeCount: Object.keys(exchangeStats).length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching CoinGlass exchange pairs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        pairs: [],
        exchanges: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
