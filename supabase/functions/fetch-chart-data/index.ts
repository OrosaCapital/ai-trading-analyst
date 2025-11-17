import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TrendType = 'bullish' | 'bearish' | 'neutral';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sentiment: number;
  rsi: number;
  oi?: number;
}

interface VolumeBubble {
  time: number;
  volume: number;
  type: 'buy' | 'sell';
  size: 'small' | 'medium' | 'large';
}

interface TrendAnalysis {
  trend: TrendType;
  confidence: number;
  emaScore: number;
  momentumScore: number;
  structureScore: number;
  sentimentScore: number;
  higherHighs: number;
  higherLows: number;
  lowerHighs: number;
  lowerLows: number;
  breakOfStructure: boolean;
}

interface SetupScore {
  volumeBubbleAlign: boolean;
  oiExpanding: boolean;
  rsiZone: boolean;
  emotionalShift: boolean;
  bosConfirmed: boolean;
  pullbackValid: boolean;
  consolidationBreak: boolean;
  totalScore: number;
  isValid: boolean;
}

interface TradingSignal {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  strength: number;
  reason: string;
  valid: boolean;
  rsi: number;
  setupScore?: SetupScore;
}

interface EntryValidation {
  microBOS: boolean;
  candlePattern: string | null;
  volumeConfirm: boolean;
  bubbleBurst: boolean;
  momentumFlip: boolean;
  wrFormation: boolean;
  aiConfidence: number;
  aiTrigger: 'BUY' | 'SELL' | 'WAIT';
  entryScore: number;
}

interface MicroConfirmation {
  breakoutConfirmed: boolean;
  volumeSustained: boolean;
  momentumContinues: boolean;
  confirmationScore: number;
  recommendation: 'ENTER NOW' | 'WAIT' | 'SKIP';
}

interface EntryPoint {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  validation?: EntryValidation;
}

function generateMockOHLCV(symbol: string, days: number = 90, intervalMinutes: number = 1440): Candle[] {
  const candles: Candle[] = [];
  const basePrices: Record<string, number> = {
    'BTCUSD': 42000, 'BTC': 42000, 'ETHUSD': 2800, 'ETH': 2800,
    'SOLUSD': 120, 'SOL': 120, 'AAPL': 180, 'TSLA': 240, 'GOOGL': 140,
  };
  
  let currentPrice = basePrices[symbol] || basePrices['BTCUSD'];
  let currentOI = currentPrice * 50000;
  const now = Date.now();
  const interval = intervalMinutes * 60 * 1000;
  const numCandles = Math.floor((days * 24 * 60) / intervalMinutes);
  
  for (let i = numCandles - 1; i >= 0; i--) {
    const time = Math.floor((now - (i * interval)) / 1000);
    const volatility = currentPrice * 0.03;
    const trend = Math.sin(i / 10) * volatility * 0.5;
    const randomWalk = (Math.random() - 0.5) * volatility;
    
    const open = currentPrice;
    const change = trend + randomWalk;
    const close = open + change;
    const high = Math.max(open, close) + Math.abs(change) * Math.random();
    const low = Math.min(open, close) - Math.abs(change) * Math.random();
    
    const baseVolume = currentPrice * 1000;
    const volumeSpike = (i % 13 === 0) ? 2.5 : 1;
    const volume = baseVolume * (0.5 + Math.random()) * volumeSpike;
    
    const oiChange = (close - open) * 100 + (volumeSpike > 2 ? 5000 : 0);
    currentOI = currentOI + oiChange;
    
    const priceChange = close - open;
    const rsi = 50 + (priceChange / volatility) * 20;
    const clampedRSI = Math.max(0, Math.min(100, rsi));
    
    let sentiment = 5;
    if (clampedRSI < 30) sentiment -= 2;
    else if (clampedRSI > 70) sentiment += 2;
    if (volumeSpike > 2) sentiment += (priceChange > 0 ? 1 : -1);
    if (close > open) sentiment += 0.5;
    else sentiment -= 0.5;
    sentiment = Math.max(0, Math.min(10, sentiment));
    
    candles.push({
      time, open: Number(open.toFixed(2)), high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)), close: Number(close.toFixed(2)),
      volume: Math.floor(volume), sentiment: Number(sentiment.toFixed(1)),
      rsi: Number(clampedRSI.toFixed(2)), oi: Math.floor(currentOI),
    });
    
    currentPrice = close;
  }
  
  return candles;
}

function calculateEMA(candles: Candle[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < Math.min(period, candles.length); i++) {
    sum += candles[i].close;
  }
  ema.push(sum / period);
  for (let i = period; i < candles.length; i++) {
    ema.push((candles[i].close - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }
  return ema;
}

function calculateMomentum(candles: Candle[]): { roc: number; macd: number; score: number } {
  if (candles.length < 26) return { roc: 0, macd: 0, score: 50 };
  
  const recent = candles.slice(-26);
  const rocPeriod = 14;
  const currentPrice = recent[recent.length - 1].close;
  const pastPrice = recent[recent.length - rocPeriod].close;
  const roc = ((currentPrice - pastPrice) / pastPrice) * 100;
  
  const ema12 = calculateEMA(recent, 12);
  const ema26 = calculateEMA(recent, 26);
  const macd = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  
  let score = 50;
  if (roc > 2 && macd > 0) score = 80;
  else if (roc > 0 && macd > 0) score = 65;
  else if (roc < -2 && macd < 0) score = 20;
  else if (roc < 0 && macd < 0) score = 35;
  
  return { roc, macd, score };
}

function analyzeStructure(candles: Candle[]): { 
  higherHighs: number; 
  higherLows: number; 
  lowerHighs: number; 
  lowerLows: number; 
  score: number;
  bos: boolean;
} {
  if (candles.length < 20) return { higherHighs: 0, higherLows: 0, lowerHighs: 0, lowerLows: 0, score: 50, bos: false };
  
  const recent = candles.slice(-20);
  let higherHighs = 0, higherLows = 0, lowerHighs = 0, lowerLows = 0;
  
  for (let i = 2; i < recent.length; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];
    const prevPrev = recent[i - 2];
    
    if (curr.high > prev.high && prev.high > prevPrev.high) higherHighs++;
    if (curr.low > prev.low && prev.low > prevPrev.low) higherLows++;
    if (curr.high < prev.high && prev.high < prevPrev.high) lowerHighs++;
    if (curr.low < prev.low && prev.low < prevPrev.low) lowerLows++;
  }
  
  const bullishStructure = higherHighs + higherLows;
  const bearishStructure = lowerHighs + lowerLows;
  
  let score = 50;
  if (bullishStructure > bearishStructure * 2) score = 80;
  else if (bullishStructure > bearishStructure) score = 65;
  else if (bearishStructure > bullishStructure * 2) score = 20;
  else if (bearishStructure > bullishStructure) score = 35;
  
  const recentHigh = Math.max(...recent.slice(-5).map(c => c.high));
  const previousHigh = Math.max(...recent.slice(-10, -5).map(c => c.high));
  const bos = recentHigh > previousHigh * 1.02 || recentHigh < previousHigh * 0.98;
  
  return { higherHighs, higherLows, lowerHighs, lowerLows, score, bos };
}

function classifyTrendEnhanced(candles: Candle[], ema50: number[], ema200: number[]): TrendAnalysis {
  if (candles.length < 20) {
    return { trend: 'neutral', confidence: 0, emaScore: 50, momentumScore: 50, structureScore: 50, sentimentScore: 50, higherHighs: 0, higherLows: 0, lowerHighs: 0, lowerLows: 0, breakOfStructure: false };
  }
  
  const recent = candles.slice(-20);
  const currentPrice = recent[recent.length - 1].close;
  const currentEMA50 = ema50[ema50.length - 1];
  const currentEMA200 = ema200[ema200.length - 1];
  
  const priceAboveEMA50 = currentPrice > currentEMA50;
  const ema50AboveEMA200 = currentEMA50 > currentEMA200;
  const emaGap = Math.abs(currentEMA50 - currentEMA200) / currentPrice;
  let emaScore = 50;
  if (priceAboveEMA50 && ema50AboveEMA200 && emaGap > 0.02) emaScore = 85;
  else if (priceAboveEMA50 && ema50AboveEMA200) emaScore = 70;
  else if (!priceAboveEMA50 && !ema50AboveEMA200 && emaGap > 0.02) emaScore = 15;
  else if (!priceAboveEMA50 && !ema50AboveEMA200) emaScore = 30;
  
  const momentum = calculateMomentum(candles);
  const momentumScore = momentum.score;
  
  const structure = analyzeStructure(candles);
  const structureScore = structure.score;
  
  const avgSentiment = recent.reduce((sum, c) => sum + c.sentiment, 0) / recent.length;
  const sentimentScore = (avgSentiment / 10) * 100;
  
  const confidence = (emaScore + momentumScore + structureScore + sentimentScore) / 4;
  
  let trend: TrendType = 'neutral';
  if (confidence > 70 && emaScore > 60 && momentumScore > 60 && structureScore > 60) trend = 'bullish';
  else if (confidence < 30 && emaScore < 40 && momentumScore < 40 && structureScore < 40) trend = 'bearish';
  
  return {
    trend, confidence, emaScore, momentumScore, structureScore, sentimentScore,
    higherHighs: structure.higherHighs, higherLows: structure.higherLows,
    lowerHighs: structure.lowerHighs, lowerLows: structure.lowerLows,
    breakOfStructure: structure.bos,
  };
}

function detectBOS(candles: Candle[], lookback: number = 10): boolean {
  if (candles.length < lookback * 2) return false;
  const recent = candles.slice(-lookback);
  const previous = candles.slice(-lookback * 2, -lookback);
  const recentHigh = Math.max(...recent.map(c => c.high));
  const recentLow = Math.min(...recent.map(c => c.low));
  const prevHigh = Math.max(...previous.map(c => c.high));
  const prevLow = Math.min(...previous.map(c => c.low));
  return recentHigh > prevHigh * 1.015 || recentLow < prevLow * 0.985;
}

function detectPullback(candles: Candle[], ema50: number[]): boolean {
  if (candles.length < 10) return false;
  const recent = candles.slice(-5);
  const recentEMA = ema50.slice(-5);
  let touchedEMA = false;
  for (let i = 0; i < recent.length; i++) {
    if (Math.abs(recent[i].low - recentEMA[i]) / recent[i].low < 0.005) {
      touchedEMA = true;
    }
  }
  return touchedEMA;
}

function detectConsolidationBreak(candles: Candle[]): boolean {
  if (candles.length < 20) return false;
  const recent = candles.slice(-20);
  const highs = recent.slice(0, 15).map(c => c.high);
  const lows = recent.slice(0, 15).map(c => c.low);
  const rangeHigh = Math.max(...highs);
  const rangeLow = Math.min(...lows);
  const rangeSize = (rangeHigh - rangeLow) / rangeLow;
  
  if (rangeSize > 0.05) return false;
  
  const lastCandle = recent[recent.length - 1];
  return lastCandle.close > rangeHigh || lastCandle.close < rangeLow;
}

function detectEmotionalShift(candles: Candle[]): boolean {
  if (candles.length < 10) return false;
  const recent = candles.slice(-10);
  const older = candles.slice(-20, -10);
  const recentAvgSentiment = recent.reduce((s, c) => s + c.sentiment, 0) / recent.length;
  const olderAvgSentiment = older.reduce((s, c) => s + c.sentiment, 0) / older.length;
  return Math.abs(recentAvgSentiment - olderAvgSentiment) > 1.5;
}

function calculateSetupScore(
  candle: Candle,
  candles: Candle[],
  ema50: number[],
  trend1h: TrendType,
  signalType: 'buy' | 'sell'
): SetupScore {
  const idx = candles.indexOf(candle);
  const prevCandles = candles.slice(Math.max(0, idx - 20), idx + 1);
  
  const volumeBubbleAlign = candle.volume > candles.slice(-10).reduce((s, c) => s + c.volume, 0) / 10 * 1.5;
  const oiExpanding = candle.oi && prevCandles.length > 5 ? 
    candle.oi > prevCandles[prevCandles.length - 5].oi! * 1.05 : false;
  const rsiZone = signalType === 'buy' ? candle.rsi < 40 : candle.rsi > 60;
  const emotionalShift = detectEmotionalShift(prevCandles);
  const bosConfirmed = detectBOS(prevCandles);
  const pullbackValid = detectPullback(prevCandles, ema50.slice(0, idx + 1));
  const consolidationBreak = detectConsolidationBreak(prevCandles);
  
  const scores = [volumeBubbleAlign, oiExpanding, rsiZone, emotionalShift, bosConfirmed, pullbackValid, consolidationBreak];
  const totalScore = scores.filter(s => s).length;
  const isValid = totalScore >= 4;
  
  return { volumeBubbleAlign, oiExpanding, rsiZone, emotionalShift, bosConfirmed, pullbackValid, consolidationBreak, totalScore, isValid };
}

function detectSignals(candles: Candle[], ema50Values: number[], trend1h: TrendType): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  for (let i = 20; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];
    
    if (candle.rsi < 35 && prevCandle.rsi >= 35 && candle.close > candle.open) {
      const setupScore = calculateSetupScore(candle, candles.slice(0, i + 1), ema50Values.slice(0, i + 1), trend1h, 'buy');
      const valid = trend1h === 'bullish' && setupScore.isValid;
      signals.push({
        time: candle.time, price: candle.close, type: 'buy',
        strength: Math.min(100, (40 - candle.rsi) * 2.5 + setupScore.totalScore * 5),
        reason: 'RSI Oversold + Bullish Candle',
        valid, rsi: candle.rsi, setupScore,
      });
    }
    
    if (candle.rsi > 65 && prevCandle.rsi <= 65 && candle.close < candle.open) {
      const setupScore = calculateSetupScore(candle, candles.slice(0, i + 1), ema50Values.slice(0, i + 1), trend1h, 'sell');
      const valid = trend1h === 'bearish' && setupScore.isValid;
      signals.push({
        time: candle.time, price: candle.close, type: 'sell',
        strength: Math.min(100, (candle.rsi - 60) * 2.5 + setupScore.totalScore * 5),
        reason: 'RSI Overbought + Bearish Candle',
        valid, rsi: candle.rsi, setupScore,
      });
    }
    
    const distanceToEMA = Math.abs(candle.low - ema50Values[i]) / candle.low;
    if (distanceToEMA < 0.005 && candle.close > candle.open) {
      const setupScore = calculateSetupScore(candle, candles.slice(0, i + 1), ema50Values.slice(0, i + 1), trend1h, 'buy');
      const valid = trend1h === 'bullish' && setupScore.isValid;
      signals.push({
        time: candle.time, price: candle.close, type: 'buy',
        strength: Math.min(100, 60 + setupScore.totalScore * 5),
        reason: 'EMA50 Bounce',
        valid, rsi: candle.rsi, setupScore,
      });
    }
  }
  
  return signals;
}

function detectCandlePattern(candle: Candle, prevCandle: Candle): string | null {
  const body = Math.abs(candle.close - candle.open);
  const prevBody = Math.abs(prevCandle.close - prevCandle.open);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  
  if (lowerShadow > body * 2 && upperShadow < body * 0.5 && candle.close > candle.open) return 'Hammer';
  if (upperShadow > body * 2 && lowerShadow < body * 0.5 && candle.close < candle.open) return 'Shooting Star';
  if (candle.close > candle.open && prevCandle.close < prevCandle.open &&
      candle.open < prevCandle.close && candle.close > prevCandle.open) return 'Bullish Engulfing';
  if (candle.close < candle.open && prevCandle.close > prevCandle.open &&
      candle.open > prevCandle.close && candle.close < prevCandle.open) return 'Bearish Engulfing';
  
  return null;
}

function detectWRFormation(candles: Candle[], type: 'buy' | 'sell'): boolean {
  if (candles.length < 10) return false;
  const recent = candles.slice(-10);
  
  if (type === 'buy') {
    const lows = recent.map((c, i) => ({ price: c.low, idx: i }));
    const sortedLows = [...lows].sort((a, b) => a.price - b.price);
    const firstLow = sortedLows[0];
    const secondLow = sortedLows[1];
    if (Math.abs(firstLow.idx - secondLow.idx) > 3 && Math.abs(firstLow.price - secondLow.price) / firstLow.price < 0.01) {
      return true;
    }
  } else {
    const highs = recent.map((c, i) => ({ price: c.high, idx: i }));
    const sortedHighs = [...highs].sort((a, b) => b.price - a.price);
    const firstHigh = sortedHighs[0];
    const secondHigh = sortedHighs[1];
    if (Math.abs(firstHigh.idx - secondHigh.idx) > 3 && Math.abs(firstHigh.price - secondHigh.price) / firstHigh.price < 0.01) {
      return true;
    }
  }
  return false;
}

function calculateEntryValidation(
  candle: Candle,
  prevCandle: Candle,
  candles: Candle[],
  signalType: 'buy' | 'sell'
): EntryValidation {
  const microBOS = detectBOS(candles.slice(-5), 3);
  const candlePattern = detectCandlePattern(candle, prevCandle);
  const avgVolume = candles.slice(-10).reduce((s, c) => s + c.volume, 0) / 10;
  const volumeConfirm = candle.volume > avgVolume * 1.5;
  
  const bubbleBurst = candle.volume > avgVolume * 2 && 
    ((signalType === 'buy' && candle.close > candle.open) || 
     (signalType === 'sell' && candle.close < candle.open));
  
  const recent5 = candles.slice(-5);
  const momentum = recent5[recent5.length - 1].close - recent5[0].close;
  const momentumFlip = signalType === 'buy' ? momentum > 0 : momentum < 0;
  
  const wrFormation = detectWRFormation(candles, signalType);
  
  const validations = [microBOS, !!candlePattern, volumeConfirm, bubbleBurst, momentumFlip, wrFormation];
  const entryScore = validations.filter(v => v).length;
  const aiConfidence = Math.min(100, entryScore * 16.67 + 20);
  
  let aiTrigger: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
  if (entryScore >= 4) {
    aiTrigger = signalType === 'buy' ? 'BUY' : 'SELL';
  }
  
  return { microBOS, candlePattern, volumeConfirm, bubbleBurst, momentumFlip, wrFormation, aiConfidence, aiTrigger, entryScore };
}

function calculateEntryPoints(candles5m: Candle[], signals15m: TradingSignal[], ema50_5m: number[]): EntryPoint[] {
  const entryPoints: EntryPoint[] = [];
  const validSignals = signals15m.filter(s => s.valid);
  
  for (const signal of validSignals) {
    const signalTime = signal.time;
    const windowStart = candles5m.findIndex(c => c.time >= signalTime - 900);
    const windowEnd = candles5m.findIndex(c => c.time >= signalTime + 900);
    
    if (windowStart === -1 || windowEnd === -1) continue;
    
    const window = candles5m.slice(windowStart, windowEnd + 1);
    
    for (let i = 1; i < window.length; i++) {
      const candle = window[i];
      const prevCandle = window[i - 1];
      const distanceToEMA = Math.abs(candle.low - ema50_5m[windowStart + i]) / candle.low;
      
      if (signal.type === 'buy' && distanceToEMA < 0.003 && candle.close > candle.open) {
        const allCandles = candles5m.slice(0, windowStart + i + 1);
        const validation = calculateEntryValidation(candle, prevCandle, allCandles, 'buy');
        
        if (validation.entryScore >= 4) {
          const stopLoss = candle.low * 0.996;
          const takeProfit = candle.close * 1.015;
          const riskReward = (takeProfit - candle.close) / (candle.close - stopLoss);
          
          entryPoints.push({
            time: candle.time, price: candle.close, type: 'buy',
            stopLoss, takeProfit, riskReward: Number(riskReward.toFixed(2)),
            validation,
          });
        }
      } else if (signal.type === 'sell' && distanceToEMA < 0.003 && candle.close < candle.open) {
        const allCandles = candles5m.slice(0, windowStart + i + 1);
        const validation = calculateEntryValidation(candle, prevCandle, allCandles, 'sell');
        
        if (validation.entryScore >= 4) {
          const stopLoss = candle.high * 1.004;
          const takeProfit = candle.close * 0.985;
          const riskReward = (candle.close - takeProfit) / (stopLoss - candle.close);
          
          entryPoints.push({
            time: candle.time, price: candle.close, type: 'sell',
            stopLoss, takeProfit, riskReward: Number(riskReward.toFixed(2)),
            validation,
          });
        }
      }
    }
  }
  
  return entryPoints;
}

function calculateMicroConfirmation(candles1m: Candle[], entryPoint: EntryPoint): MicroConfirmation {
  const entryIdx = candles1m.findIndex(c => c.time >= entryPoint.time);
  if (entryIdx === -1 || entryIdx + 3 >= candles1m.length) {
    return { breakoutConfirmed: false, volumeSustained: false, momentumContinues: false, confirmationScore: 0, recommendation: 'WAIT' };
  }
  
  const next3 = candles1m.slice(entryIdx, entryIdx + 3);
  const avgVolume = candles1m.slice(Math.max(0, entryIdx - 10), entryIdx).reduce((s, c) => s + c.volume, 0) / 10;
  
  const breakoutConfirmed = entryPoint.type === 'buy' ?
    next3.every(c => c.close > entryPoint.price * 0.999) :
    next3.every(c => c.close < entryPoint.price * 1.001);
  
  const volumeSustained = next3.every(c => c.volume > avgVolume * 0.8);
  
  const momentumContinues = entryPoint.type === 'buy' ?
    next3[next3.length - 1].close > next3[0].close :
    next3[next3.length - 1].close < next3[0].close;
  
  const confirmations = [breakoutConfirmed, volumeSustained, momentumContinues];
  const confirmationScore = confirmations.filter(c => c).length;
  
  let recommendation: 'ENTER NOW' | 'WAIT' | 'SKIP' = 'WAIT';
  if (confirmationScore === 3) recommendation = 'ENTER NOW';
  else if (confirmationScore === 0) recommendation = 'SKIP';
  
  return { breakoutConfirmed, volumeSustained, momentumContinues, confirmationScore, recommendation };
}

function identifyVolumeBubbles(candles: Candle[]): VolumeBubble[] {
  const bubbles: VolumeBubble[] = [];
  const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
  
  for (const candle of candles) {
    if (candle.volume > avgVolume * 2) {
      const type: 'buy' | 'sell' = candle.close > candle.open ? 'buy' : 'sell';
      let size: 'small' | 'medium' | 'large' = 'medium';
      if (candle.volume > avgVolume * 3) size = 'large';
      else if (candle.volume < avgVolume * 2.5) size = 'small';
      
      bubbles.push({ time: candle.time, volume: candle.volume, type, size });
    }
  }
  
  return bubbles;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTCUSD', days = 7 } = await req.json();
    
    console.log(`Generating multi-timeframe chart data for ${symbol}, ${days} days`);
    
    const candles1h = generateMockOHLCV(symbol, days, 60);
    const candles15m = generateMockOHLCV(symbol, days, 15);
    const candles5m = generateMockOHLCV(symbol, days, 5);
    const candles1m = generateMockOHLCV(symbol, days, 1);
    
    const ema50_1h = calculateEMA(candles1h, 50);
    const ema200_1h = calculateEMA(candles1h, 200);
    const ema50_15m = calculateEMA(candles15m, 50);
    const ema200_15m = calculateEMA(candles15m, 200);
    const ema50_5m = calculateEMA(candles5m, 50);
    const ema200_5m = calculateEMA(candles5m, 200);
    const ema20_1m = calculateEMA(candles1m, 20);
    
    const trendAnalysis1h = classifyTrendEnhanced(candles1h, ema50_1h, ema200_1h);
    const signals15m = detectSignals(candles15m, ema50_15m, trendAnalysis1h.trend);
    const entryPoints5m = calculateEntryPoints(candles5m, signals15m, ema50_5m);
    
    const entryPointsWithConfirmation = entryPoints5m.map(ep => ({
      ...ep,
      microConfirmation: calculateMicroConfirmation(candles1m, ep),
    }));
    
    const volumeBubbles1h = identifyVolumeBubbles(candles1h);
    const volumeBubbles15m = identifyVolumeBubbles(candles15m);
    const volumeBubbles5m = identifyVolumeBubbles(candles5m);
    const volumeBubbles1m = identifyVolumeBubbles(candles1m);
    
    const validSignals = signals15m.filter(s => s.valid).length;
    const invalidSignals = signals15m.filter(s => !s.valid).length;
    
    return new Response(
      JSON.stringify({
        symbol,
        timeframes: {
          '1h': {
            candles: candles1h,
            trend: trendAnalysis1h.trend,
            trendAnalysis: trendAnalysis1h,
            indicators: {
              ema50: ema50_1h.map((value, i) => ({ time: candles1h[i].time, value })),
              ema200: ema200_1h.map((value, i) => ({ time: candles1h[i].time, value })),
            },
            volumeBubbles: volumeBubbles1h,
          },
          '15m': {
            candles: candles15m,
            signals: signals15m,
            indicators: {
              ema50: ema50_15m.map((value, i) => ({ time: candles15m[i].time, value })),
              ema200: ema200_15m.map((value, i) => ({ time: candles15m[i].time, value })),
            },
            volumeBubbles: volumeBubbles15m,
          },
          '5m': {
            candles: candles5m,
            entryPoints: entryPointsWithConfirmation,
            indicators: {
              ema50: ema50_5m.map((value, i) => ({ time: candles5m[i].time, value })),
              ema200: ema200_5m.map((value, i) => ({ time: candles5m[i].time, value })),
            },
            volumeBubbles: volumeBubbles5m,
          },
          '1m': {
            candles: candles1m,
            indicators: {
              ema20: ema20_1m.map((value, i) => ({ time: candles1m[i].time, value })),
            },
            volumeBubbles: volumeBubbles1m,
          },
        },
        metadata: {
          rule: "Never take a 15-min signal if the 1-hour is neutral or against it",
          trend1h: trendAnalysis1h.trend,
          validSignals,
          invalidSignals,
          entryPoints: entryPointsWithConfirmation.length,
          generated_at: Date.now(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating chart data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
