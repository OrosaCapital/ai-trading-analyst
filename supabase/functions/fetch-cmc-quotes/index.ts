import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes (free tier optimization)
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, symbols } = await req.json();
    
    if (!symbol && !symbols) {
      throw new Error('Symbol or symbols array required');
    }

    const CMC_API_KEY = Deno.env.get('COINMARKETCAP_API_KEY');
    if (!CMC_API_KEY) {
      throw new Error('COINMARKETCAP_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine which symbols to fetch
    const symbolList = symbols || [symbol];
    const symbolsParam = symbolList.join(',');

    // Check cache first
    const cacheKey = `cmc_quotes_${symbolsParam}`;
    const { data: cachedData } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('symbol', cacheKey)
      .eq('data_type', 'cmc_quotes')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cachedData) {
      console.log(`✅ Cache HIT for CMC quotes: ${symbolsParam}`);
      return new Response(
        JSON.stringify(cachedData.data),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        }
      );
    }

    console.log(`❌ Cache MISS for CMC quotes: ${symbolsParam} - Fetching from API`);

    // Fetch from CoinMarketCap API
    const url = `${CMC_BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbolsParam}&convert=USD`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CMC API error:', errorText);
      throw new Error(`CMC API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform CMC data to our format
    const quotes = symbolList.map((sym: string) => {
      const cmcData = data.data[sym];
      if (!cmcData) return null;

      const quote = cmcData.quote.USD;
      
      return {
        symbol: sym,
        name: cmcData.name,
        price: quote.price,
        marketCap: quote.market_cap,
        volume24h: quote.volume_24h,
        circulatingSupply: cmcData.circulating_supply,
        maxSupply: cmcData.max_supply,
        percentChange1h: quote.percent_change_1h,
        percentChange24h: quote.percent_change_24h,
        percentChange7d: quote.percent_change_7d,
        marketCapDominance: quote.market_cap_dominance,
        rank: cmcData.cmc_rank,
        lastUpdated: quote.last_updated,
      };
    }).filter(Boolean);

    const responseData = symbolList.length === 1 ? quotes[0] : quotes;

    // Cache the data for 5 minutes
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();
    
    await supabase
      .from('market_data_cache')
      .upsert({
        symbol: cacheKey,
        data_type: 'cmc_quotes',
        data: responseData,
        expires_at: expiresAt,
      }, {
        onConflict: 'symbol,data_type'
      });

    console.log(`💾 Cached CMC quotes for ${symbolsParam} until ${expiresAt}`);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-cmc-quotes:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        unavailable: true,
        reason: 'CMC_API_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
