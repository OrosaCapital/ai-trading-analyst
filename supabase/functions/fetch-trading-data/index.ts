import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceLog {
  timestamp: string;
  price: number;
  volume: number;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Build 1hr candles from 1m logs
function build1hrCandles(logs1m: PriceLog[]): Candle[] {
  const hourlyCandles: Candle[] = [];
  
  for (let i = 0; i < logs1m.length; i += 60) {
    const chunk = logs1m.slice(i, i + 60);
    if (chunk.length < 60) break; // Need full hour
    
    hourlyCandles.push({
      time: Math.floor(new Date(chunk[0].timestamp).getTime() / 1000),
      open: chunk[0].price,
      high: Math.max(...chunk.map(c => c.price)),
      low: Math.min(...chunk.map(c => c.price)),
      close: chunk[chunk.length - 1].price,
      volume: chunk.reduce((sum, c) => sum + c.volume, 0)
    });
  }
  
  return hourlyCandles;
}

// Calculate EMA 50
function calculateEMA50(prices: number[]): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (50 + 1);
  
  // Start with SMA for first value
  const sma = prices.slice(0, 50).reduce((sum, p) => sum + p, 0) / 50;
  ema.push(sma);
  
  // Calculate EMA for rest
  for (let i = 50; i < prices.length; i++) {
    const newEma = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(newEma);
  }
  
  return ema;
}

// Fetch CoinGlass metric with cache
async function fetchCoinglassMetric(
  supabase: any,
  symbol: string,
  metricType: string,
  fetchFunction: string
): Promise<any> {
  // Check cache first (4hr expiry)
  const { data: cached } = await supabase
    .from('coinglass_metrics_cache')
    .select('*')
    .eq('symbol', symbol)
    .eq('metric_type', metricType)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached) {
    console.log(`✅ Cache hit for ${metricType}`);
    return cached.data;
  }

  // Fetch fresh data
  console.log(`📡 Fetching ${metricType} from CoinGlass...`);
  const { data: freshData, error } = await supabase.functions.invoke(fetchFunction, {
    body: { symbol }
  });

  if (error || !freshData) {
    console.error(`Failed to fetch ${metricType}:`, error);
    return null;
  }

  // Cache for 4 hours
  await supabase.from('coinglass_metrics_cache').insert({
    symbol,
    metric_type: metricType,
    data: freshData,
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  });

  return freshData;
}

// Check for liquidity sweep (major liquidations in last hour)
async function checkLiquiditySweep(liquidations: any): Promise<any> {
  if (!liquidations || !liquidations.data) {
    return { swept: false, direction: 'none', amount: 0 };
  }

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentLiqs = (liquidations.data || []).filter((l: any) => 
    new Date(l.timestamp).getTime() > oneHourAgo
  );

  const totalLongLiqs = recentLiqs
    .filter((l: any) => l.side === 'long' || l.type === 'long')
    .reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
    
  const totalShortLiqs = recentLiqs
    .filter((l: any) => l.side === 'short' || l.type === 'short')
    .reduce((sum: number, l: any) => sum + (l.amount || 0), 0);

  const threshold = 10_000_000; // $10M threshold

  if (totalLongLiqs > threshold) {
    return { swept: true, direction: 'long', amount: totalLongLiqs };
  }
  if (totalShortLiqs > threshold) {
    return { swept: true, direction: 'short', amount: totalShortLiqs };
  }

  return { swept: false, direction: 'none', amount: 0 };
}

// Calculate volume strength based on volume-to-market-cap ratio
function calculateVolumeStrength(volume24h: number, marketCap: number): string {
  if (!volume24h || !marketCap) return 'UNKNOWN';
  
  const volumeToMcapRatio = volume24h / marketCap;
  
  if (volumeToMcapRatio > 0.15) return 'EXTREME';
  if (volumeToMcapRatio > 0.08) return 'HIGH';
  if (volumeToMcapRatio > 0.03) return 'NORMAL';
  return 'LOW';
}

// Analyze price-volume correlation
function analyzePriceVolumeCorrelation(
  priceChange24h: number | undefined,
  priceChange1h: number | undefined
): string {
  if (priceChange24h === undefined) return 'UNKNOWN';
  
  // Positive correlation: price up = bullish confirmation
  // Negative: price down = bearish pressure
  if (priceChange24h > 2) return 'STRONG_BULLISH';
  if (priceChange24h > 0) return 'BULLISH_CONFIRMATION';
  if (priceChange24h < -2) return 'STRONG_BEARISH';
  if (priceChange24h < 0) return 'BEARISH_PRESSURE';
  return 'NEUTRAL';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`🔄 Fetching trading data for ${symbol}...`);

    // 1. Check if we have enough data (15 minutes of 1m logs)
    const { count } = await supabase
      .from('tatum_price_logs')
      .select('id', { count: 'exact', head: true })
      .eq('symbol', symbol)
      .eq('interval', '1m');

    if (!count || count < 15) {
      console.log(`⚠️ Insufficient data: ${count || 0}/15 minutes. Attempting API Ninjas backfill...`);
      
      // Try to backfill historical data from API Ninjas
      try {
        const { data: backfillResult, error: backfillError } = await supabase.functions.invoke(
          'fetch-historical-prices',
          { body: { symbol, lookback_hours: 24 } }
        );

        if (backfillError) {
          console.error('❌ Backfill error:', backfillError);
        } else if (backfillResult?.success) {
          console.log(`✅ Backfilled ${backfillResult.records_added} records using ${backfillResult.api_calls_used} API calls`);
          
          // Re-check data availability after backfill
          const { count: newCount } = await supabase
            .from('tatum_price_logs')
            .select('id', { count: 'exact', head: true })
            .eq('symbol', symbol)
            .eq('interval', '1m');

          if (newCount && newCount >= 15) {
            console.log(`🎉 Sufficient data now available (${newCount} minutes), proceeding with analysis...`);
            // Don't return early - continue to analysis below
          } else {
            console.log(`⏳ Still insufficient data after backfill (${newCount || 0}/15), will accumulate naturally`);
            return new Response(JSON.stringify({
              status: 'accumulating',
              message: `Collecting data... ${newCount || 0}/15 minutes`,
              progress: ((newCount || 0) / 15) * 100
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          console.log('⏳ Backfill not successful, falling back to accumulation');
          return new Response(JSON.stringify({
            status: 'accumulating',
            message: `Collecting data... ${count || 0}/15 minutes`,
            progress: ((count || 0) / 15) * 100
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (backfillException) {
        console.error('❌ Exception during backfill:', backfillException);
        return new Response(JSON.stringify({
          status: 'accumulating',
          message: `Collecting data... ${count || 0}/15 minutes`,
          progress: ((count || 0) / 15) * 100
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Fetch price logs for all intervals
    const [logs1m, logs5m, logs10m, logs15m] = await Promise.all([
      supabase.from('tatum_price_logs').select('*').eq('symbol', symbol).eq('interval', '1m').order('timestamp', { ascending: false }).limit(60),
      supabase.from('tatum_price_logs').select('*').eq('symbol', symbol).eq('interval', '5m').order('timestamp', { ascending: false }).limit(12),
      supabase.from('tatum_price_logs').select('*').eq('symbol', symbol).eq('interval', '10m').order('timestamp', { ascending: false }).limit(6),
      supabase.from('tatum_price_logs').select('*').eq('symbol', symbol).eq('interval', '15m').order('timestamp', { ascending: false }).limit(4),
    ]);

    const priceData1m = (logs1m.data || []).reverse();
    const priceData5m = (logs5m.data || []).reverse();
    const priceData10m = (logs10m.data || []).reverse();
    const priceData15m = (logs15m.data || []).reverse();

    // 3. Build 1hr candles from 1m logs
    const candles1h = build1hrCandles(priceData1m);

    // 4. Calculate EMAs
    const prices5m = priceData5m.map((p: any) => p.price);
    const prices15m = priceData15m.map((p: any) => p.price);
    const prices1h = candles1h.map(c => c.close);

    const ema5m = prices5m.length >= 50 ? calculateEMA50(prices5m) : [];
    const ema15m = prices15m.length >= 50 ? calculateEMA50(prices15m) : [];
    const ema1h = prices1h.length >= 50 ? calculateEMA50(prices1h) : [];

    // 5. Fetch CoinGlass metrics (with 4hr cache)
    const [funding, openInterest, liquidations, longShort, takerVolume] = await Promise.all([
      fetchCoinglassMetric(supabase, symbol, 'funding', 'fetch-funding-rate'),
      fetchCoinglassMetric(supabase, symbol, 'openinterest', 'fetch-open-interest'),
      fetchCoinglassMetric(supabase, symbol, 'liquidations', 'fetch-liquidations'),
      fetchCoinglassMetric(supabase, symbol, 'longshort', 'fetch-long-short-ratio'),
      fetchCoinglassMetric(supabase, symbol, 'takervolume', 'fetch-taker-volume'),
    ]);

    // 6. Fetch CMC market data for volume analysis
    console.log('📊 Fetching CMC volume data...');
    const { data: cmcData, error: cmcError } = await supabase.functions.invoke('fetch-cmc-data', {
      body: { symbol }
    });

    if (cmcError) {
      console.error('CMC fetch error:', cmcError);
    }

    // 7. Calculate volume analysis
    const volumeAnalysis = {
      volume24h: cmcData?.volume24h || 0,
      volumeUSD: cmcData?.volume24h || 0,
      volumeTrend: cmcData?.percentChange24h ? 
        (cmcData.percentChange24h > 0 ? 'increasing' : 'decreasing') : 'neutral',
      volumeStrength: calculateVolumeStrength(cmcData?.volume24h, cmcData?.marketCap),
      priceVolumeCorrelation: analyzePriceVolumeCorrelation(
        cmcData?.percentChange24h,
        cmcData?.percentChange1h
      )
    };

    console.log('📊 Volume Analysis:', {
      volume24h: `$${(volumeAnalysis.volume24h / 1e9).toFixed(2)}B`,
      strength: volumeAnalysis.volumeStrength,
      correlation: volumeAnalysis.priceVolumeCorrelation
    });

    // 8. Check liquidity sweep
    const liquiditySweep = await checkLiquiditySweep(liquidations);

    // 9. Fetch historical analysis for context (last 10 analyses)
    console.log('📚 Fetching historical analysis...');
    const { data: historicalAnalyses, error: historyError } = await supabase
      .from('ai_analysis_history')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Error fetching history:', historyError);
    }

    const recentHistory = (historicalAnalyses || []).map((h: any) => ({
      timestamp: h.timestamp,
      decision: h.decision,
      confidence: h.confidence,
      price: h.price_at_analysis,
      summary: {
        trend: h.trend_analysis,
        volume: h.volume_analysis,
        liquidity: h.liquidity_analysis,
        coinglass: h.coinglass_analysis
      }
    }));

    console.log(`📚 Found ${recentHistory.length} past analyses for context`);

    // 10. Call AI Decision Engine
    const currentPrice = priceData1m[priceData1m.length - 1]?.price || 0;
    
    const aiInput = {
      symbol,
      currentPrice,
      priceHistory: {
        '1m': priceData1m.slice(-15),
        '5m': priceData5m.slice(-3),
        '10m': priceData10m.slice(-2),
        '15m': priceData15m.slice(-1),
        '1h': candles1h.slice(-4)
      },
      emas: { '5m': ema5m, '15m': ema15m, '1h': ema1h },
      coinglass: { funding, openInterest, liquidations, longShort, takerVolume },
      liquiditySweep,
      volumeData: {
        cmc: {
          volume24h: cmcData?.volume24h || 0,
          percentChange1h: cmcData?.percentChange1h || 0,
          percentChange24h: cmcData?.percentChange24h || 0,
          marketCap: cmcData?.marketCap || 0,
        },
        analysis: volumeAnalysis
      },
      historicalContext: {
        recentAnalyses: recentHistory,
        analysisCount: recentHistory.length
      }
    };

    console.log('🤖 Calling AI Decision Engine...');
    const { data: aiDecision, error: aiError } = await supabase.functions.invoke('ai-trading-decision', {
      body: aiInput
    });

    if (aiError) {
      console.error('AI Decision Engine error:', aiError);
    }

    const finalDecision = aiDecision || {
      decision: 'NO TRADE',
      confidence: 0,
      summary: {
        trend: 'AI unavailable',
        volume: 'AI unavailable',
        liquidity: 'AI unavailable',
        coinglass: 'AI unavailable',
        entryTrigger: 'AI unavailable'
      },
      action: {
        entry: null,
        stopLoss: null,
        takeProfit: null,
        reason: 'AI service unavailable'
      }
    };

    // 11. Store AI signal in database
    await supabase.from('ai_trading_signals').insert({
      symbol,
      decision: finalDecision.decision,
      confidence: finalDecision.confidence,
      entry_price: finalDecision.action.entry,
      stop_loss: finalDecision.action.stopLoss,
      take_profit: finalDecision.action.takeProfit,
      reasoning: finalDecision,
      trend_explanation: finalDecision.summary.trend,
      volume_explanation: finalDecision.summary.volume,
      liquidity_explanation: finalDecision.summary.liquidity,
      coinglass_explanation: finalDecision.summary.coinglass,
      entry_trigger_explanation: finalDecision.summary.entryTrigger
    });

    // 12. Store analysis in history for future reference
    await supabase.from('ai_analysis_history').insert({
      symbol,
      decision: finalDecision.decision,
      confidence: finalDecision.confidence,
      price_at_analysis: currentPrice,
      trend_analysis: finalDecision.summary.trend,
      volume_analysis: finalDecision.summary.volume,
      liquidity_analysis: finalDecision.summary.liquidity,
      coinglass_analysis: finalDecision.summary.coinglass,
      entry_trigger_analysis: finalDecision.summary.entryTrigger,
      full_reasoning: finalDecision
    });

    console.log('✅ Analysis logged to history');

    // 10. Return everything to frontend
    return new Response(JSON.stringify({
      status: 'ready',
      aiSignal: finalDecision,
      priceData: {
        '1m': priceData1m,
        '5m': priceData5m,
        '10m': priceData10m,
        '15m': priceData15m,
        '1h': candles1h
      },
      emas: { '5m': ema5m, '15m': ema15m, '1h': ema1h },
      coinglass: { funding, openInterest, liquidations, longShort, takerVolume },
      liquiditySweep,
      volumeData: volumeAnalysis,
      currentPrice,
      lastUpdate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-trading-data:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
