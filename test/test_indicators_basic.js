import assert from 'assert';
import { sma, ema, rsi, macd, vwap, atr, bollinger, adx } from '../src/lib/indicators.js';

export function testSMA() {
  const vals = [1,2,3,4,5];
  const res = sma(vals, 3);
  assert.strictEqual(res.length, vals.length);
  assert.strictEqual(res[0], null);
  assert.strictEqual(res[1], null);
  assert.strictEqual(res[2], 2);
  assert.strictEqual(res[3], 3);
  assert.strictEqual(res[4], 4);
}

export function testBollinger() {
  const vals = [1,2,3,4,5,6,7,8,9,10];
  const bb = bollinger(vals, 3, 2);
  // middle should equal sma with same period
  const mid = sma(vals, 3);
  for (let i = 0; i < vals.length; i++) {
    if (mid[i] == null) {
      assert.strictEqual(bb.middle[i], mid[i]);
    } else {
      assert.ok(bb.upper[i] > bb.middle[i]);
      assert.ok(bb.lower[i] < bb.middle[i]);
    }
  }
}

export function testATR() {
  const candles = [
    {high:2, low:1, close:1, volume:1},
    {high:3, low:1, close:2, volume:1},
    {high:4, low:2, close:3, volume:1},
    {high:5, low:3, close:4, volume:1}
  ];
  const res = atr(candles, 2);
  assert.strictEqual(res.length, candles.length);
  // ATR should be numeric at index period-1
  assert.ok(res[1] != null && isFinite(res[1]));
  assert.ok(res[2] != null && isFinite(res[2]));
}

export function testADX_basic() {
  // build a simple trending series
  const candles = [];
  let price = 100;
  for (let i = 0; i < 60; i++) {
    const open = price;
    price += 0.5 + Math.random() * 0.2;
    const close = price;
    const high = Math.max(open, close) + 0.1;
    const low = Math.min(open, close) - 0.1;
    candles.push({time:i, open, high, low, close, volume:100});
  }
  const res = adx(candles, 14);
  assert.strictEqual(res.length, candles.length);
  // ADX should produce finite numbers after warmup
  const tail = res.slice(-5);
  for (const v of tail) if (v != null) assert.ok(isFinite(v));
}

export function testMACD_and_EMA_RSI_presence() {
  const vals = [];
  for (let i = 0; i < 100; i++) vals.push(100 + i*0.1);
  const e = ema(vals, 10);
  const r = rsi(vals, 14);
  const m = macd(vals);
  assert.strictEqual(e.length, vals.length);
  assert.strictEqual(r.length, vals.length);
  assert.ok(Array.isArray(m.macd) && m.macd.length === vals.length);
}
