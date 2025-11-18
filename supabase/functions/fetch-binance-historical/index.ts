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

// Fetch candles from Tatum (replaces Binance due to geo-restrictions)
async function fetchTatumCandles(
  apiKey: string,
  symbol: string,
  interval: string,
  limit: number = 1000
): Promise<BinanceKline[]> {
  // Map intervals to Tatum format
  const tatumIntervalMap: Record<string, string> = {
    '1m': 'MIN_1',
    '5m': 'MIN_5', 
    '15m': 'MIN_15',
    '1h': 'HOUR_1'
  };
  
  const tatumInterval = tatumIntervalMap[interval];
  if (!tatumInterval) {
    throw new Error(`Unsupported interval: ${interval}`);
  }
  
  console.log(`📊 Fetching ${interval} candles for ${symbol}/USD from Tatum`);
  
  const url = `https://api.tatum.io/v4/data/ohlcv?symbol=${symbol}&basePair=USD&interval=${tatumInterval}&limit=${limit}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'x-api-key': apiKey
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tatum API error [${response.status}]: ${errorText}`);
  }

  const rawData = await response.json();
  
  // Transform Tatum OHLCV format to our interface
  return rawData.map((candle: any) => {
    const time = new Date(candle.time).getTime();
    const intervalMs = interval === '1m' ? 60000 : interval === '5m' ? 300000 : interval === '15m' ? 900000 : 3600000;
    
    return {
      openTime: time,
      open: String(candle.open),
      high: String(candle.high),
      low: String(candle.low),
      close: String(candle.close),
      volume: String(candle.volume || 0),
      closeTime: time + intervalMs,
      quoteVolume: String(candle.volume || 0),
      trades: 0,
      takerBuyBaseVolume: '0',
      takerBuyQuoteVolume: '0',
    };
  });
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

    console.log(`🚀 Starting Tatum historical data fetch for ${symbol} (${lookback_hours}h lookback)`);

    const tatumApiKey = Deno.env.get('TATUM_API_KEY');
    if (!tatumApiKey) {
      throw new Error('TATUM_API_KEY not configured');
    }

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
          1000 // API limit
        );

        const candles = await fetchTatumCandles(tatumApiKey, baseSymbol, binanceInterval, candlesNeeded);
        
        if (!candles || candles.length === 0) {
          console.log(`⚠️ No data returned for ${binanceInterval}`);
          return { interval: intervalMap[binanceInterval], count: 0 };
        }

        console.log(`✅ Fetched ${candles.length} ${binanceInterval} candles from Tatum`);

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

