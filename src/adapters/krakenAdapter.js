import WebSocket from 'ws';
import { publishNormalized } from '../lib/eventBus.js';

// Minimal Kraken WS adapter: connects to Kraken and emits normalized OHLC events
export function startKrakenAdapter({ url = 'wss://ws.kraken.com', symbols = ['XRP/USD'], interval = 1 } = {}) {
  // Implement exponential backoff with jitter on reconnects
  let ws = null;
  let attempts = 0;
  let reconnectTimer = null;

  const pairs = symbols.map(s => s.replace('/', ''));

  function backoffDelay(attempt) {
    const base = 1000; // 1s
    const max = 30000; // 30s
    let delay = Math.min(max, base * Math.pow(2, attempt));
    // add jitter +-20%
    const jitter = Math.floor(delay * 0.2);
    const delta = Math.floor((Math.random() * jitter * 2) - jitter);
    delay = Math.max(500, delay + delta);
    return delay;
  }

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      attempts = 0; // reset on success
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      console.info('[krakenAdapter] connected', { url, pairs: symbols, interval });
      // subscribe
      try {
        const msg = { event: 'subscribe', pair: pairs, subscription: { name: 'ohlc', interval } };
        ws.send(JSON.stringify(msg));
        console.info('[krakenAdapter] subscribed', { pairs, interval });
      } catch (e) {
        console.warn('[krakenAdapter] subscribe failed', e && e.message);
      }
    };

    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (Array.isArray(d) && typeof d[2] === 'string' && d[2].startsWith('ohlc')) {
          const payload = d[1];
          const [time, open, high, low, close, v] = payload;
          const symbol = d[3] || null;
          const event = {
            provider: 'kraken',
            source: 'ws',
            type: 'ohlc',
            symbol,
            data: { time: Number(time), open: +open, high: +high, low: +low, close: +close, volume: +v },
            latencyMs: 0
          };
          publishNormalized(event).catch((err) => {
            console.warn('[krakenAdapter] publishNormalized error', err && err.message);
          });
        }
      } catch (e) { /* ignore parse errors */ }
    };

    ws.onclose = (code, reason) => {
      console.info('[krakenAdapter] closed', { code, reason: reason && reason.toString ? reason.toString() : reason });
      scheduleReconnect();
    };

    ws.onerror = (e) => { console.warn('[krakenAdapter] error', e && e.message); };
  }

  // Circuit-breaker: cap attempts within a window; if exceeded, pause for cooldown
  const MAX_ATTEMPTS = 10;
  const ATTEMPT_WINDOW_MS = 60 * 1000; // count attempts per minute
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown when tripped
  let attemptTimestamps = [];

  function scheduleReconnect() {
    const now = Date.now();
    // prune old attempts
    attemptTimestamps = attemptTimestamps.filter(ts => (now - ts) <= ATTEMPT_WINDOW_MS);
    attemptTimestamps.push(now);
    attempts += 1;
    if (attemptTimestamps.length > MAX_ATTEMPTS) {
      const delay = COOLDOWN_MS + Math.floor(Math.random() * 20000); // cooldown + small jitter
      console.warn('[krakenAdapter] circuit-breaker tripped; entering cooldown', { attempts: attemptTimestamps.length, delay });
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        attemptTimestamps = [];
        attempts = 0;
        try { connect(); } catch (e) { console.warn('[krakenAdapter] reconnect after cooldown error', e && e.message); scheduleReconnect(); }
      }, delay);
      return;
    }

    const delay = backoffDelay(attempts);
    console.info('[krakenAdapter] scheduling reconnect', { attempt: attempts, delay });
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      try { connect(); } catch (e) { console.warn('[krakenAdapter] reconnect error', e && e.message); scheduleReconnect(); }
    }, delay);
  }

  // start
  connect();

  // return a small API for tests/inspection
  return {
    close: () => { if (ws) ws.close(); if (reconnectTimer) clearTimeout(reconnectTimer); },
    _internal: () => ({ attempts, url, pairs })
  };
}
