export interface MockAIAnalysis {
  decision: 'LONG' | 'SHORT' | 'NO TRADE';
  confidence: number;
  summary: {
    trend: string;
    volume: string;
    liquidity: string;
    coinglass: string;
    entryTrigger: string;
  };
  action: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    reason: string;
  };
}

export const mockAIAnalysis: MockAIAnalysis = {
  decision: 'LONG',
  confidence: 92,
  summary: {
    trend: 'Strong bullish momentum detected across multiple timeframes. Price breaking above key resistance levels with increasing volume.',
    volume: 'Volume surge of 34% above average indicating strong buyer interest. Large institutional orders detected.',
    liquidity: 'High liquidity at current levels. Depth analysis shows strong support at $68,500 and $67,800.',
    coinglass: 'Funding rate positive at 0.0082%. Open Interest up 4.8%. Long/Short ratio favors bulls at 52/48.',
    entryTrigger: 'Price confirmed breakout above $69,000 resistance with RSI at 67 (not overbought). EMA50 crossed above EMA200.'
  },
  action: {
    entry: 69700,
    stopLoss: 68200,
    takeProfit: 72500,
    reason: 'Strong bullish setup with multiple confirmations. Risk/Reward ratio of 1:1.87 is favorable.'
  }
};

export const mockSentiment = {
  overall: 'Bullish',
  score: 85,
  socialVolume: 'High',
  newsImpact: 'Positive',
  fearGreedIndex: 72
};
