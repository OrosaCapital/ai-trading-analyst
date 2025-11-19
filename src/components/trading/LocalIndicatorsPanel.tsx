import React from "react";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

interface LocalIndicatorsPanelProps {
  candles: Candle[];
}

export function LocalIndicatorsPanel({ candles }: LocalIndicatorsPanelProps) {
  if (!candles || candles.length < 2) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-[#11131a] rounded-xl text-white text-sm">
        <div className="text-xs text-gray-400">Waiting for price data…</div>
      </div>
    );
  }

  const len = candles.length;
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const lastCandle = candles[len - 1];
  const lastClose = lastCandle.close;

  const ema = (period: number): number | null => {
    if (len < period) {
      const avg = closes.reduce((a, b) => a + b, 0) / len;
      return avg;
    }

    const k = 2 / (period + 1);
    let emaPrev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < len; i++) {
      emaPrev = closes[i] * k + emaPrev * (1 - k);
    }
    return emaPrev;
  };

  const ema9 = ema(9);
  const ema21 = ema(21);
  const ema50 = ema(50);

  const trendScore =
    (ema9 && lastClose > ema9 ? 1 : 0) +
    (ema21 && ema9 && ema9 > ema21 ? 1 : 0) +
    (ema50 && ema21 && ema21 > ema50 ? 1 : 0);

  const priceChange = ((lastClose - closes[0]) / closes[0]) * 100;

  const volWindow = Math.min(20, len);
  const recentVol = volumes.slice(-volWindow);
  const avgVol = recentVol.reduce((a, b) => a + b, 0) / (recentVol.length || 1);
  const volPressure = avgVol > 0 ? volumes[len - 1] / avgVol : 0;

  const rsiPeriod = Math.min(14, len - 1);
  let gain = 0;
  let loss = 0;

  for (let i = len - rsiPeriod; i < len; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  const rs = gain / (loss || 1);
  const rsi = 100 - 100 / (1 + rs);

  const atrPeriod = Math.min(14, len - 1);
  let atrSum = 0;

  for (let i = len - atrPeriod; i < len; i++) {
    const c = candles[i];
    const p = candles[i - 1] ?? candles[i];
    const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
    atrSum += tr;
  }

  const atr = atrSum / (atrPeriod || 1);
  const atrPct = (atr / lastClose) * 100;

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#11131a] rounded-xl text-white text-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs uppercase tracking-wide text-gray-400">Day Trader Snapshot</span>
        <span className="text-[10px] text-gray-500">Local • From chart candles</span>
      </div>

      <Item label="Trend Score (0–3)" value={trendScore} />
      <Item label="Price Change %" value={priceChange.toFixed(2)} />
      <Item label="RSI" value={rsi.toFixed(1)} />
      <Item label="ATR %" value={atrPct.toFixed(2)} />
      <Item label="Volume Pressure" value={volPressure.toFixed(2)} />
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-1.5">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="font-semibold text-xs">{value}</span>
    </div>
  );
}
