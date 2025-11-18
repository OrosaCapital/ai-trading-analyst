// Local trading signal generation engine (0 credits)
// This replicates the logic from src/lib/signalEngine.ts for edge functions

export interface TradeSignal {
  signal: 'BUY' | 'SELL' | 'NO TRADE';
  confidence: number;
  reasons: string[];
  failedConditions: string[];
  timestamp: number;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
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

function calculateEMASlope(ema: number[], lookback: number = 5): number {
  if (ema.length < lookback + 1) return 0;
  
  const recent = ema.slice(-lookback);
  let totalChange = 0;
  
  for (let i = 1; i < recent.length; i++) {
    totalChange += recent[i] - recent[i - 1];
  }
  
  return totalChange / lookback;
}

export function calculateLocalTradeSignal(data: ChartDataForSignal): TradeSignal {
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
  const buyConditions = {
    price1hAboveEMA: data.price1h > currentEMA1h,
    ema1hSlopePositive: ema1hSlope > 0,
    rsi1hBullish: currentRSI1h > 50,
    price15mAboveEMA: data.price15m > currentEMA15m,
    ema15mSlopePositive: ema15mSlope > 0,
    rsi15mBullish: currentRSI15m > 50,
    volumeIncreasing: data.currentVolume > currentVolumeSMA,
    coinglassBullish: data.coinglassSentiment === 'bullish',
  };
  
  const buyConditionsMet = Object.values(buyConditions).every(c => c);
  
  if (buyConditionsMet) {
    const entry = data.price1h;
    const stopLoss = entry * 0.97; // 3% stop loss
    const takeProfit = entry * 1.06; // 6% take profit
    
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
      entry_price: entry,
      stop_loss: stopLoss,
      take_profit: takeProfit,
    };
  }
  
  // Check SELL conditions
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
  
  const sellConditionsMet = Object.values(sellConditions).every(c => c);
  
  if (sellConditionsMet) {
    const entry = data.price1h;
    const stopLoss = entry * 1.03; // 3% stop loss (higher for short)
    const takeProfit = entry * 0.94; // 6% take profit (lower for short)
    
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
      entry_price: entry,
      stop_loss: stopLoss,
      take_profit: takeProfit,
    };
  }
  
  // NO TRADE - conditions not met
  if (!buyConditions.price1hAboveEMA && !sellConditions.price1hBelowEMA) {
    failedConditions.push('1H price not clearly above/below 50 EMA');
  }
  if (!buyConditions.ema1hSlopePositive && !sellConditions.ema1hSlopeNegative) {
    failedConditions.push('1H EMA not trending clearly');
  }
  if (!buyConditions.rsi1hBullish && !sellConditions.rsi1hBearish) {
    failedConditions.push('1H RSI neutral (near 50)');
  }
  if (!buyConditions.volumeIncreasing) {
    failedConditions.push('Volume below average');
  }
  if (data.coinglassSentiment === 'neutral') {
    failedConditions.push('Coinglass sentiment neutral');
  }
  
  return {
    signal: 'NO TRADE',
    confidence: 0,
    reasons: ['Market conditions are mixed. Multiple conflicting signals detected.'],
    failedConditions,
    timestamp: Date.now(),
  };
}
