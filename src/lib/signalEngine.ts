// Trading signal generation engine

import { calculateEMASlope } from './indicators';

export interface TradeSignal {
  signal: 'BUY' | 'SELL' | 'NO TRADE';
  confidence: number;
  reasons: string[];
  failedConditions: string[];
  timestamp: number;
}

export interface SignalConditions {
  // 1H timeframe
  price1hAboveEMA: boolean;
  ema1hSlopePositive: boolean;
  rsi1hBullish: boolean;
  
  // 15M timeframe
  price15mAboveEMA: boolean;
  ema15mSlopePositive: boolean;
  rsi15mBullish: boolean;
  
  // Volume
  volumeIncreasing: boolean;
  
  // Coinglass sentiment
  coinglassBullish: boolean;
}

export interface ChartDataForSignal {
  price1h: number;
  ema501h: number[];
  rsi1h: number[];
  
  price15m: number;
  ema5015m: number[];
  rsi15m: number[];
  
  currentVolume: number;
  volumeSMA: number[];
  
  coinglassSentiment: 'bullish' | 'bearish' | 'neutral';
}

export function calculateTradeSignal(data: ChartDataForSignal): TradeSignal {
  const conditions: SignalConditions = {
    price1hAboveEMA: false,
    ema1hSlopePositive: false,
    rsi1hBullish: false,
    price15mAboveEMA: false,
    ema15mSlopePositive: false,
    rsi15mBullish: false,
    volumeIncreasing: false,
    coinglassBullish: false,
  };
  
  const reasons: string[] = [];
  const failedConditions: string[] = [];
  
  // Get latest values
  const currentEMA1h = data.ema501h[data.ema501h.length - 1] || 0;
  const currentEMA15m = data.ema5015m[data.ema5015m.length - 1] || 0;
  const currentRSI1h = data.rsi1h[data.rsi1h.length - 1] || 50;
  const currentRSI15m = data.rsi15m[data.rsi15m.length - 1] || 50;
  const currentVolumeSMA = data.volumeSMA[data.volumeSMA.length - 1] || 0;
  
  // Calculate EMA slopes
  const ema1hSlope = calculateEMASlope(data.ema501h);
  const ema15mSlope = calculateEMASlope(data.ema5015m);
  
  // Check BUY conditions
  conditions.price1hAboveEMA = data.price1h > currentEMA1h;
  conditions.ema1hSlopePositive = ema1hSlope > 0;
  conditions.rsi1hBullish = currentRSI1h > 50;
  
  conditions.price15mAboveEMA = data.price15m > currentEMA15m;
  conditions.ema15mSlopePositive = ema15mSlope > 0;
  conditions.rsi15mBullish = currentRSI15m > 50;
  
  conditions.volumeIncreasing = data.currentVolume > currentVolumeSMA;
  conditions.coinglassBullish = data.coinglassSentiment === 'bullish';
  
  // Evaluate BUY signal
  const buyConditionsMet = [
    conditions.price1hAboveEMA,
    conditions.ema1hSlopePositive,
    conditions.rsi1hBullish,
    conditions.price15mAboveEMA,
    conditions.ema15mSlopePositive,
    conditions.rsi15mBullish,
    conditions.volumeIncreasing,
    conditions.coinglassBullish,
  ];
  
  if (buyConditionsMet.every(c => c)) {
    return {
      signal: 'BUY',
      confidence: 95,
      reasons: [
        '1H trend is bullish (price above 50 EMA, upward slope)',
        '15M confirms bullish momentum',
        `RSI favorable (1H: ${currentRSI1h.toFixed(0)}, 15M: ${currentRSI15m.toFixed(0)})`,
        'Volume increasing above average',
        'Coinglass 4H sentiment supports bullish conditions',
      ],
      failedConditions: [],
      timestamp: Date.now(),
    };
  }
  
  // Check SELL conditions (opposite of BUY)
  const sellConditions = {
    price1hBelowEMA: data.price1h < currentEMA1h,
    ema1hSlopeNegative: ema1hSlope < 0,
    rsi1hBearish: currentRSI1h < 50,
    price15mBelowEMA: data.price15m < currentEMA15m,
    ema15mSlopeNegative: ema15mSlope < 0,
    rsi15mBearish: currentRSI15m < 50,
    volumeIncreasing: data.currentVolume > currentVolumeSMA,
    coinglassBearish: data.coinglassSentiment === 'bearish',
  };
  
  const sellConditionsMet = [
    sellConditions.price1hBelowEMA,
    sellConditions.ema1hSlopeNegative,
    sellConditions.rsi1hBearish,
    sellConditions.price15mBelowEMA,
    sellConditions.ema15mSlopeNegative,
    sellConditions.rsi15mBearish,
    sellConditions.volumeIncreasing,
    sellConditions.coinglassBearish,
  ];
  
  if (sellConditionsMet.every(c => c)) {
    return {
      signal: 'SELL',
      confidence: 95,
      reasons: [
        '1H trend is bearish (price below 50 EMA, downward slope)',
        '15M confirms bearish momentum',
        `RSI favorable (1H: ${currentRSI1h.toFixed(0)}, 15M: ${currentRSI15m.toFixed(0)})`,
        'Volume increasing on red candles',
        'Coinglass 4H sentiment supports bearish conditions',
      ],
      failedConditions: [],
      timestamp: Date.now(),
    };
  }
  
  // NO TRADE - conditions not met
  if (!conditions.price1hAboveEMA || !sellConditions.price1hBelowEMA) {
    failedConditions.push('1H price not clearly above/below 50 EMA');
  }
  if (!conditions.ema1hSlopePositive && !sellConditions.ema1hSlopeNegative) {
    failedConditions.push('1H EMA not trending clearly');
  }
  if (!conditions.rsi1hBullish && !sellConditions.rsi1hBearish) {
    failedConditions.push('1H RSI neutral (near 50)');
  }
  if (!conditions.price15mAboveEMA && !sellConditions.price15mBelowEMA) {
    failedConditions.push('15M price not aligned with 1H');
  }
  if (!conditions.volumeIncreasing) {
    failedConditions.push('Volume below average');
  }
  if (data.coinglassSentiment === 'neutral') {
    failedConditions.push('Coinglass sentiment neutral');
  }
  
  return {
    signal: 'NO TRADE',
    confidence: 0,
    reasons: [],
    failedConditions,
    timestamp: Date.now(),
  };
}
