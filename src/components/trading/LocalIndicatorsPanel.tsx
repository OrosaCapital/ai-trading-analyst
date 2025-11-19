import React from "react";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function LocalIndicatorsPanel({ candles }: { candles: Candle[] }) {
  if (!candles || candles.length < 50) return null;

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const len = closes.length;

  const lastClose = closes[len - 1];
  const lastCandle = candles[len - 1];

  const ema = (period: number): number | null => {
    if (len < period) return null;
    const k = 2 / (period + 1);
    let emaPrev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < len; i++) {
      emaPrev = closes[i] * k + emaPrev * (1 - k);
    }
    return emaPrev;
  };

  const ema20 = ema(20);
  const ema50 = ema(50);

  const trendScore = (lastClose > (ema20 ?? Infinity) ? 1 : 0) + ((ema20 ?? Infinity) > (ema50 ?? Infinity) ? 1 : 0);

  let gain = 0,
    loss = 0;
  for (let i = len - 14; i < len; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }
  const rs = gain / (loss || 1);
  const rsi = 100 - 100 / (1 + rs);

  const strength =
    lastCandle && lastCandle.high !== lastCandle.low
      ? (lastCandle.close - lastCandle.open) / (lastCandle.high - lastCandle.low)
      : 0;

  let atrSum = 0;
  for (let i = len - 14; i < len; i++) {
    const c = candles[i];
    const p = candles[i - 1] ?? candles[i];
    const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
    atrSum += tr;
  }
  const atr = atrSum / 14;

  const vol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volPressure = vol20 ? volumes[len - 1] / vol20 : 0;

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#11131a] rounded-xl text-white text-sm">
      <Item label="Trend Score (0-2)" value={trendScore} />
      <Item label="EMA20" value={ema20?.toFixed(2) ?? "—"} />
      <Item label="EMA50" value={ema50?.toFixed(2) ?? "—"} />
      <Item label="RSI-14" value={rsi.toFixed(2)} />
      <Item label="Candle Strength" value={strength.toFixed(2)} />
      <Item label="ATR-14" value={atr.toFixed(5)} />
      <Item label="Volume Pressure" value={volPressure.toFixed(2)} />
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export { LocalIndicatorsPanel as SimpleIndicatorPanel };
