import React from "react";

export function LocalIndicatorsPanel({ candles }: { candles: Array<{ close: number; high: number; low: number; volume: number; open: number }> }) {
  if (!candles || candles.length < 200) return null;

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  // --- EMA ---
  const ema = (period: number) => {
    let k = 2 / (period + 1);
    let emaArr: number[] = [];
    let sma = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    emaArr[period - 1] = sma;
    for (let i = period; i < closes.length; i++)
      emaArr[i] = closes[i] * k + emaArr[i - 1] * (1 - k);
    return emaArr;
  };

  const ema20 = ema(20);
  const ema50 = ema(50);
  const ema200 = ema(200);

  // Trend Score
  const trendScore =
    (closes.at(-1)! > ema20.at(-1)! ? 1 : 0) +
    (ema20.at(-1)! > ema50.at(-1)! ? 1 : 0) +
    (ema50.at(-1)! > ema200.at(-1)! ? 1 : 0);

  // RSI
  let gains = 0, losses = 0;
  const len = closes.length;
  for (let i = len - 14; i < len; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  const rsi = 100 - 100 / (1 + rs);

  // Candle Strength
  const last = candles.at(-1)!;
  const strength = ((last.close - last.open) / (last.high - last.low)) || 0;

  // ATR
  let atr = 0;
  for (let i = len - 14; i < len; i++) {
    const c = candles[i], p = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low - p.close)
    );
    atr += tr;
  }
  atr = atr / 14;

  // Volume Pressure
  const vol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volPressure = volumes.at(-1)! / vol20;

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
