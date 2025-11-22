import fetch from 'node-fetch';

async function testCandles() {
  const url = 'http://localhost:4000/compute/indicators';
  const payload = {
    candles: [
      { time: 1, open: 100, high: 101, low: 99, close: 100, volume: 10 },
      { time: 2, open: 100, high: 102, low: 99, close: 101, volume: 11 },
      { time: 3, open: 101, high: 103, low: 100, close: 102, volume: 12 }
    ],
    indicators: ['ema9','ema21','rsi14','macd','vwap','atr14']
  };
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const j = await res.json();
  console.log('candles test:', j);
}

async function testSymbol() {
  const url = 'http://localhost:4000/compute/indicators';
  const payload = { symbol: 'XBT/USD', interval: 1, count: 50, indicators: ['ema9','rsi14','macd'] };
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const j = await res.json();
  console.log('symbol test:', j);
}

(async () => {
  try {
    await testCandles();
    await testSymbol();
    console.log('tests completed');
  } catch (err) {
    console.error('test failed', err);
    process.exit(1);
  }
})();
