import fetch from 'node-fetch';
import { publishNormalized } from '../lib/eventBus.js';

export async function fetchCMCQuote(symbol) {
  const start = Date.now();
  try {
    // symbol may be like 'XRP' or 'XRP/USD' -> normalize to base
    const base = (symbol || '').split(/[\/\-]/)[0];
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(base)}`;
    const res = await fetch(url, { headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY || '' } });
    const json = await res.json();
    const latency = Date.now() - start;
    const event = {
      provider: 'coinmarketcap',
      source: 'rest',
      type: 'quote',
      symbol: base,
      data: json,
      latencyMs: latency,
      fetchedAt: Date.now()
    };
    await publishNormalized(event);
    return event;
  } catch (e) {
    console.warn('fetchCMCQuote failed', e && e.message);
    return null;
  }
}
