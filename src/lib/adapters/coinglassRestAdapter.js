// Coinglass REST adapter with limiter + retry.

import { createLimiter, withLimiterAndRetry } from './limiterUtils.js';

const COINGLASS_BASE = 'https://open-api.coinglass.com/api';
const coinglassLimiter = createLimiter({ id: 'coinglass-http', minTime: 600 });

function buildHeaders(key) {
  return key ? { headers: { 'coinglassSecret': key } } : {};
}

async function fetchFundingRates(symbol, apiKey) {
  const key = apiKey || (typeof process !== 'undefined' && process.env && process.env.COINGLASS_API_KEY) || null;
  const url = `${COINGLASS_BASE}/public/v1/fundingRate?symbol=${encodeURIComponent(symbol)}`;
  const exec = async () => {
    const res = await fetch(url, buildHeaders(key));
    if (!res.ok) throw new Error(`Coinglass funding fetch failed (status ${res.status})`);
    const json = await res.json();
    return json.data || json || [];
  };
  try {
    return await withLimiterAndRetry(coinglassLimiter, exec, {
      onFailedAttempt: (err) => console.warn('[Coinglass adapter] retry funding', err?.message)
    });
  } catch (err) {
    console.error('Coinglass funding fetch failed', err);
    return [];
  }
}

async function fetchLiquidations(params = {}, apiKey) {
  const key = apiKey || (typeof process !== 'undefined' && process.env && process.env.COINGLASS_API_KEY) || null;
  const qs = new URLSearchParams(params).toString();
  const url = `${COINGLASS_BASE}/public/v1/liquidation?${qs}`;
  const exec = async () => {
    const res = await fetch(url, buildHeaders(key));
    if (!res.ok) throw new Error(`Coinglass liquidation fetch failed (status ${res.status})`);
    const json = await res.json();
    return json.data || json || [];
  };
  try {
    return await withLimiterAndRetry(coinglassLimiter, exec, {
      onFailedAttempt: (err) => console.warn('[Coinglass adapter] retry liquidation', err?.message)
    });
  } catch (err) {
    console.error('Coinglass liquidation fetch failed', err);
    return [];
  }
}

export { fetchFundingRates, fetchLiquidations };
export default { fetchFundingRates, fetchLiquidations };
