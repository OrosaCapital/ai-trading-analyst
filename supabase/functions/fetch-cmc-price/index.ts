import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CMCQuoteResponse {
  data: {
    [key: string]: Array<{
      quote: {
        USD: {
          price: number;
        };
      };
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    // Validate input
    if (!symbol || typeof symbol !== 'string' || symbol.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid symbol' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const CMC_API_KEY = Deno.env.get('COINMARKETCAP_API_KEY');
    if (!CMC_API_KEY) {
      throw new Error('COINMARKETCAP_API_KEY not configured');
    }

    const cleanSymbol = symbol.replace('USDT', '').replace('USD', '');
    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(cleanSymbol)}&convert=USD`;

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      console.error('CMC API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch price from CoinMarketCap' }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: CMCQuoteResponse = await response.json();
    const price = data.data[cleanSymbol]?.[0]?.quote.USD.price;
    
    if (!price) {
      return new Response(
        JSON.stringify({ error: 'Price not found in response' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ price }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-cmc-price:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
