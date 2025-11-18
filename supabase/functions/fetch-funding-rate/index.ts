import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate cache key
function getCacheKey(symbol: string, interval: string): string {
  return `funding_rate_${symbol}_${interval}`;
}

// Mock data removed - only using live CoinGlass API data

// Fetch real funding rate from Coinglass with validation
async function fetchFundingRateFromCoinglass(symbol: string, interval: string, apiKey: string) {
  const {
    validateCoinglassResponse,
    validateArrayData,
    validateOHLCData,
    logValidationResult,
    createErrorResponse,
  } = await import('../_shared/apiValidation.ts');
  
  const { monitoredAPICall } = await import('../_shared/apiMonitoring.ts');
  const { formatForCoinglass, isCoinglassSupported, getUnsupportedMessage } = await import('../_shared/symbolFormatter.ts');

  try {
    // Convert symbol to USDT pair format for Coinglass
    const cleanSymbol = formatForCoinglass(symbol);
    
    // Check if symbol is likely supported on Hobbyist plan
    if (!isCoinglassSupported(symbol)) {
      console.warn(`⚠️ Symbol ${symbol} may not be supported on Coinglass Hobbyist plan`);
    }
    
    // Import shared client function
    const { fetchFromCoinglassV2 } = await import('../_shared/coinglassClient.ts');
    
    // Use monitored API call for automatic tracking
    const data = await monitoredAPICall(
      'funding_rate',
      cleanSymbol,
      async () => await fetchFromCoinglassV2(
        'funding_rate',
        {
          exchange: 'Binance',
          symbol: cleanSymbol,
          interval: interval,
          limit: '24'
        },
        apiKey
      )
    );
    
    // Validate response structure
    const validation = validateCoinglassResponse(data, (responseData) => {
      const errors = validateArrayData(responseData, 1);
      if (errors.length === 0 && Array.isArray(responseData)) {
        errors.push(...validateOHLCData(responseData));
      }
      return errors;
    });
    
    logValidationResult('funding_rate', cleanSymbol, validation);
    
    if (!validation.isValid) {
      const errorResponse = createErrorResponse('funding_rate', symbol, validation.errors, validation.warnings);
      // Add helpful message for upgrade plan errors
      if (validation.errors.some(e => e.includes('Upgrade plan'))) {
        errorResponse.message = getUnsupportedMessage(symbol);
      }
      return errorResponse;
    }

    const currentRate = parseFloat(data.data[data.data.length - 1]?.close) || 0;
    const sentiment = currentRate > 0.0001 ? 'BULLISH' : currentRate < -0.0001 ? 'BEARISH' : 'NEUTRAL';

    return {
      current: {
        rate: `${(currentRate * 100).toFixed(4)}%`,
        rateValue: currentRate,
        nextFunding: new Date(Date.now() + 8 * 3600000).toISOString(),
        sentiment
      },
      history: data.data.map((item: any) => ({
        time: item.time,
        rate: parseFloat(item.close),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close)
      })),
      isMockData: false
    };
  } catch (error) {
    console.error('Coinglass API error:', error);
    
    // Return structured error response instead of throwing
    const { createErrorResponse } = await import('../_shared/apiValidation.ts');
    return createErrorResponse(
      'funding_rate',
      symbol,
      [error instanceof Error ? error.message : 'Unknown API error'],
      ['Check API key and symbol format']
    );
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTC', interval = 'h1' } = await req.json();
    console.log(`📊 Funding rate request for ${symbol} (${interval})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this symbol-endpoint combo is supported
    const { isEndpointSupported } = await import('./../_shared/symbolFormatter.ts');
    const supportCheck = isEndpointSupported(symbol, 'funding_rate');

    if (!supportCheck.supported) {
      console.log(`🚫 Blocked API call: ${symbol} not supported for funding_rate - ${supportCheck.reason}`);
      
      const blockedResponse = {
        current: {
          rate: 'N/A',
          rateValue: null,
          nextFunding: null,
          sentiment: 'N/A'
        },
        history: [],
        blocked: true,
        upgradeRequired: true,
        reason: supportCheck.reason || 'Not supported on Hobbyist plan',
        message: `Funding rate data unavailable - ${supportCheck.reason}`,
        isMockData: false
      };
      
      return new Response(JSON.stringify(blockedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Check cache first
    const cacheKey = getCacheKey(symbol, interval);
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('data_type', 'funding_rate')
      .eq('symbol', symbol)
      .eq('interval', interval)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log('✅ Cache hit for funding rate');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('❌ Cache miss, fetching funding rate data');

    // Only fetch from CoinGlass - NO MOCK DATA
    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
    
    if (!COINGLASS_API_KEY) {
      throw new Error('CoinGlass API key not configured. Please add COINGLASS_API_KEY secret.');
    }

    let result;
    try {
      result = await fetchFundingRateFromCoinglass(symbol, interval, COINGLASS_API_KEY);
    } catch (error) {
      // If symbol not available on Coinglass, return graceful fallback
      console.log(`Symbol ${symbol} not available for funding rate data`);
      const fallbackData = {
        current: {
          rate: 'N/A',
          rateValue: 0,
          nextFunding: new Date(Date.now() + 8 * 3600000).toISOString(),
          sentiment: 'UNAVAILABLE'
        },
        history: [],
        isMockData: false,
        unavailable: true,
        message: 'Derivatives data not available for this symbol'
      };
      
      // Cache the unavailable result
      await supabase.from('market_data_cache').insert({
        data_type: 'funding_rate',
        symbol,
        interval,
        data: fallbackData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify(fallbackData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache the result
    await supabase.from('market_data_cache').insert({
      data_type: 'funding_rate',
      symbol,
      interval,
      data: result,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in fetch-funding-rate:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch funding rate data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
