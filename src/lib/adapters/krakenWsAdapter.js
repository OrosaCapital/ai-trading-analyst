// Kraken WebSocket & REST adapter with retry-aware historical fetches.

import { createLimiter, withLimiterAndRetry } from './limiterUtils.js';

const krakenLimiter = createLimiter({ id: 'kraken-rest', minTime: 350 });

export class KrakenWsAdapter {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // key: `${pair}|${interval}` -> callback
    this.subscriptions = new Set();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.ws = new WebSocket('wss://ws.kraken.com');
    this.ws.addEventListener('open', () => console.info('Kraken WS connected'));
    this.ws.addEventListener('message', (msg) => this._onMessage(msg));
    this.ws.addEventListener('close', () => console.info('Kraken WS closed'));
    this.ws.addEventListener('error', (e) => console.error('Kraken WS error', e));
  }

  _onMessage(msgEvent) {
    try {
      const data = JSON.parse(msgEvent.data);
      // Pass through subscriptionStatus and heartbeat
      if (data.event) return;

      // Kraken sends array messages for subscriptions. The exact format depends on channel.
      // We'll attempt to detect `ohlc` messages and call registered callbacks.
      if (Array.isArray(data)) {
        // Typical ohlc message: [channelID, [time, open, high, low, close, v, count], "ohlc-1"]
        const [channel, payload, channelName] = data;
        if (typeof channelName === 'string' && channelName.startsWith('ohlc')) {
          // payload can be array or array of arrays; normalize to one candle
          const values = Array.isArray(payload[0]) ? payload : [payload];
          for (const v of values) {
            const [time, open, high, low, close, vVolume] = v;
            // We don't have pair/interval in the message; callbacks must be registered per channel by subscription
            // For the scaffold, call all listeners with a normalized candle object
            for (const cb of this.listeners.values()) cb({ time, open: +open, high: +high, low: +low, close: +close, volume: +vVolume });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to parse Kraken message', err);
    }
  }

  subscribeKlines(pair, interval = 1, callback) {
    // pair example: 'XBT/USD' or 'BTC/USD' depending on Kraken mapping
    const key = `${pair}|${interval}`;
    this.listeners.set(key, callback);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) this.connect();
    if (this.subscriptions.has(key)) return;
    const subMsg = {
      event: 'subscribe',
      pair: [pair],
      subscription: { name: 'ohlc', interval: interval }
    };
    this.ws.addEventListener('open', () => this.ws.send(JSON.stringify(subMsg)), { once: true });
    try { this.ws.send(JSON.stringify(subMsg)); } catch (e) { /* may not be open yet */ }
    this.subscriptions.add(key);
  }

  async fetchHistoricalKlines(pair, interval = 1, since = 0) {
    // REST: https://api.kraken.com/0/public/OHLC?pair=<pair>&interval=<interval>&since=<since>
    const url = `https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(pair)}&interval=${interval}${since ? `&since=${since}` : ''}`;
    const exec = async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Kraken REST fetch failed (status ${res.status})`);
      const json = await res.json();
      const firstKey = Object.keys(json.result || {}).find(k => k !== 'last');
      const rows = (json.result && json.result[firstKey]) || [];
      return rows.map(r => ({ time: Number(r[0]), open: +r[1], high: +r[2], low: +r[3], close: +r[4], volume: +r[6] }));
    };
    try {
      return await withLimiterAndRetry(krakenLimiter, exec, {
        onFailedAttempt: (err) => console.warn('[Kraken adapter] retry historical', err?.message)
      });
    } catch (err) {
      console.error('Kraken REST fetch failed', err);
      return [];
    }
  }

  disconnect() {
    try { this.ws && this.ws.close(); } catch (e) {}
    this.listeners.clear();
    this.subscriptions.clear();
  }
}

export default KrakenWsAdapter;
