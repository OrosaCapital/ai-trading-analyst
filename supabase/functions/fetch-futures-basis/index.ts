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
    const { isEndpointSupported } = await import('../_shared/symbolFormatter.ts');
    const supportCheck = isEndpointSupported(symbol, 'futures_basis');

    if (!supportCheck.supported) {
      console.log(`🚫 Blocked API call: ${symbol} not supported for futures_basis - ${supportCheck.reason}`);
      
      const blockedResponse = {
        symbol,
        currentBasis: null,
        basisPercent: null,
        structure: 'N/A',
        signal: 'N/A',
        history: [],
        timestamp: Date.now(),
        blocked: true,
        upgradeRequired: true,
        reason: supportCheck.reason || 'Not supported on Hobbyist plan',
        message: `Futures basis data unavailable - ${supportCheck.reason}`,
        isMockData: false
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
      .eq('metric_type', 'futures_basis')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`✅ Returning cached futures basis for ${symbol}`);
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching futures basis for ${symbol} from Coinglass`);

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
      'futures_basis',
      symbol,
      async () => await fetchFromCoinglassV2(
        'futures_basis_history',
        { symbol, interval: '4h' },
        coinglassApiKey
      )
    );

    // Validate response structure
    const validation = validateCoinglassResponse(data, (responseData) => {
      return validateArrayData(responseData, 1);
    });
    
    logValidationResult('futures_basis', symbol, validation);
    
    if (!validation.isValid) {
      const errorResponse = createErrorResponse('quote', symbol, validation.errors, validation.warnings);
      errorResponse.currentBasis = 0;
      errorResponse.basisPercent = 0;
      errorResponse.structure = 'NEUTRAL';
      errorResponse.signal = 'NEUTRAL';
      errorResponse.history = [];
      errorResponse.timestamp = Date.now();
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Coinglass futures basis response:', JSON.stringify(data));

    const historyData = data.data || [];
    const latest = historyData[historyData.length - 1];

    const responseData = {
      symbol,
      currentBasis: latest?.basis || 0,
      basisPercent: latest?.basis_percent || 0,
      structure: getBasisStructure(latest?.basis_percent || 0),
      signal: getBasisSignal(latest?.basis_percent || 0),
      history: historyData.slice(-24), // Last 24 data points
      timestamp: Date.now(),
      isMockData: false
    };

    console.log(`✅ Futures basis for ${symbol}:`, responseData);

    // Cache for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await supabase
      .from('coinglass_metrics_cache')
      .upsert({
        symbol,
        metric_type: 'futures_basis',
        data: responseData,
        expires_at: expiresAt.toISOString(),
      });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching futures basis:', error);
    
    const fallbackData = {
      symbol: 'UNKNOWN',
      currentBasis: 0,
      basisPercent: 0,
      structure: 'NEUTRAL',
      signal: 'NEUTRAL',
      history: [],
      timestamp: Date.now(),
      isMockData: true,
      unavailable: true,
      message: 'Futures basis data temporarily unavailable'
    };

    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getBasisStructure(basisPercent: number): string {
  if (basisPercent > 0) return 'CONTANGO';
  if (basisPercent < 0) return 'BACKWARDATION';
  return 'FLAT';
}

function getBasisSignal(basisPercent: number): string {
  if (basisPercent > 5) return 'EXTREME SPECULATION';
  if (basisPercent > 2) return 'HIGH SPECULATION';
  if (basisPercent < -2) return 'STRONG BULLISH';
  if (basisPercent < -1) return 'BULLISH';
  return 'NEUTRAL';
}
