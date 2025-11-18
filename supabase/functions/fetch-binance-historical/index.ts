import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

// Fetch candles from Binance
async function fetchBinanceCandles(
  symbol: string,
  interval: string,
  limit: number = 1000
): Promise<BinanceKline[]> {
  const binanceSymbol = `${symbol}USDT`;
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
  
  console.log(`📊 Fetching ${interval} candles for ${binanceSymbol} from Binance`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Binance API error [${response.status}]: ${errorText}`);
  }

  const rawData = await response.json();
  
  // Transform Binance kline format to our interface
  return rawData.map((k: any) => ({
    openTime: k[0],
    open: k[1],
    high: k[2],
    low: k[3],
    close: k[4],
    volume: k[5],
    closeTime: k[6],
    quoteVolume: k[7],
    trades: k[8],
    takerBuyBaseVolume: k[9],
    takerBuyQuoteVolume: k[10],
  }));
}

// Map Binance intervals to our internal intervals
const intervalMap: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { symbol, lookback_hours = 24 } = await req.json();
    
    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🚀 Starting Binance backfill for ${symbol} (${lookback_hours}h lookback)`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Normalize symbol (remove USD/USDT suffix if present)
    const baseSymbol = symbol.replace(/USD$|USDT$/, '');
    const normalizedSymbol = baseSymbol;

    let totalRecordsAdded = 0;
    const results: Record<string, number> = {};

    // Fetch all intervals in parallel
    const intervals = ['1m', '5m', '15m', '1h'];
    const fetchPromises = intervals.map(async (binanceInterval) => {
      try {
        // Calculate limit based on lookback hours
        const candlesNeeded = Math.min(
          Math.ceil(lookback_hours * 60 / parseInt(binanceInterval)),
          1000 // Binance max
        );

        const candles = await fetchBinanceCandles(baseSymbol, binanceInterval, candlesNeeded);
        
        if (!candles || candles.length === 0) {
          console.log(`⚠️ No data returned for ${binanceInterval}`);
          return { interval: intervalMap[binanceInterval], count: 0 };
        }

        console.log(`✅ Fetched ${candles.length} ${binanceInterval} candles from Binance`);

        // Transform to our price log format
        const priceLogs = candles.map(candle => ({
          symbol: normalizedSymbol,
          price: parseFloat(candle.close),
          volume: parseFloat(candle.volume),
          timestamp: new Date(candle.closeTime).toISOString(),
          interval: intervalMap[binanceInterval],
        }));

        // Insert in batches of 100 to avoid payload limits
        const batchSize = 100;
        let inserted = 0;
        
        for (let i = 0; i < priceLogs.length; i += batchSize) {
          const batch = priceLogs.slice(i, i + batchSize);
          const { error } = await supabase
            .from('tatum_price_logs')
            .upsert(batch, {
              onConflict: 'symbol,timestamp,interval',
              ignoreDuplicates: true,
            });

          if (error) {
            console.error(`❌ Error inserting ${binanceInterval} batch:`, error);
          } else {
            inserted += batch.length;
          }
        }

        console.log(`💾 Inserted ${inserted} ${binanceInterval} records for ${normalizedSymbol}`);
        return { interval: intervalMap[binanceInterval], count: inserted };
        
      } catch (error) {
        console.error(`❌ Error fetching ${binanceInterval}:`, error);
        return { interval: intervalMap[binanceInterval], count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const intervalResults = await Promise.all(fetchPromises);
    
    intervalResults.forEach(result => {
      results[result.interval] = result.count;
      totalRecordsAdded += result.count;
    });

    // Clean up old logs (keep last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
      await supabase
        .from('tatum_price_logs')
        .delete()
        .eq('symbol', normalizedSymbol)
        .lt('timestamp', sevenDaysAgo.toISOString());
      console.log('🧹 Cleaned up old price logs');
    } catch (err) {
      console.error('Cleanup error:', err);
    }

    return new Response(JSON.stringify({
      success: true,
      symbol: normalizedSymbol,
      totalRecordsAdded,
      intervalBreakdown: results,
      message: `Successfully backfilled ${totalRecordsAdded} records from Binance`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-binance-historical:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

