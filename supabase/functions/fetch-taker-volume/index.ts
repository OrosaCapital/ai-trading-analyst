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
      .eq('metric_type', 'taker_volume')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`✅ Returning cached taker volume for ${symbol}`);
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching taker volume for ${symbol} from Coinglass`);

    const data = await fetchFromCoinglassV2(
      'taker_volume_exchange_list',
      { symbol, range: '1h' },
      coinglassApiKey
    );

    console.log('Coinglass taker volume response:', JSON.stringify(data));

    const responseData = {
      symbol,
      exchanges: data.data || [],
      buyRatio: calculateBuyRatio(data.data),
      sellRatio: calculateSellRatio(data.data),
      sentiment: getVolumeSentiment(data.data),
      timestamp: Date.now(),
      isMockData: false
    };

    console.log(`✅ Taker volume for ${symbol}:`, responseData);

    // Cache for 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await supabase
      .from('coinglass_metrics_cache')
      .upsert({
        symbol,
        metric_type: 'taker_volume',
        data: responseData,
        expires_at: expiresAt.toISOString(),
      });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching taker volume:', error);
    
    const fallbackData = {
      symbol: 'UNKNOWN',
      exchanges: [],
      buyRatio: 50,
      sellRatio: 50,
      sentiment: 'NEUTRAL',
      timestamp: Date.now(),
      isMockData: true,
      unavailable: true,
      message: 'Taker volume data temporarily unavailable'
    };

    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateBuyRatio(exchanges: any[]): number {
  if (!exchanges || exchanges.length === 0) return 50;
  
  const totalBuy = exchanges.reduce((sum, ex) => sum + parseFloat(ex.buy_volume || 0), 0);
  const totalSell = exchanges.reduce((sum, ex) => sum + parseFloat(ex.sell_volume || 0), 0);
  const total = totalBuy + totalSell;
  
  return total > 0 ? (totalBuy / total) * 100 : 50;
}

function calculateSellRatio(exchanges: any[]): number {
  return 100 - calculateBuyRatio(exchanges);
}

function getVolumeSentiment(exchanges: any[]): string {
  const buyRatio = calculateBuyRatio(exchanges);
  
  if (buyRatio > 65) return 'STRONG BUYING';
  if (buyRatio > 55) return 'BUYING';
  if (buyRatio < 35) return 'STRONG SELLING';
  if (buyRatio < 45) return 'SELLING';
  return 'BALANCED';
}
