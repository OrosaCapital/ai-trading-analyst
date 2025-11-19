import { createClient } from 'jsr:@supabase/supabase-js@2';

// 🚨 CRITICAL: CoinGlass API Rate Limits
// - Hobbyist Plan: Limited requests per day
// - This function costs credits per API call
// - DO NOT call more than 1x per 4 hours
// - ALWAYS check cache before calling
// - Cache TTL: 4 hours minimum

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FundingRateData {
  symbol: string;
  rate: string;
  time: number;
}

interface FundingHistoryCandle {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');

    if (!COINGLASS_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'COINGLASS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Symbols to populate (matching populate-market-data)
    const symbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT'];
    const exchange = 'Binance';

    console.log(`⚠️ CoinGlass API Rate Limit: 4-hour cache enforced!`);
    console.log(`Populating CoinGlass data for ${symbols.length} symbols...`);

    const results = {
      success: true,
      populated: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    for (const symbol of symbols) {
      try {
        const cleanSymbol = symbol.replace('USDT', '');

        // 🔍 Check cache first (4-hour TTL to conserve API credits)
        const { data: cachedRate } = await supabaseClient
          .from('market_funding_rates')
          .select('rate, timestamp')
          .eq('symbol', symbol)
          .eq('exchange', exchange)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        const cacheAge = cachedRate
          ? (Date.now() - cachedRate.timestamp * 1000) / 1000
          : Infinity;

        // Use cache if less than 4 hours old (14400 seconds)
        if (cachedRate && cacheAge < 14400) {
          console.log(`💾 ${symbol} using cached funding rate (age: ${Math.floor(cacheAge / 3600)}h)`);
          results.skipped.push(symbol);
          continue;
        }

        // ===== FETCH CURRENT FUNDING RATE =====
        console.log(`🌐 Fetching current funding rate for ${symbol}...`);
        
        const currentUrl = new URL('https://open-api-v4.coinglass.com/api/futures/funding-rate/current');
        currentUrl.searchParams.append('symbol', symbol);

        const currentRes = await fetch(currentUrl.toString(), {
          headers: {
            'CG-API-KEY': COINGLASS_API_KEY,
            'accept': 'application/json',
          },
        });

        if (currentRes.ok) {
          const currentData = await currentRes.json();

          if (currentData.code === '0' && currentData.data) {
            const exchangeData = currentData.data.find(
              (item: any) => item.exchangeName === exchange
            );

            if (exchangeData) {
              const rate = parseFloat(exchangeData.rate);
              const timestamp = Math.floor(exchangeData.updateTime / 1000);

              // Insert current funding rate
              const { error: insertError } = await supabaseClient
                .from('market_funding_rates')
                .upsert({
                  symbol,
                  exchange,
                  rate,
                  timestamp,
                }, { onConflict: 'symbol,exchange,timestamp' });

              if (insertError) {
                console.error(`Error inserting current funding rate for ${symbol}:`, insertError);
              } else {
                console.log(`✅ ${symbol} current funding rate: ${rate}% at ${new Date(timestamp * 1000).toISOString()}`);
              }
            }
          }
        } else {
          const errorText = await currentRes.text();
          console.error(`❌ CoinGlass current funding failed for ${symbol} [${currentRes.status}]:`, errorText);
          results.errors.push(`${symbol}: ${currentRes.status}`);
          continue;
        }

        // ===== FETCH FUNDING HISTORY (4h interval, last 100 candles = ~16 days) =====
        console.log(`📊 Fetching funding history for ${symbol}...`);

        const historyUrl = new URL('https://open-api-v4.coinglass.com/api/futures/funding-rate/history');
        historyUrl.searchParams.append('exchange', exchange);
        historyUrl.searchParams.append('symbol', symbol);
        historyUrl.searchParams.append('interval', '4h');
        historyUrl.searchParams.append('limit', '100');

        const historyRes = await fetch(historyUrl.toString(), {
          headers: {
            'CG-API-KEY': COINGLASS_API_KEY,
            'accept': 'application/json',
          },
        });

        if (historyRes.ok) {
          const historyData = await historyRes.json();

          if (historyData.code === '0' && historyData.data && historyData.data.length > 0) {
            const historyRecords = historyData.data.map((candle: FundingHistoryCandle) => ({
              symbol,
              exchange,
              rate: parseFloat(candle.close),
              timestamp: Math.floor(candle.time / 1000),
            }));

            const { error: historyError } = await supabaseClient
              .from('market_funding_rates')
              .upsert(historyRecords, { onConflict: 'symbol,exchange,timestamp' });

            if (historyError) {
              console.error(`Error inserting funding history for ${symbol}:`, historyError);
            } else {
              console.log(`✅ Populated ${historyRecords.length} historical funding rates for ${symbol}`);
            }
          }
        } else {
          const errorText = await historyRes.text();
          console.error(`❌ CoinGlass history failed for ${symbol} [${historyRes.status}]:`, errorText);
        }

        results.populated.push(symbol);

        // Rate limiting: small delay between symbols
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (symbolError) {
        console.error(`Error processing ${symbol}:`, symbolError);
        results.errors.push(`${symbol}: ${symbolError.message}`);
      }
    }

    console.log(`✅ CoinGlass population complete!`);
    console.log(`Populated: ${results.populated.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`);

    return new Response(
      JSON.stringify({
        ...results,
        message: `Populated CoinGlass data for ${results.populated.length} symbols`,
        symbols: results.populated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('CoinGlass population error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
