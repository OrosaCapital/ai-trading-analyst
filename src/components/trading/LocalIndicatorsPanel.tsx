import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  candles: Array<{ close: number; high: number; low: number; volume: number; open: number }>;
}

export function LocalIndicatorsPanel({ candles }: Props) {
  if (!candles || candles.length < 20) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading indicators...
          </div>
        </CardContent>
      </Card>
    );
  }

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  // Simple Moving Average
  const sma = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;

  // RSI
  let gains = 0, losses = 0;
  for (let i = Math.max(0, closes.length - 14); i < closes.length; i++) {
    if (i === 0) continue;
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  const rsi = 100 - 100 / (1 + rs);

  // ATR (using last 14 candles)
  const atr = candles.slice(-14).reduce((sum, c, i, arr) => {
    if (i === 0) return sum;
    const prev = arr[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prev.close),
      Math.abs(c.low - prev.close)
    );
    return sum + tr;
  }, 0) / 14;

  // Volume SMA (20)
  const volSMA = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

  // Last candle strength
  const last = candles[candles.length - 1];
  const candleStrength = last.high !== last.low 
    ? ((last.close - last.open) / (last.high - last.low)) 
    : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Technical Indicators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Indicator label="SMA-20" value={sma.toFixed(4)} />
        <Indicator label="RSI-14" value={rsi.toFixed(2)} />
        <Indicator label="ATR-14" value={atr.toFixed(6)} />
        <Indicator label="Volume SMA-20" value={volSMA.toFixed(0)} />
        <Indicator label="Candle Strength" value={candleStrength.toFixed(2)} />
      </CardContent>
    </Card>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border pb-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
