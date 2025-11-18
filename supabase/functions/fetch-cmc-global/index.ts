import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CMC_API_KEY = Deno.env.get('COINMARKETCAP_API_KEY');
    if (!CMC_API_KEY) {
      throw new Error('COINMARKETCAP_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check cache first
    const cacheKey = 'cmc_global_metrics';
    const { data: cachedData } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('symbol', cacheKey)
      .eq('data_type', 'cmc_global')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cachedData) {
      console.log('✅ Cache HIT for CMC global metrics');
      return new Response(
        JSON.stringify(cachedData.data),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        }
      );
    }

    console.log('❌ Cache MISS for CMC global metrics - Fetching from API');

    // Fetch global metrics from CoinMarketCap
    const url = `${CMC_BASE_URL}/global-metrics/quotes/latest?convert=USD`;
    
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
    const metrics = data.data.quote.USD;
    
    const globalMetrics = {
      totalMarketCap: metrics.total_market_cap,
      total24hVolume: metrics.total_volume_24h,
      btcDominance: data.data.btc_dominance,
      ethDominance: data.data.eth_dominance,
      activeExchanges: data.data.active_exchanges,
      activeCryptocurrencies: data.data.active_cryptocurrencies,
      totalExchanges: data.data.total_exchanges,
      lastUpdated: metrics.last_updated,
    };

    // Cache for 5 minutes
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();
    
    await supabase
      .from('market_data_cache')
      .upsert({
        symbol: cacheKey,
        data_type: 'cmc_global',
        data: globalMetrics,
        expires_at: expiresAt,
      }, {
        onConflict: 'symbol,data_type'
      });

    console.log(`💾 Cached CMC global metrics until ${expiresAt}`);

    return new Response(
      JSON.stringify(globalMetrics),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-cmc-global:', error);
    
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
