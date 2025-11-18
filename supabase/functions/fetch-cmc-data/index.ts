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
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching CMC data for ${symbol}`);

    const CMC_API_KEY = Deno.env.get('CMC_API_KEY');
    if (!CMC_API_KEY) {
      throw new Error('CMC_API_KEY not configured');
    }

    // Convert symbol format (e.g., BTCUSD -> BTC)
    // Fix: Replace USDT first, then USD to avoid corrupting symbols
    const cleanSymbol = symbol.replace('USDT', '').replace('USD', '');

    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${cleanSymbol}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CMC API error:', response.status, errorText);
      throw new Error(`CMC API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('CMC API response:', JSON.stringify(data));

    // Extract the first result (CMC returns array even for single symbol)
    const coinData = data.data[cleanSymbol]?.[0];
    
    if (!coinData) {
      throw new Error(`No data found for symbol ${cleanSymbol}`);
    }

    const quote = coinData.quote.USD;
    
    const marketData = {
      symbol: coinData.symbol,
      name: coinData.name,
      price: quote.price,
      marketCap: quote.market_cap,
      volume24h: quote.volume_24h,
      percentChange1h: quote.percent_change_1h,
      percentChange24h: quote.percent_change_24h,
      percentChange7d: quote.percent_change_7d,
      circulatingSupply: coinData.circulating_supply,
      totalSupply: coinData.total_supply,
      maxSupply: coinData.max_supply,
      marketCapDominance: quote.market_cap_dominance,
      rank: coinData.cmc_rank,
      lastUpdated: quote.last_updated,
    };

    console.log(`✅ CMC data for ${cleanSymbol}: Market Cap $${marketData.marketCap?.toLocaleString()}`);

    return new Response(
      JSON.stringify(marketData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching CMC data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
