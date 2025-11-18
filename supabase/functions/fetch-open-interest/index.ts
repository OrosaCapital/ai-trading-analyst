import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock data removed - only using live CoinGlass API data

// Fetch real open interest from Coinglass with validation
async function fetchOpenInterestFromCoinglass(symbol: string, apiKey: string) {
  const {
    validateCoinglassResponse,
    validateArrayData,
    validateOHLCData,
    logValidationResult,
    createErrorResponse,
  } = await import('../_shared/apiValidation.ts');
  
  const { monitoredAPICall } = await import('../_shared/apiMonitoring.ts');

  try {
    // Convert symbol to USDT pair format
    const cleanSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '') + 'USDT';
    
    // Import shared client function
    const { fetchFromCoinglassV2 } = await import('../_shared/coinglassClient.ts');
    
    // Use monitored API calls
    const [historyData, exchangeData] = await Promise.all([
      monitoredAPICall(
        'open_interest_ohlc',
        cleanSymbol,
        async () => await fetchFromCoinglassV2(
          'open_interest_ohlc',
          {
            exchange: 'Binance',
            symbol: cleanSymbol,
            interval: '1h',
            limit: '24'
          },
          apiKey
        )
      ),
      monitoredAPICall(
        'open_interest_list',
        cleanSymbol,
        async () => await fetchFromCoinglassV2(
          'open_interest_list',
          {
            symbol: cleanSymbol.replace('USDT', '')
          },
          apiKey
        )
      )
    ]);

    // Validate history response
    const historyValidation = validateCoinglassResponse(historyData, (responseData) => {
      const errors = validateArrayData(responseData, 1);
      if (errors.length === 0 && Array.isArray(responseData)) {
        errors.push(...validateOHLCData(responseData));
      }
      return errors;
    });
    
    logValidationResult('open_interest_ohlc', cleanSymbol, historyValidation);
    
    if (!historyValidation.isValid) {
      return createErrorResponse('open_interest', symbol, historyValidation.errors, historyValidation.warnings);
    }
    
    // Validate exchange response (warnings only, not critical)
    const exchangeValidation = validateCoinglassResponse(exchangeData);
    if (!exchangeValidation.isValid) {
      console.warn('Exchange data validation failed:', exchangeValidation.errors);
    }

    const latestOI = historyData.data[historyData.data.length - 1];
    const firstOI = historyData.data[0];
    const change24hValue = ((parseFloat(latestOI.close) - parseFloat(firstOI.open)) / parseFloat(firstOI.open) * 100);
    const change24h = change24hValue.toFixed(2);

    const byExchange = exchangeData.code === '0' && exchangeData.data ? 
      exchangeData.data.map((ex: any) => ({
        exchange: ex.exchange || ex.exchangeName || 'Unknown',
        value: `${(parseFloat(ex.open_interest || ex.openInterest) / 1000000000).toFixed(2)}B`,
        valueRaw: parseFloat(ex.open_interest || ex.openInterest),
        percentage: ex.percentage || ((parseFloat(ex.open_interest || ex.openInterest) / parseFloat(latestOI.close)) * 100).toFixed(2)
      })) : [];

    return {
      total: {
        value: `${(parseFloat(latestOI.close) / 1000000000).toFixed(2)}B`,
        valueRaw: parseFloat(latestOI.close),
        change24h: `${change24hValue > 0 ? '+' : ''}${change24h}%`,
        sentiment: change24hValue > 0 ? 'INCREASING' : 'DECREASING'
      },
      byExchange,
      history: historyData.data.map((item: any) => ({
        time: item.time,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close)
      })),
      isMockData: false
    };
  } catch (error) {
    console.error('Coinglass OI fetch error:', error);
    
    // Return structured error response
    const { createErrorResponse } = await import('../_shared/apiValidation.ts');
    return createErrorResponse(
      'open_interest',
      symbol,
      [error instanceof Error ? error.message : 'Unknown API error'],
      ['Verify symbol is available for derivatives data']
    );
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTC' } = await req.json();
    console.log(`📈 Open interest request for ${symbol}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('data_type', 'open_interest')
      .eq('symbol', symbol)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log('✅ Cache hit for open interest');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('❌ Cache miss, fetching open interest data');

    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
    
    if (!COINGLASS_API_KEY) {
      throw new Error('CoinGlass API key not configured. Please add COINGLASS_API_KEY secret.');
    }

    let result;
    try {
      result = await fetchOpenInterestFromCoinglass(symbol, COINGLASS_API_KEY);
    } catch (error) {
      // If symbol not available on Coinglass, return graceful fallback
      console.log(`Symbol ${symbol} not available for open interest data`);
      const fallbackData = {
        total: {
          value: 'N/A',
          valueRaw: 0,
          change24h: 'N/A',
          sentiment: 'UNAVAILABLE'
        },
        byExchange: [],
        history: [],
        isMockData: false,
        unavailable: true,
        message: 'Derivatives data not available for this symbol'
      };
      
      // Cache the unavailable result
      await supabase.from('market_data_cache').insert({
        data_type: 'open_interest',
        symbol,
        interval: null,
        data: fallbackData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify(fallbackData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache the result
    await supabase.from('market_data_cache').insert({
      data_type: 'open_interest',
      symbol,
      data: result,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in fetch-open-interest:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch open interest data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
