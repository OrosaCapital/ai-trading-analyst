import fetch from 'node-fetch';
import { publishNormalized } from '../lib/eventBus.js';

export async function fetchCoinglassFunding(symbol) {
  const start = Date.now();
  try {
    const base = (symbol || '').split(/[\/\-]/)[0];
    const url = `https://open-api.coinglass.com/api/public/v1/fundingRate?symbol=${encodeURIComponent(base)}`;
    const res = await fetch(url);
    const json = await res.json();
    const latency = Date.now() - start;
    const event = {
      provider: 'coinglass',
      source: 'rest',
      type: 'funding',
      symbol: base,
      data: json,
      latencyMs: latency,
      fetchedAt: Date.now()
    };
    await publishNormalized(event);
    return event;
  } catch (e) {
    console.warn('fetchCoinglassFunding failed', e && e.message);
    return null;
  }
}
