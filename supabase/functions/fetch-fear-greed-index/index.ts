import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cmcApiKey = Deno.env.get('CMC_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('coinglass_metrics_cache')
      .select('*')
      .eq('metric_type', 'fear_greed_index')
      .eq('symbol', 'MARKET')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log('✅ Returning cached Fear & Greed Index');
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching Fear & Greed Index from CoinMarketCap API');

    // Fetch from CoinMarketCap API
    const response = await fetch('https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': cmcApiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CMC API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('CoinMarketCap Fear & Greed response:', JSON.stringify(data));

    // Parse the CoinMarketCap response
    const fngData = data.data;
    const responseData = {
      value: fngData?.value || 50,
      valueClassification: fngData?.value_classification || 'Neutral',
      timestamp: fngData?.timestamp || new Date().toISOString(),
      timeUntilUpdate: fngData?.time_until_update,
      isMockData: false,
      change24h: 0, // CMC doesn't provide 24h change in this endpoint
    };

    console.log('✅ Fear & Greed Index:', responseData);

    // Cache for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await supabase
      .from('coinglass_metrics_cache')
      .upsert({
        symbol: 'MARKET',
        metric_type: 'fear_greed_index',
        data: responseData,
        expires_at: expiresAt.toISOString(),
      });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching Fear & Greed Index:', error);
    
    // Return fallback data on error
    const fallbackData = {
      value: 50,
      valueClassification: 'Neutral',
      timestamp: new Date().toISOString(),
      isMockData: true,
      unavailable: true,
      change24h: 0,
      message: 'Fear & Greed Index temporarily unavailable'
    };

    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
