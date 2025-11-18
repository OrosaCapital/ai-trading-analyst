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
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const apiKey = Deno.env.get('TATUM_API_KEY');
    if (!apiKey) {
      throw new Error('TATUM_API_KEY not configured');
    }

    // Extract base symbol (BTC from BTCUSD, ETH from ETHUSD, etc.)
    const baseSymbol = symbol.replace(/USD$|USDT$/, '');
    
    console.log(`Fetching Tatum price for ${baseSymbol}/USD`);

    const response = await fetch(
      `https://api.tatum.io/v4/data/rate/symbol?symbol=${baseSymbol}&basePair=USD`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tatum API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          unavailable: true, 
          reason: 'TATUM_API_ERROR',
          message: `Tatum API returned ${response.status}`
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    console.log('Tatum API response:', JSON.stringify(data));
    
    const priceData = {
      symbol: symbol,
      price: parseFloat(data.value), // Tatum v4 uses 'value' not 'rate'
      timestamp: Date.now(),
      source: 'tatum',
      high24h: 0,
      low24h: 0,
      change24h: 0,
      volume: 0
    };

    console.log(`✅ Tatum price for ${symbol}: $${priceData.price}`);

    return new Response(
      JSON.stringify(priceData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-tatum-price:', error);
    
    return new Response(
      JSON.stringify({ 
        unavailable: true,
        reason: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
