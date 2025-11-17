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

function generateMockOHLCV(symbol: string, days: number = 90): Candle[] {
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
  const interval = 24 * 60 * 60 * 1000; // 1 day
  
  for (let i = days - 1; i >= 0; i--) {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, days = 90 } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Generating mock chart data for ${symbol}, ${days} days`);
    
    // Generate mock OHLCV data
    const candles = generateMockOHLCV(symbol, days);
    
    // Calculate indicators
    const ema50 = calculateEMA(candles, 50);
    const ema200 = calculateEMA(candles, 200);
    
    // Identify volume bubbles
    const volumeBubbles = identifyVolumeBubbles(candles);
    
    // Prepare response
    const response = {
      symbol,
      candles,
      indicators: {
        ema50: ema50.map((value, index) => ({
          time: candles[index + (candles.length - ema50.length)].time,
          value: Number(value.toFixed(2)),
        })),
        ema200: ema200.map((value, index) => ({
          time: candles[index + (candles.length - ema200.length)].time,
          value: Number(value.toFixed(2)),
        })),
      },
      volumeBubbles,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataType: 'mock',
        candleCount: candles.length,
        avgSentiment: Number((candles.reduce((sum, c) => sum + c.sentiment, 0) / candles.length).toFixed(2)),
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
