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

// Fetch candles from CoinGecko (free, no geo-restrictions)
async function fetchCoinGeckoCandles(
  symbol: string,
  interval: string,
  limit: number = 1000
): Promise<BinanceKline[]> {
  // Map symbols to CoinGecko IDs
  const coinGeckoIdMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'DOT': 'polkadot'
  };
  
  const coinId = coinGeckoIdMap[symbol] || symbol.toLowerCase();
  
  // Calculate days based on interval and limit to get enough candles
  // CoinGecko typically returns ~48-96 candles depending on the days parameter
  // Request more days to get more candles
  const intervalMinutes = interval === '1m' ? 1 : interval === '5m' ? 5 : interval === '15m' ? 15 : 60;
  let days: number;
  
  if (interval === '1m') {
    days = 3; // Request 3 days for 1m to get ~200 candles
  } else if (interval === '5m') {
    days = 7; // Request 7 days for 5m to get ~200 candles
  } else if (interval === '15m') {
    days = 14; // Request 14 days for 15m to get ~100 candles
  } else { // 1h
    days = 30; // Request 30 days for 1h to get ~60-100 candles
  }
  
  days = Math.min(days, 90); // Cap at 90 days for free tier
  
  console.log(`📊 Fetching ${interval} candles for ${symbol} (${coinId}) from CoinGecko (${days} days)`);
  
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json'
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CoinGecko API error [${response.status}]: ${errorText}`);
  }

  const rawData = await response.json();
  
  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error(`No data returned from CoinGecko for ${symbol}`);
  }
  
  // CoinGecko returns [timestamp, open, high, low, close]
  // Transform to our format and limit results
  const candles = rawData.slice(-limit).map((candle: any) => {
    const [timestamp, open, high, low, close] = candle;
    const intervalMs = interval === '1m' ? 60000 : interval === '5m' ? 300000 : interval === '15m' ? 900000 : 3600000;
    
    return {
      openTime: timestamp,
      open: String(open),
      high: String(high),
      low: String(low),
      close: String(close),
      volume: '0', // CoinGecko OHLC doesn't include volume
      closeTime: timestamp + intervalMs,
      quoteVolume: '0',
      trades: 0,
      takerBuyBaseVolume: '0',
      takerBuyQuoteVolume: '0',
    };
  });
  
  return candles;
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

    console.log(`🚀 Starting CoinGecko historical data fetch for ${symbol} (${lookback_hours}h lookback)`);

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
        // Calculate limit - request more candles from CoinGecko
        let candlesNeeded: number;
        if (binanceInterval === '1m') {
          candlesNeeded = 1440; // 24 hours
        } else if (binanceInterval === '5m') {
          candlesNeeded = 500;
        } else if (binanceInterval === '15m') {
          candlesNeeded = 200;
        } else { // 1h
          candlesNeeded = 100;
        }

        const candles = await fetchCoinGeckoCandles(baseSymbol, binanceInterval, candlesNeeded);
        
        if (!candles || candles.length === 0) {
          console.log(`⚠️ No data returned for ${binanceInterval}`);
          return { interval: intervalMap[binanceInterval], count: 0 };
        }

        console.log(`✅ Fetched ${candles.length} ${binanceInterval} candles from CoinGecko`);

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

