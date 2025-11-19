import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoinglassResponse {
  code: string;
  msg: string;
  data: string[];
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

    console.log('Fetching supported coins from CoinGlass...');

    const response = await fetch('https://open-api-v4.coinglass.com/api/futures/supported-coins', {
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

    console.log(`Successfully fetched ${data.data.length} supported coins`);

    return new Response(
      JSON.stringify({
        success: true,
        coins: data.data,
        count: data.data.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching CoinGlass coins:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        coins: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
