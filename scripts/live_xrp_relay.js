const WebSocket = require('ws');
const Redis = require('ioredis');
const uuid = require('uuid').v4;

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(REDIS_URL);

const KRACKEN_WS = 'wss://ws.kraken.com';
const PAIR = process.env.PAIR || 'XRP/USD';

console.log('[live_xrp_relay] starting; pair=', PAIR, 'redis=', REDIS_URL);

const ws = new WebSocket(KRACKEN_WS);

ws.on('open', () => {
  console.log('[live_xrp_relay] ws open — subscribing to ticker', PAIR);
  const msg = { event: 'subscribe', pair: [PAIR], subscription: { name: 'ticker' } };
  ws.send(JSON.stringify(msg));
});

ws.on('message', async (data) => {
  try {
    const msg = JSON.parse(data.toString());
    // ignore heartbeat/subscribe confirmations
    if (msg.event) {
      // subscription status or heartbeat
      // console.log('[live_xrp_relay] event:', msg.event);
      return;
    }

    // Kraken ticker/trade messages are arrays: [channelID, payload, channelName, pair]
    if (Array.isArray(msg) && msg.length >= 4) {
      const payload = msg[1] || {};
      const channel = msg[2];
      const pair = msg[3];

      if (channel === 'ticker') {
        // payload.c is close: ["123.45","0"]
        const closeStr = Array.isArray(payload.c) ? payload.c[0] : payload.c;
        const volumeStr = Array.isArray(payload.v) ? payload.v[1] : payload.v;
        const price = closeStr ? Number(closeStr) : null;
        const volume = volumeStr ? Number(volumeStr) : 0;
        if (price != null && !Number.isNaN(price)) {
          const ts = Date.now();
          const evt = {
            id: `kraken-${pair}-${ts}`,
            ts,
            provider: 'kraken',
            source: 'kraken-ws',
            type: 'ohlc',
            symbol: pair, // keeps Kraken pair; dashboard code understands symbol/canonicalSymbol
            canonicalSymbol: pair.replace(/\//g, ''),
            interval: 1,
            data: {
              time: Math.floor(ts / 1000),
              open: price,
              high: price,
              low: price,
              close: price,
              volume: volume
            }
          };
          const s = JSON.stringify(evt);
          try {
            const n = await redis.publish('market:events', s);
            console.log(new Date().toISOString(), '[live_xrp_relay] published tick', price, 'subscribers=', n);
          } catch (e) {
            console.error('[live_xrp_relay] redis publish error', e && e.message ? e.message : e);
          }
        }
      }
    }
  } catch (e) {
    console.error('[live_xrp_relay] parse error', e && e.message ? e.message : e);
  }
});

ws.on('close', (code, reason) => {
  console.warn('[live_xrp_relay] ws closed', code, reason && reason.toString ? reason.toString() : reason);
  setTimeout(() => process.exit(1), 5000);
});

ws.on('error', (err) => {
  console.error('[live_xrp_relay] ws error', err && err.message ? err.message : err);
});

process.on('SIGINT', async () => {
  console.log('[live_xrp_relay] SIGINT — shutting down');
  try { await redis.quit(); } catch (e) {}
  try { ws.close(); } catch (e) {}
  process.exit(0);
});
