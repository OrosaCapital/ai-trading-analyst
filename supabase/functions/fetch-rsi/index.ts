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

    // Check if this symbol-endpoint combo is supported
    const { isEndpointSupported, createBlockedEndpointResponse } = await import('../_shared/symbolFormatter.ts');
    const supportCheck = isEndpointSupported(symbol, 'rsi');

    if (!supportCheck.supported) {
      console.log(`🚫 Blocked API call: ${symbol} not supported for RSI - ${supportCheck.reason}`);
      
      const blockedResponse = {
        symbol,
        rsi14: null,
        allPeriods: [],
        signal: 'N/A',
        timestamp: Date.now(),
        blocked: true,
        upgradeRequired: true,
        reason: supportCheck.reason || 'Not supported on Hobbyist plan',
        message: `RSI data unavailable - ${supportCheck.reason}`
      };
      
      return new Response(JSON.stringify(blockedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Check cache first
    const { data: cachedData } = await supabase
      .from('coinglass_metrics_cache')
      .select('*')
      .eq('metric_type', 'rsi')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`✅ Returning cached RSI for ${symbol}`);
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching RSI for ${symbol} from Coinglass`);

    // Import validation and monitoring
    const {
      validateCoinglassResponse,
      validateArrayData,
      logValidationResult,
      createErrorResponse,
    } = await import('../_shared/apiValidation.ts');
    
    const { monitoredAPICall } = await import('../_shared/apiMonitoring.ts');

    // Use monitored API call
    const data = await monitoredAPICall(
      'rsi',
      symbol,
      async () => await fetchFromCoinglassV2(
        'rsi_list',
        { symbol },
        coinglassApiKey
      )
    );

    // Validate response structure
    const validation = validateCoinglassResponse(data, (responseData) => {
      return validateArrayData(responseData, 0); // RSI can have empty array
    });
    
    logValidationResult('rsi', symbol, validation);
    
    if (!validation.isValid) {
      const errorResponse = createErrorResponse('quote', symbol, validation.errors, validation.warnings);
      errorResponse.rsi14 = 50;
      errorResponse.allPeriods = [];
      errorResponse.signal = 'NEUTRAL';
      errorResponse.timestamp = Date.now();
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Coinglass RSI response:', JSON.stringify(data));

    const rsiData = data.data || [];
    const rsi14 = rsiData.find((r: any) => r.period === '14d' || r.period === '14')?.value || 50;

    const responseData = {
      symbol,
      rsi14: parseFloat(rsi14),
      allPeriods: rsiData,
      signal: getRSISignal(parseFloat(rsi14)),
      timestamp: Date.now(),
      isMockData: false
    };

    console.log(`✅ RSI for ${symbol}:`, responseData);

    // Cache for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await supabase
      .from('coinglass_metrics_cache')
      .upsert({
        symbol,
        metric_type: 'rsi',
        data: responseData,
        expires_at: expiresAt.toISOString(),
      });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching RSI:', error);
    
    const fallbackData = {
      symbol: 'UNKNOWN',
      rsi14: 50,
      allPeriods: [],
      signal: 'NEUTRAL',
      timestamp: Date.now(),
      isMockData: true,
      unavailable: true,
      message: 'RSI data temporarily unavailable'
    };

    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getRSISignal(rsi: number): string {
  if (rsi >= 70) return 'OVERBOUGHT';
  if (rsi >= 60) return 'BULLISH';
  if (rsi <= 30) return 'OVERSOLD';
  if (rsi <= 40) return 'BEARISH';
  return 'NEUTRAL';
}
