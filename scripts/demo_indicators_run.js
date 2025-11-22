import { sma, ema, rsi, macd, vwap, atr,
  bollinger, stochastic, cci, roc, obv, cmf, adx, parabolicSAR, trix, keltner
} from '../src/lib/indicators.js';

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
const bb = bollinger(closes, 20, 2);
const stoch = stochastic(candles, 14, 3);
const cci20 = cci(candles, 20);
const roc12 = roc(closes, 12);
const obvRes = obv(candles);
const cmf21 = cmf(candles, 21);
const adx14 = adx(candles, 14);
const psar = parabolicSAR(candles);
const trixRes = trix(closes, 15, 9);
const kelt = keltner(candles, 20, 10, 1.5);

function tail(arr, n=5) { return arr.slice(-n).map(v => (v==null?null:Math.round(v*1000)/1000)); }

console.log('SMA20 tail:', tail(sma20));
console.log('EMA20 tail:', tail(ema20));
console.log('RSI14 tail:', tail(rsi14));
console.log('MACD tail:', tail(macdRes.macd));
console.log('MACD signal tail:', tail(macdRes.signal));
console.log('VWAP tail:', tail(vwapRes));
console.log('ATR14 tail:', tail(atr14));
console.log('Bollinger middle tail:', tail(bb.middle));
console.log('Bollinger upper tail:', tail(bb.upper));
console.log('Bollinger lower tail:', tail(bb.lower));
console.log('Stochastic %K tail:', tail(stoch.k));
console.log('Stochastic %D tail:', tail(stoch.d));
console.log('CCI20 tail:', tail(cci20));
console.log('ROC12 tail:', tail(roc12));
console.log('OBV tail:', tail(obvRes));
console.log('CMF21 tail:', tail(cmf21));
console.log('ADX14 tail:', tail(adx14));
console.log('Parabolic SAR tail:', tail(psar));
console.log('TRIX tail:', tail(trixRes.trix));
console.log('TRIX signal tail:', tail(trixRes.signal));
console.log('Keltner center tail:', tail(kelt.center));
console.log('Keltner upper tail:', tail(kelt.upper));
console.log('Keltner lower tail:', tail(kelt.lower));
