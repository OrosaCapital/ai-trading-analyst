import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { fetchFromCoinglassV2 } from '../_shared/coinglassClient.ts';

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
    const coinglassApiKey = Deno.env.get('COINGLASS_API_KEY')!;
    
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

    console.log('Fetching Fear & Greed Index from Coinglass');

    // Fetch from Coinglass API
    const data = await fetchFromCoinglassV2(
      'fear_greed_index',
      {},
      coinglassApiKey
    );

    console.log('Coinglass Fear & Greed response:', JSON.stringify(data));

    // Parse the response
    const responseData = {
      index: data.data?.fearGreedIndex || 50,
      value: data.data?.fearGreedIndexValue || 'NEUTRAL',
      updateTime: data.data?.updateTime || Date.now(),
      sentiment: getSentiment(data.data?.fearGreedIndex || 50),
      isMockData: false
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
      index: 50,
      value: 'NEUTRAL',
      updateTime: Date.now(),
      sentiment: 'NEUTRAL',
      isMockData: true,
      unavailable: true,
      message: 'Fear & Greed Index temporarily unavailable'
    };

    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSentiment(index: number): string {
  if (index >= 75) return 'EXTREME GREED';
  if (index >= 60) return 'GREED';
  if (index >= 45) return 'NEUTRAL';
  if (index >= 25) return 'FEAR';
  return 'EXTREME FEAR';
}
