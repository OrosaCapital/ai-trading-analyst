import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sentiment: number; // 0-10 scale
  rsi: number;
}

interface VolumeBubble {
  time: number;
  volume: number;
  type: 'buy' | 'sell';
  size: 'small' | 'medium' | 'large';
}

interface TradingSignal {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  strength: number;
  reason: string;
  valid: boolean;
  rsi: number;
}

interface EntryPoint {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
}

function generateMockOHLCV(symbol: string, days: number = 90, intervalMinutes: number = 1440): Candle[] {
  const candles: Candle[] = [];
  const basePrices: Record<string, number> = {
    'BTCUSD': 42000,
    'BTC': 42000,
    'ETHUSD': 2800,
    'ETH': 2800,
    'SOLUSD': 120,
    'SOL': 120,
    'AAPL': 180,
    'TSLA': 240,
    'GOOGL': 140,
  };
  
  let currentPrice = basePrices[symbol] || basePrices['BTCUSD'];
  const now = Date.now();
  const interval = intervalMinutes * 60 * 1000;
  const numCandles = Math.floor((days * 24 * 60) / intervalMinutes);
  
  for (let i = numCandles - 1; i >= 0; i--) {
    const time = Math.floor((now - (i * interval)) / 1000);
    
    // Generate realistic price movement
    const volatility = currentPrice * 0.03; // 3% daily volatility
    const trend = Math.sin(i / 10) * volatility * 0.5; // Long-term trend
    const randomWalk = (Math.random() - 0.5) * volatility;
    
    const open = currentPrice;
    const change = trend + randomWalk;
    const close = open + change;
    const high = Math.max(open, close) + Math.abs(change) * Math.random();
    const low = Math.min(open, close) - Math.abs(change) * Math.random();
    
    // Volume with spikes
    const baseVolume = currentPrice * 1000;
    const volumeSpike = (i % 13 === 0) ? 2.5 : 1;
    const volume = baseVolume * (0.5 + Math.random()) * volumeSpike;
    
    // Calculate RSI (simplified)
    const priceChange = close - open;
    const rsi = 50 + (priceChange / volatility) * 20;
    const clampedRSI = Math.max(0, Math.min(100, rsi));
    
    // Calculate sentiment (0-10 scale)
    let sentiment = 5; // Neutral baseline
    
    // RSI contribution
    if (clampedRSI < 30) sentiment -= 2; // Oversold = Fear
    else if (clampedRSI > 70) sentiment += 2; // Overbought = Greed
    
    // Volume contribution
    if (volumeSpike > 2) sentiment += (priceChange > 0 ? 1 : -1);
    
    // Trend contribution
    if (close > open) sentiment += 0.5;
    else sentiment -= 0.5;
    
    // Clamp sentiment to 0-10
    sentiment = Math.max(0, Math.min(10, sentiment));
    
    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(volume),
      sentiment: Number(sentiment.toFixed(1)),
      rsi: Number(clampedRSI.toFixed(2)),
    });
    
    currentPrice = close;
  }
  
  return candles;
}

function calculateEMA(candles: Candle[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < Math.min(period, candles.length); i++) {
    sum += candles[i].close;
  }
  ema.push(sum / period);
  
  // Calculate EMA for rest
  for (let i = period; i < candles.length; i++) {
    const value = (candles[i].close - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }
  
  return ema;
}

function identifyVolumeBubbles(candles: Candle[]): VolumeBubble[] {
  const bubbles: VolumeBubble[] = [];
  const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
  
  for (const candle of candles) {
    if (candle.volume > avgVolume * 2) {
      const isBuy = candle.close > candle.open;
      const volumeRatio = candle.volume / avgVolume;
      
      let size: 'small' | 'medium' | 'large' = 'small';
      if (volumeRatio > 4) size = 'large';
      else if (volumeRatio > 3) size = 'medium';
      
      bubbles.push({
        time: candle.time,
        volume: candle.volume,
        type: isBuy ? 'buy' : 'sell',
        size,
      });
    }
  }
  
  return bubbles;
}

type TrendType = 'bullish' | 'bearish' | 'neutral';

function classifyTrend(candles: Candle[], ema50: number[], ema200: number[]): TrendType {
  if (candles.length === 0 || ema50.length === 0 || ema200.length === 0) return 'neutral';
  
  const recentCandles = candles.slice(-20);
  const currentPrice = recentCandles[recentCandles.length - 1].close;
  const currentEMA50 = ema50[ema50.length - 1];
  const currentEMA200 = ema200[ema200.length - 1];
  
  const priceAboveEMA50 = currentPrice > currentEMA50;
  const ema50AboveEMA200 = currentEMA50 > currentEMA200;
  const priceRising = recentCandles[recentCandles.length - 1].close > recentCandles[0].close;
  
  if (priceAboveEMA50 && ema50AboveEMA200 && priceRising) return 'bullish';
  if (!priceAboveEMA50 && !ema50AboveEMA200 && !priceRising) return 'bearish';
  return 'neutral';
}

function detectSignals(candles: Candle[], ema50Values: number[], trend1h: TrendType): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  for (let i = 50; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];
    const ema50 = ema50Values[i - (candles.length - ema50Values.length)];
    
    if (!ema50) continue;
    
    // RSI Oversold Buy Signal
    if (candle.rsi < 30 && prevCandle.rsi >= 30 && candle.close > candle.open) {
      const signalType = 'buy';
      const valid = trend1h === 'bullish';
      
      signals.push({
        time: candle.time,
        price: candle.close,
        type: signalType,
        strength: 100 - candle.rsi,
        reason: 'RSI Oversold + Bullish Candle',
        valid,
        rsi: candle.rsi,
      });
    }
    
    // RSI Overbought Sell Signal
    if (candle.rsi > 70 && prevCandle.rsi <= 70 && candle.close < candle.open) {
      const signalType = 'sell';
      const valid = trend1h === 'bearish';
      
      signals.push({
        time: candle.time,
        price: candle.close,
        type: signalType,
        strength: candle.rsi - 30,
        reason: 'RSI Overbought + Bearish Candle',
        valid,
        rsi: candle.rsi,
      });
    }
    
    // EMA50 Bounce Buy Signal
    const touchingEMA = Math.abs(candle.low - ema50) < (ema50 * 0.005);
    if (touchingEMA && candle.close > candle.open && candle.close > ema50) {
      const signalType = 'buy';
      const valid = trend1h === 'bullish';
      
      signals.push({
        time: candle.time,
        price: candle.close,
        type: signalType,
        strength: 75,
        reason: 'Bounce off EMA50',
        valid,
        rsi: candle.rsi,
      });
    }
  }
  
  return signals;
}

function calculateEntryPoints(candles5m: Candle[], signals15m: TradingSignal[], ema50_5m: number[]): EntryPoint[] {
  const entries: EntryPoint[] = [];
  
  const validSignals = signals15m.filter(s => s.valid);
  
  for (const signal of validSignals) {
    const signalTime = signal.time;
    const next5mCandles = candles5m.filter(c => c.time >= signalTime && c.time < signalTime + 3600);
    
    for (let i = 0; i < next5mCandles.length; i++) {
      const candle = next5mCandles[i];
      const ema50 = ema50_5m[candles5m.indexOf(candle) - (candles5m.length - ema50_5m.length)];
      
      if (!ema50) continue;
      
      if (signal.type === 'buy') {
        const pullbackToEMA = Math.abs(candle.low - ema50) < (ema50 * 0.003);
        const bounceConfirm = candle.close > candle.open && candle.close > ema50;
        
        if (pullbackToEMA && bounceConfirm && candle.volume > candles5m.reduce((sum, c) => sum + c.volume, 0) / candles5m.length * 1.2) {
          const stopLoss = candle.low * 0.99;
          const takeProfit = candle.close + (candle.close - stopLoss) * 2.5;
          
          entries.push({
            time: candle.time,
            price: candle.close,
            type: 'buy',
            stopLoss,
            takeProfit,
            riskReward: 2.5,
          });
          break;
        }
      } else {
        const rallyToEMA = Math.abs(candle.high - ema50) < (ema50 * 0.003);
        const rejectConfirm = candle.close < candle.open && candle.close < ema50;
        
        if (rallyToEMA && rejectConfirm && candle.volume > candles5m.reduce((sum, c) => sum + c.volume, 0) / candles5m.length * 1.2) {
          const stopLoss = candle.high * 1.01;
          const takeProfit = candle.close - (stopLoss - candle.close) * 2.5;
          
          entries.push({
            time: candle.time,
            price: candle.close,
            type: 'sell',
            stopLoss,
            takeProfit,
            riskReward: 2.5,
          });
          break;
        }
      }
    }
  }
  
  return entries;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, days = 7 } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Generating multi-timeframe chart data for ${symbol}, ${days} days`);
    
    // Generate data for all three timeframes
    const candles1h = generateMockOHLCV(symbol, days, 60);
    const candles15m = generateMockOHLCV(symbol, days, 15);
    const candles5m = generateMockOHLCV(symbol, days, 5);
    
    // Calculate indicators for 1H (trend)
    const ema50_1h = calculateEMA(candles1h, 50);
    const ema200_1h = calculateEMA(candles1h, 200);
    const trend1h = classifyTrend(candles1h, ema50_1h, ema200_1h);
    
    // Calculate indicators for 15M (signals)
    const ema50_15m = calculateEMA(candles15m, 50);
    const ema200_15m = calculateEMA(candles15m, 200);
    const signals15m = detectSignals(candles15m, ema50_15m, trend1h);
    
    // Calculate indicators for 5M (entries)
    const ema50_5m = calculateEMA(candles5m, 50);
    const ema200_5m = calculateEMA(candles5m, 200);
    const entryPoints5m = calculateEntryPoints(candles5m, signals15m, ema50_5m);
    
    // Volume bubbles for each timeframe
    const volumeBubbles1h = identifyVolumeBubbles(candles1h);
    const volumeBubbles15m = identifyVolumeBubbles(candles15m);
    const volumeBubbles5m = identifyVolumeBubbles(candles5m);
    
    // Prepare multi-timeframe response
    const response = {
      symbol,
      timeframes: {
        '1h': {
          candles: candles1h,
          trend: trend1h,
          indicators: {
            ema50: ema50_1h.map((value, index) => ({
              time: candles1h[index + (candles1h.length - ema50_1h.length)].time,
              value: Number(value.toFixed(2)),
            })),
            ema200: ema200_1h.map((value, index) => ({
              time: candles1h[index + (candles1h.length - ema200_1h.length)].time,
              value: Number(value.toFixed(2)),
            })),
          },
          volumeBubbles: volumeBubbles1h,
        },
        '15m': {
          candles: candles15m,
          signals: signals15m,
          indicators: {
            ema50: ema50_15m.map((value, index) => ({
              time: candles15m[index + (candles15m.length - ema50_15m.length)].time,
              value: Number(value.toFixed(2)),
            })),
            ema200: ema200_15m.map((value, index) => ({
              time: candles15m[index + (candles15m.length - ema200_15m.length)].time,
              value: Number(value.toFixed(2)),
            })),
          },
          volumeBubbles: volumeBubbles15m,
        },
        '5m': {
          candles: candles5m,
          entryPoints: entryPoints5m,
          indicators: {
            ema50: ema50_5m.map((value, index) => ({
              time: candles5m[index + (candles5m.length - ema50_5m.length)].time,
              value: Number(value.toFixed(2)),
            })),
            ema200: ema200_5m.map((value, index) => ({
              time: candles5m[index + (candles5m.length - ema200_5m.length)].time,
              value: Number(value.toFixed(2)),
            })),
          },
          volumeBubbles: volumeBubbles5m,
        },
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataType: 'mock',
        rule: 'Never take 15m signal if 1h is neutral or against it',
        trend1h,
        validSignals: signals15m.filter(s => s.valid).length,
        invalidSignals: signals15m.filter(s => !s.valid).length,
        entryPoints: entryPoints5m.length,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-chart-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
