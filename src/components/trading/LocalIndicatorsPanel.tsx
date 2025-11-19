import React from "react";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function LocalIndicatorsPanel({ candles }: { candles: Candle[] }) {
  // Always show panel — fallback to placeholders if not enough data
  const safeCandles = candles || [];
  const len = safeCandles.length;

  const closes = safeCandles.map((c) => c.close);
  const volumes = safeCandles.map((c) => c.volume);

  const lastCandle = safeCandles[len - 1] || {
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
  };

  const lastClose = lastCandle.close;

  // --- EMA ---
  const ema = (period: number): number[] => {
    if (len < period) return [];
    const k = 2 / (period + 1);
    const emaArr: number[] = [];

    const sma = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    emaArr[period - 1] = sma;

    for (let i = period; i < closes.length; i++) {
      emaArr[i] = closes[i] * k + emaArr[i - 1] * (1 - k);
    }

    return emaArr;
  };

  const ema20 = ema(20);
  const ema50 = ema(50);
  const ema200 = ema(200);

  const lastE20 = ema20[len - 1] ?? lastClose;
  const lastE50 = ema50[len - 1] ?? lastClose;
  const lastE200 = ema200[len - 1] ?? lastClose;

  const trendScore = (lastClose > lastE20 ? 1 : 0) + (lastE20 > lastE50 ? 1 : 0) + (lastE50 > lastE200 ? 1 : 0);

  // --- RSI 14 ---
  let gain = 0;
  let loss = 0;

  if (len > 15) {
    for (let i = len - 14; i < len; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gain += diff;
      else loss -= diff;
    }
  }

  const rs = gain / (loss || 1);
  const rsi = len > 15 ? 100 - 100 / (1 + rs) : 50;

  // --- Candle Strength ---
  const strength =
    lastCandle.high !== lastCandle.low ? (lastCandle.close - lastCandle.open) / (lastCandle.high - lastCandle.low) : 0;

  // --- ATR 14 ---
  let atr = 0;
  if (len > 15) {
    for (let i = len - 14; i < len; i++) {
      const c = safeCandles[i];
      const p = safeCandles[i - 1] ?? c;

      const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));

      atr += tr;
    }
    atr = atr / 14;
  }

  // --- Volume Pressure ---
  const vol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / (volumes.slice(-20).length || 1);

  const volPressure = vol20 ? volumes[len - 1] / vol20 : 1;

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#11131a] rounded-xl text-white text-sm">
      <Item label="Trend Score (0-3)" value={trendScore} />
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
