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
    const { symbol } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const coinglassApiKey = Deno.env.get('COINGLASS_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('coinglass_metrics_cache')
      .select('*')
      .eq('metric_type', 'funding_rate_list')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`✅ Returning cached funding rate list for ${symbol}`);
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching funding rate list for ${symbol} from Coinglass`);

    const data = await fetchFromCoinglassV2(
      'funding_rate_exchange_list',
      { symbol },
      coinglassApiKey
    );

    console.log('Coinglass funding rate list response:', JSON.stringify(data));

    const responseData = {
      symbol,
      exchanges: data.data || [],
      avgRate: data.data?.reduce((sum: number, ex: any) => sum + parseFloat(ex.rate || 0), 0) / (data.data?.length || 1),
      sentiment: getFundingSentiment(data.data),
      timestamp: Date.now(),
      isMockData: false
    };

    console.log(`✅ Funding rate list for ${symbol}:`, responseData);

    // Cache for 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await supabase
      .from('coinglass_metrics_cache')
      .upsert({
        symbol,
        metric_type: 'funding_rate_list',
        data: responseData,
        expires_at: expiresAt.toISOString(),
      });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching funding rate list:', error);
    
    const fallbackData = {
      symbol: 'UNKNOWN',
      exchanges: [],
      avgRate: 0,
      sentiment: 'NEUTRAL',
      timestamp: Date.now(),
      isMockData: true,
      unavailable: true,
      message: 'Funding rate data temporarily unavailable'
    };

    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getFundingSentiment(exchanges: any[]): string {
  if (!exchanges || exchanges.length === 0) return 'NEUTRAL';
  
  const avgRate = exchanges.reduce((sum, ex) => sum + parseFloat(ex.rate || 0), 0) / exchanges.length;
  
  if (avgRate > 0.01) return 'BULLISH EXTREME';
  if (avgRate > 0.005) return 'BULLISH';
  if (avgRate < -0.01) return 'BEARISH EXTREME';
  if (avgRate < -0.005) return 'BEARISH';
  return 'NEUTRAL';
}
