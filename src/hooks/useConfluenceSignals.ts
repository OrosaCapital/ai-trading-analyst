import { useMemo } from 'react';
import { Indicator } from '@/utils/indicatorRegistry';
import type { Candle } from '@/lib/indicators';

interface ConfluenceSignal {
  bullishScore: number;
  bearishScore: number;
  buySignal: boolean;
  sellSignal: boolean;
  bullishDivergence: boolean;
  bearishDivergence: boolean;
  trendShift: 'bullish' | 'bearish' | null;
  overbought: boolean;
  oversold: boolean;
  momentumBullish: boolean;
  structureBullish: boolean;
  volumeBullish: boolean;
  ichimokuBullish: boolean;
}

interface ConfluenceSignalsProps {
  candles: Candle[];
  symbol: string;
}

export function useConfluenceSignals({ candles, symbol }: ConfluenceSignalsProps): ConfluenceSignal | null {
  return useMemo(() => {
    if (!candles || candles.length < 50) return null;

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    // Calculate indicators
    const rsi = Indicator.rsi(closes, 14);
    const macd = Indicator.macd(closes, 12, 26, 9);
    const ma20 = Indicator.ema(closes, 20);
    const ma50 = Indicator.ema(closes, 50);
    const momentum = Indicator.momentum(closes, 14);
    const volumeSMA = Indicator.volumeSMA(volumes, 20);
    const ichimoku = Indicator.ichimoku(highs, lows, closes, 9, 26, 52, 26);
    const pivots = Indicator.pivotPoints(highs, lows, 5);
    const divergences = Indicator.rsiDivergence(rsi, closes, pivots.pivotHighs, pivots.pivotLows);

    if (!rsi.length || !macd.macd.length || !ma20.length || !ma50.length) return null;

    const lastIndex = closes.length - 1;

    // Current values
    const currentClose = closes[lastIndex];
    const currentRSI = rsi[lastIndex];
    const currentMACD = macd.histogram[lastIndex];
    const currentMA20 = ma20[lastIndex];
    const currentMA50 = ma50[lastIndex];
    const currentMomentum = momentum[lastIndex];
    const currentVolume = volumes[lastIndex];
    const currentVolumeSMA = volumeSMA[lastIndex];
    const currentLeadSpanA = ichimoku.leadSpanA[lastIndex];
    const currentLeadSpanB = ichimoku.leadSpanB[lastIndex];

    // Trend Analysis
    const macroTrendBullish = currentMA50 > ma50[Math.max(0, lastIndex - 100)] || false;
    const currentTrendBullish = currentClose > currentMA20 && currentMA20 > currentMA50;

    // Momentum
    const momentumBullish = currentMomentum > 0 && currentMomentum > (momentum[lastIndex - 1] || 0);

    // Market Structure (simplified)
    const structureBullish = highs[lastIndex] > highs.slice(-6, -1).reduce((a, b) => Math.max(a, b), 0) &&
                             lows[lastIndex] > lows.slice(-6, -1).reduce((a, b) => Math.max(a, b), 0);

    // Overbought/Oversold
    const overbought = currentRSI > 70;
    const oversold = currentRSI < 30;

    // Volume
    const volumeBullish = currentVolume > currentVolumeSMA && currentClose > closes[lastIndex - 1];

    // Ichimoku
    const ichimokuBullish = currentClose > currentLeadSpanA && currentClose > currentLeadSpanB;

    // Divergences
    const bullishDivergence = divergences.bullishDivergence[lastIndex] || false;
    const bearishDivergence = divergences.bearishDivergence[lastIndex] || false;

    // Trend Shifts
    const ma20CrossUp = ma20[lastIndex] > ma50[lastIndex] && ma20[lastIndex - 1] <= ma50[lastIndex - 1];
    const ma20CrossDown = ma20[lastIndex] < ma50[lastIndex] && ma20[lastIndex - 1] >= ma50[lastIndex - 1];
    const trendShift = ma20CrossUp ? 'bullish' : ma20CrossDown ? 'bearish' : null;

    // Confluence Scoring (out of 6 indicators)
    let bullishScore = 0;
    let bearishScore = 0;

    if (currentTrendBullish) bullishScore++;
    else bearishScore++;

    if (momentumBullish) bullishScore++;
    else bearishScore++;

    if (structureBullish) bullishScore++;
    else bearishScore++;

    if (volumeBullish) bullishScore++;
    else bearishScore++;

    if (ichimokuBullish) bullishScore++;
    else bearishScore++;

    if (currentMACD > 0) bullishScore++;
    else bearishScore++;

    // Signal Generation (requires 3+ confluence)
    const minConfluence = 3;
    const buySignal = (bullishDivergence || trendShift === 'bullish' || (oversold && currentRSI > 30)) &&
                     bullishScore >= minConfluence;

    const sellSignal = (bearishDivergence || trendShift === 'bearish' || (overbought && currentRSI < 70)) &&
                      bearishScore >= minConfluence;

    return {
      bullishScore,
      bearishScore,
      buySignal,
      sellSignal,
      bullishDivergence,
      bearishDivergence,
      trendShift,
      overbought,
      oversold,
      momentumBullish,
      structureBullish,
      volumeBullish,
      ichimokuBullish,
    };
  }, [candles, symbol]);
}