import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { translateToKraken } from '../_shared/krakenSymbols.ts';
import { isPairSupported } from '../_shared/krakenPairDiscovery.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Kraken interval mapping
const INTERVAL_MAP: Record<string, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
};

const INTERVALS = ['1m', '5m', '15m', '1h'] as const;
const BATCH_SIZE = 500;
const DELAY_BETWEEN_REQUESTS = 150; // ms

interface KrakenOHLC {
  error: string[];
  result?: {
    [key: string]: number[][];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { symbol, lookbackHours = 24 } = await req.json().catch(() => ({}));

    console.log(`🔄 Starting price log population (lookback: ${lookbackHours}h)`);

    // Fetch tracked symbols
    const { data: trackedSymbols, error: symbolError } = await supabase
      .from('tracked_symbols')
      .select('symbol')
      .eq('active', true);

    if (symbolError) throw symbolError;

    const symbols = symbol ? [symbol] : (trackedSymbols?.map(s => s.symbol) || []);
    console.log(`📊 Processing ${symbols.length} symbol(s): ${symbols.join(', ')}`);

    const results: Record<string, any> = {};
    let totalInserted = 0;

    for (const sym of symbols) {
      const krakenSymbol = translateToKraken(sym);
      
      // Check if pair is supported
      const supported = await isPairSupported(krakenSymbol);
      if (!supported) {
        console.log(`⚠️ ${sym} (${krakenSymbol}) not supported by Kraken, skipping...`);
        results[sym] = { status: 'unsupported', inserted: 0 };
        continue;
      }

      results[sym] = { status: 'success', intervals: {} };

      for (const interval of INTERVALS) {
        try {
          console.log(`📈 Fetching ${interval} data for ${sym}...`);

          const since = Math.floor((Date.now() - (lookbackHours * 60 * 60 * 1000)) / 1000);
          const krakenInterval = INTERVAL_MAP[interval];

          const response = await fetch(
            `https://api.kraken.com/0/public/OHLC?pair=${krakenSymbol}&interval=${krakenInterval}&since=${since}`
          );

          const data: KrakenOHLC = await response.json();

          if (data.error && data.error.length > 0) {
            console.error(`❌ Kraken API error for ${sym} ${interval}:`, data.error);
            results[sym].intervals[interval] = { status: 'error', error: data.error[0] };
            continue;
          }

          const ohlcData = data.result?.[krakenSymbol];
          if (!ohlcData || ohlcData.length === 0) {
            console.log(`⚠️ No data returned for ${sym} ${interval}`);
            results[sym].intervals[interval] = { status: 'no_data', inserted: 0 };
            continue;
          }

          // Transform to price log format
          const priceLogs = ohlcData.map((candle) => ({
            symbol: sym,
            price: parseFloat(candle[4].toString()), // close price
            timestamp: new Date(candle[0] * 1000).toISOString(),
            interval: interval,
            volume: parseFloat(candle[6].toString()),
          }));

          // Batch insert
          let inserted = 0;
          for (let i = 0; i < priceLogs.length; i += BATCH_SIZE) {
            const batch = priceLogs.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await supabase
              .from('tatum_price_logs')
              .upsert(batch, { 
                onConflict: 'symbol,timestamp,interval',
                ignoreDuplicates: true 
              });

            if (insertError) {
              console.error(`❌ Insert error for ${sym} ${interval}:`, insertError);
            } else {
              inserted += batch.length;
            }
          }

          totalInserted += inserted;
          results[sym].intervals[interval] = { status: 'success', inserted };
          console.log(`✓ Inserted ${inserted} records for ${sym} ${interval}`);

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

        } catch (error) {
          console.error(`❌ Error processing ${sym} ${interval}:`, error);
          results[sym].intervals[interval] = { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      }
    }

    console.log(`✅ Price log population complete: ${totalInserted} total records inserted`);

    return new Response(
      JSON.stringify({
        success: true,
        totalInserted,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
