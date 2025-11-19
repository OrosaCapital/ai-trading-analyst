import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    const apiKey = Deno.env.get('COINGLASS_API_KEY');

    if (!apiKey) {
      throw new Error('COINGLASS_API_KEY not configured');
    }

    console.log(`[CoinGlass] Fetching long/short ratio for ${symbol}`);

    const response = await fetch(
      `https://open-api-v3.coinglass.com/api/futures/long-short-accounts?symbol=${symbol}&interval=1h`,
      {
        headers: {
          'accept': 'application/json',
          'CG-API-KEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[CoinGlass] API error: ${response.status}`);
      return new Response(
        JSON.stringify({ long_percent: '50', short_percent: '50', timestamp: Date.now() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`[CoinGlass] Long/short ratio fetched successfully`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CoinGlass] Error in fetch-long-short-ratio:', error);
    return new Response(
      JSON.stringify({ long_percent: '50', short_percent: '50', timestamp: Date.now() }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
