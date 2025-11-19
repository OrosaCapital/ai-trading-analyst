import React, { useMemo } from "react";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

interface Props {
  candles: Candle[];
}

export function LocalIndicatorsPanel({ candles }: Props) {
  if (!candles || candles.length < 2) {
    return (
      <div className="p-4 bg-[#11131a] rounded-xl text-white text-sm">
        <div className="text-xs text-gray-400">Collecting chart data...</div>
      </div>
    );
  }

  const len = candles.length;
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const last = candles[len - 1];
  const prev = candles[len - 2];

  const ema = (period: number) => {
    const k = 2 / (period + 1);
    let e = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < len; i++) e = closes[i] * k + e * (1 - k);
    return e;
  };

  const e9 = ema(9);
  const e21 = ema(21);
  const e50 = ema(50);

  const trendScore = (last.close > e9 ? 1 : 0) + (e9 > e21 ? 1 : 0) + (e21 > e50 ? 1 : 0);

  const trendColor = trendScore === 3 ? "text-green-400" : trendScore === 2 ? "text-yellow-400" : "text-red-400";

  const priceChange = ((last.close - closes[0]) / closes[0]) * 100;

  const rsi = (() => {
    let gain = 0,
      loss = 0;
    for (let i = len - 14; i < len; i++) {
      const d = closes[i] - closes[i - 1];
      if (d > 0) gain += d;
      else loss -= d;
    }
    const rs = gain / (loss || 1);
    return 100 - 100 / (1 + rs);
  })();

  const rsiColor = rsi > 70 ? "text-red-400" : rsi < 30 ? "text-green-400" : "text-white";

  const volWindow = Math.min(len, 20);
  const avgVol = volumes.slice(-volWindow).reduce((a, b) => a + b, 0) / (volWindow || 1);
  const volPressure = avgVol ? volumes[len - 1] / avgVol : 0;

  const atr = (() => {
    let sum = 0;
    for (let i = len - 14; i < len; i++) {
      const c = candles[i];
      const p = candles[i - 1] || c;
      const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
      sum += tr;
    }
    return sum / 14;
  })();

  const atrPct = (atr / last.close) * 100;

  const momentum = last.close - prev.close;
  const momentumColor = momentum > 0 ? "text-green-400" : momentum < 0 ? "text-red-400" : "text-gray-300";

  const sparkline = closes.slice(-20);

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#11131a] rounded-xl text-white text-sm border border-white/5">
      <div className="flex justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Day Trader Pro Panel</span>
        <span className="text-[10px] text-gray-500">Local Data Only</span>
      </div>

      <Section title="Trend">
        <Value label="Trend Score" value={trendScore} valueClass={trendColor} />
        <Bar percent={(trendScore / 3) * 100} color="bg-green-500" />
      </Section>

      <Section title="Momentum">
        <Value label="1-Candle Momentum" value={momentum.toFixed(2)} valueClass={momentumColor} />
      </Section>

      <Section title="RSI">
        <Value label="RSI-14" value={rsi.toFixed(1)} valueClass={rsiColor} />
        <Gauge percent={rsi} />
      </Section>

      <Section title="Volatility">
        <Value label="ATR %" value={atrPct.toFixed(2)} />
        <Bar percent={Math.min(atrPct, 10) * 10} color="bg-purple-500" />
      </Section>

      <Section title="Volume">
        <Value label="Volume Pressure" value={volPressure.toFixed(2)} />
        <Bar percent={(Math.min(volPressure, 3) / 3) * 100} color="bg-blue-500" />
      </Section>

      <Section title="Sparkline (20 closes)">
        <div className="h-10 flex items-end gap-1">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline);
            const min = Math.min(...sparkline);
            const pct = ((v - min) / (max - min + 0.0001)) * 100;

            return (
              <div
                key={i}
                className="w-1 bg-green-400 rounded-sm"
                style={{ height: `${pct}%`, opacity: 0.4 + pct / 150 }}
              />
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{title}</span>
      {children}
    </div>
  );
}

function Value({ label, value, valueClass = "text-white" }: any) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function Bar({ percent, color }: any) {
  return (
    <div className="w-full h-1 bg-white/10 rounded">
      <div className={`h-1 rounded ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function Gauge({ percent }: { percent: number }) {
  return (
    <div className="w-full h-1 bg-white/10 rounded relative">
      <div className="absolute top-0 h-1 w-1 bg-yellow-400 rounded-full" style={{ left: `${percent}%` }} />
    </div>
  );
}
