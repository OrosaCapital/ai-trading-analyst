const { sma, ema, rsi, macd, vwap, atr } = require('../src/lib/indicators');

// Generate simple synthetic candle data for demo
function generateCandles(length = 200, start = 100) {
  const candles = [];
  let price = start;
  for (let i = 0; i < length; i++) {
    const open = price;
    // random walk
    const change = (Math.random() - 0.48) * 2;
    const close = Math.max(0.1, open + change);
    const high = Math.max(open, close) + Math.random() * 0.8;
    const low = Math.min(open, close) - Math.random() * 0.8;
    const volume = Math.round(100 + Math.random() * 900);
    candles.push({ time: i, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

const candles = generateCandles(200, 120);
const closes = candles.map(c => c.close);

console.log('Computing indicators on', candles.length, 'candles');

const sma20 = sma(closes, 20);
const ema20 = ema(closes, 20);
const rsi14 = rsi(closes, 14);
const macdRes = macd(closes);
const vwapRes = vwap(candles);
const atr14 = atr(candles, 14);

function tail(arr, n=5) { return arr.slice(-n).map(v => (v==null?null:Math.round(v*1000)/1000)); }

console.log('SMA20 tail:', tail(sma20));
console.log('EMA20 tail:', tail(ema20));
console.log('RSI14 tail:', tail(rsi14));
console.log('MACD tail:', tail(macdRes.macd));
console.log('MACD signal tail:', tail(macdRes.signal));
console.log('VWAP tail:', tail(vwapRes));
console.log('ATR14 tail:', tail(atr14));
