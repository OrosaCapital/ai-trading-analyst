// CoinMarketCap REST adapter with rate limiting + retries.

import { createLimiter, withLimiterAndRetry } from './limiterUtils.js';

const CMC_BASE = 'https://pro-api.coinmarketcap.com';
const cmcLimiter = createLimiter({ id: 'cmc-http', minTime: 500 });

async function fetchHistoricalKlines(symbol, interval = '1d', limit = 200, apiKey) {
  const key = apiKey || (typeof process !== 'undefined' && process.env && process.env.CMC_API_KEY) || null;
  if (!key) throw new Error('CoinMarketCap API key required (pass apiKey or set CMC_API_KEY)');

  const url = `${CMC_BASE}/v1/cryptocurrency/ohlcv/historical?symbol=${encodeURIComponent(symbol)}&time_period=${encodeURIComponent(interval)}&count=${limit}`;

  const exec = async () => {
    const started = Date.now();
    const res = await fetch(url, { headers: { 'X-CMC_PRO_API_KEY': key } });
    if (!res.ok) throw new Error(`CMC historical fetch failed (status ${res.status})`);
    const json = await res.json();
    const latency = Date.now() - started;

    const data = (json && json.data && (json.data.quotes || json.data)) || [];
    const rows = [];
    for (const item of data) {
      if (item.time_open && item.time_close && item.quote) {
        const q = item.quote && item.quote.USD;
        if (!q) continue;
        rows.push({ time: Math.floor(new Date(item.time_close).getTime() / 1000), open: +q.open, high: +q.high, low: +q.low, close: +q.close, volume: +q.volume, latency });
      } else if (item.time && item.open) {
        rows.push({ time: Math.floor(new Date(item.time).getTime() / 1000), open: +item.open, high: +item.high, low: +item.low, close: +item.close, volume: +item.volume, latency });
      }
    }
    return rows;
  };

  try {
    return await withLimiterAndRetry(cmcLimiter, exec, {
      onFailedAttempt: (err) => console.warn('[CMC adapter] retry', err?.message)
    });
  } catch (err) {
    console.error('CMC historical fetch failed', err);
    return [];
  }
}

export { fetchHistoricalKlines };
export default { fetchHistoricalKlines };
