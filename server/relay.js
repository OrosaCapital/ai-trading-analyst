// Simple relay/proxy scaffold for REST and WebSocket aggregation
// Run with: `node server/relay.js` (needs express and ws installed)

import express from 'express';
import fetch from 'node-fetch';
import WebSocket, { WebSocketServer } from 'ws';
import { parse as urlParse } from 'url';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { normalizeForKraken, fetchKrakenPairs } from '../src/lib/adapters/krakenPairMap.js';
import { sma, ema, rsi, macd, vwap, atr } from '../src/lib/indicators.js';
import { eventBus, publishNormalized } from '../src/lib/eventBus.js';
import { startKrakenAdapter } from '../src/adapters/krakenAdapter.js';
import { fetchCMCQuote } from '../src/adapters/cmcAdapter.js';
import { fetchCoinglassFunding } from '../src/adapters/coinglassAdapter.js';

const app = express();
app.use(express.json());
// permissive CORS for local development (adjust for production)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-relay-key, X-CMC_PRO_API_KEY, coinglassSecret');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 4000;
const RELAY_KEY = process.env.RELAY_KEY || null; // optional simple auth key

// Simple in-memory cache for fetched historical candles (symbol|interval|count)
// NOTE: we'll continue to use a small in-memory map as fast-path, but also
// publish/cache into Redis via eventBus or adapter-level storage (if configured).
const historyCache = new Map(); // key -> { ts: ms, data: [candles] }
const HISTORY_CACHE_TTL = Number(process.env.HISTORY_CACHE_TTL || 60); // seconds

// REST proxy for CoinMarketCap (pass API key via header `x-api-key` or env CMC_API_KEY)
app.get('/proxy/cmc/ohlcv', async (req, res) => {
  const symbol = req.query.symbol;
  const interval = req.query.interval || '1d';
  const count = req.query.count || 200;
  const apiKey = req.headers['x-api-key'] || process.env.CMC_API_KEY;
  // optional relay auth
  if (RELAY_KEY && req.headers['x-relay-key'] !== RELAY_KEY) return res.status(401).json({ error: 'unauthorized relay key' });
  if (!apiKey) return res.status(400).json({ error: 'CMC api key required in header x-api-key or env CMC_API_KEY' });
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical?symbol=${encodeURIComponent(symbol)}&time_period=${encodeURIComponent(interval)}&count=${count}`;
  try {
    const r = await fetch(url, { headers: { 'X-CMC_PRO_API_KEY': apiKey } });
    const json = await r.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// REST proxy for Coinglass (simple wrapper)
app.get('/proxy/coinglass/funding', async (req, res) => {
  const symbol = req.query.symbol;
  const apiKey = req.headers['x-api-key'] || process.env.COINGLASS_API_KEY;
  if (RELAY_KEY && req.headers['x-relay-key'] !== RELAY_KEY) return res.status(401).json({ error: 'unauthorized relay key' });
  const url = `https://open-api.coinglass.com/api/public/v1/fundingRate?symbol=${encodeURIComponent(symbol)}`;
  try {
    const r = await fetch(url, { headers: apiKey ? { 'coinglassSecret': apiKey } : {} });
    const json = await r.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// WS relay stub for Kraken: connects to Kraken and relays to connected clients
const wss = new WebSocketServer({ noServer: true });
let krakenClient = null;

// Start adapters (lightweight). Kraken adapter will publish normalized ohlc events
try {
  startKrakenAdapter({ symbols: ['XRP/USD'], interval: 1 });
} catch (e) { /* ignore adapter boot errors */ }

// Simple metrics counters
let METRICS = {
  normalized_received: 0,
  normalized_forwarded: 0,
  normalized_forward_fail: 0,
  ws_clients_connected: 0
};

// Listen to normalized events and log / forward as needed
eventBus.on('normalized', (ev) => {
  try {
    const ts = new Date().toISOString();
    const who = ev && (ev.provider || ev.source) ? `${ev.provider||ev.source}` : 'unknown';
    const sym = ev && (ev.canonicalSymbol || ev.symbol) ? (ev.canonicalSymbol || ev.symbol) : '—';
    const id = ev && ev.id ? ev.id : (ev && ev.data && ev.data.time ? `t${ev.data.time}` : '‑');
    // unified log for receipt
    try { console.log(`[relay] ${ts} normalized.received id=${id} type=${ev && ev.type ? ev.type : '‑'} symbol=${sym} provider=${who}`); } catch (e) {}
    METRICS.normalized_received += 1;

    // Forward normalized events to connected WS clients
    if (ev) {
      const msg = JSON.stringify({ event: 'normalized', payload: ev });
      let forwarded = 0;
      let totalClients = 0;
      for (const [ws] of clientSubscriptions) {
        totalClients += 1;
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(msg);
            forwarded += 1;
          }
        } catch (err) {
          try { console.warn('[relay] ws send error', err && err.message ? err.message : err); } catch (e) {}
          METRICS.normalized_forward_fail += 1;
        }
      }
      METRICS.normalized_forwarded += forwarded;
      try { console.log(`[relay] ${ts} normalized.forwarded id=${id} forwarded=${forwarded} clients=${totalClients} size=${msg.length}`); } catch (e) {}
    }
  } catch (e) { console.error('[relay] normalized handler error', e && e.stack ? e.stack : e); }
});

// Health and metrics endpoints
app.get('/health', (req, res) => {
  res.json({ ok: true, time: Date.now(), redis: !!(process.env.REDIS_URL || true) });
});

app.get('/metrics', (req, res) => {
  // expose simple prometheus text format
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  const lines = [];
  lines.push(`# HELP relay_normalized_received Total normalized events received`);
  lines.push(`# TYPE relay_normalized_received counter`);
  lines.push(`relay_normalized_received ${METRICS.normalized_received}`);
  lines.push(`# HELP relay_normalized_forwarded Total normalized events forwarded to clients`);
  lines.push(`# TYPE relay_normalized_forwarded counter`);
  lines.push(`relay_normalized_forwarded ${METRICS.normalized_forwarded}`);
  lines.push(`# HELP relay_normalized_forward_fail Total normalized forwards that failed`);
  lines.push(`# TYPE relay_normalized_forward_fail counter`);
  lines.push(`relay_normalized_forward_fail ${METRICS.normalized_forward_fail}`);
  lines.push(`# HELP relay_ws_clients_connected Number of currently connected WS clients`);
  lines.push(`# TYPE relay_ws_clients_connected gauge`);
  lines.push(`relay_ws_clients_connected ${METRICS.ws_clients_connected}`);
  res.end(lines.join('\n') + '\n');
});

// subscription management structures
const clientSubscriptions = new Map(); // ws -> Set(pairs)
const pairSubscribers = new Map(); // pair -> Set(ws)
const pairToChannel = new Map(); // pair -> channelID
const channelToPair = new Map(); // channelID -> pair

function ensureKraken() {
  if (krakenClient && krakenClient.readyState === WebSocket.OPEN) return;
  krakenClient = new WebSocket('wss://ws.kraken.com');
  krakenClient.on('open', () => console.info('Relay connected to Kraken WS'));
  // when Kraken connection opens, re-subscribe to any previously requested pairs
  krakenClient.on('open', () => {
    try {
      console.info('Relay connected to Kraken WS — resubscribing to cached pairs');
      for (const pair of pairSubscribers.keys()) {
        try {
          const subMsg = { event: 'subscribe', pair: [pair], subscription: { name: 'ohlc' } };
          if (krakenClient && krakenClient.readyState === WebSocket.OPEN) krakenClient.send(JSON.stringify(subMsg));
        } catch (e) {
          console.warn('Failed to resubscribe pair', pair, e);
        }
      }
    } catch (e) { /* ignore */ }
  });
  krakenClient.on('message', (data) => {
    // parse message and forward only to subscribed clients
    let parsed;
    try {
      parsed = JSON.parse(data.toString());
    } catch (err) {
      // sometimes plain string - forward as-is to all
      for (const [ws] of clientSubscriptions) {
        if (ws.readyState === WebSocket.OPEN) ws.send(data.toString());
      }
      return;
    }

    if (Array.isArray(parsed) && typeof parsed[0] === 'number') {
      const channelId = parsed[0];
      const pair = channelToPair.get(String(channelId)) || parsed[3] || null;
      if (pair) {
        const subs = pairSubscribers.get(pair);
        if (subs) {
          for (const c of subs) {
            if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(parsed));
          }
        }
      } else {
        // if unknown pair, broadcast
        for (const [ws] of clientSubscriptions) if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(parsed));
      }
      return;
    }

    // handle subscriptionStatus messages from Kraken
    if (parsed && parsed.event === 'subscriptionStatus') {
      const channelId = String(parsed.channelID || parsed.channelID === 0 ? parsed.channelID : parsed.channelID);
      const pair = parsed.pair || parsed.subscription && parsed.subscription.pair || null;
      if (channelId && pair) {
        channelToPair.set(String(channelId), pair);
        pairToChannel.set(pair, String(channelId));
      }
      // forward subscription status to all clients
      for (const [ws] of clientSubscriptions) if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(parsed));
      return;
    }

    // otherwise, broadcast to all
    for (const [ws] of clientSubscriptions) if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(parsed));
  });
  krakenClient.on('close', () => { krakenClient = null; console.info('Relay Kraken WS closed'); });
}

ensureKraken();

const server = app.listen(PORT, () => console.log('Relay proxy listening on', PORT));

// Simple in-memory rate limiter (per IP)
const rateMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, ts: now };
  if (now - entry.ts > 60000) { entry.count = 0; entry.ts = now; }
  entry.count += 1;
  rateMap.set(ip, entry);
  if (entry.count > 300) return res.status(429).json({ error: 'rate limit exceeded' });
  return next();
}

app.use(rateLimit);

// Computed indicators cache: avoid recomputing identical payloads rapidly
const computeCache = new Map(); // key -> { ts: ms, result }
const COMPUTE_CACHE_TTL = Number(process.env.COMPUTE_CACHE_TTL || 30); // seconds

function simpleHash(str) {
  // djb2-like
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// Debug endpoints
app.get('/debug/subscriptions', (req, res) => {
  if (RELAY_KEY && req.headers['x-relay-key'] !== RELAY_KEY) return res.status(401).json({ error: 'unauthorized' });
  const clients = [];
  for (const [ws, set] of clientSubscriptions.entries()) {
    clients.push({ subs: Array.from(set).slice(0, 20), open: ws.readyState });
  }
  const pairs = {};
  for (const [pair, subs] of pairSubscribers.entries()) pairs[pair] = subs.size;
  res.json({ clients: clients.length, clientDetails: clients, pairs, pairToChannel: Object.fromEntries(pairToChannel), channelToPair: Object.fromEntries(channelToPair) });
});

// Normalize endpoint using krakenPairMap
app.get('/normalize/kraken', async (req, res) => {
  const sym = req.query.symbol;
  if (!sym) return res.status(400).json({ error: 'symbol required' });
  try {
    const canon = await normalizeForKraken(sym);
    res.json({ input: sym, canonical: canon });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Compute indicators endpoint
// Expects JSON body: { candles: [ { time, open, high, low, close, volume }, ... ] }
app.post('/compute/indicators', async (req, res) => {
  if (RELAY_KEY && req.headers['x-relay-key'] !== RELAY_KEY) return res.status(401).json({ error: 'unauthorized relay key' });
  const body = req.body || {};
  let candles = body.candles;
  const symbol = body.symbol;
  const interval = body.interval || 1;
  const count = body.count || 240;
  const indicatorsRequested = body.indicators || null; // optional array of strings
  let canonicalSymbol = null;

  try {
    if ((!Array.isArray(candles) || candles.length === 0) && symbol) {
      // fetch historical OHLC from Kraken for symbol, using a small cache to avoid hammering Kraken
      try {
        const canon = await normalizeForKraken(symbol);
        canonicalSymbol = canon;
        const cacheKey = `${canon}|${interval}|${count}`;
        const cached = historyCache.get(cacheKey);
        const nowMs = Date.now();
        if (cached && (nowMs - cached.ts) < HISTORY_CACHE_TTL * 1000) {
          candles = cached.data;
        } else {
          // build since param to roughly fetch 'count' intervals
          const now = Math.floor(nowMs / 1000);
          const since = now - (interval * 60 * (count + 10));
          const url = `https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(canon)}&interval=${encodeURIComponent(interval)}&since=${since}`;
          const r = await fetch(url);
          const j = await r.json();
          const firstKey = Object.keys(j.result).find(k => k !== 'last');
          const rows = (j.result && j.result[firstKey]) || [];
          candles = rows.map(rw => ({ time: Number(rw[0]), open: +rw[1], high: +rw[2], low: +rw[3], close: +rw[4], volume: +rw[6] }));
          if (candles.length > count) candles = candles.slice(-count);
          historyCache.set(cacheKey, { ts: nowMs, data: candles });
        }
      } catch (err) {
        return res.status(500).json({ ok: false, error: 'failed to fetch historical for symbol: ' + String(err) });
      }
    } else if (!canonicalSymbol && symbol) {
      try { canonicalSymbol = await normalizeForKraken(symbol); } catch (err) { /* ignore */ }
    }

    if (!Array.isArray(candles) || candles.length === 0) return res.status(400).json({ error: 'candles array required in body or symbol must be provided' });

    // prepare arrays
    const closes = candles.map(c => (c && typeof c.close === 'number') ? c.close : null);

    // Try compute cache first (keyed by candles or symbol payload)
    let cacheKey = null;
    try {
      if (body && body.candles) {
        const keyStr = JSON.stringify(body.candles.slice(-500));
        cacheKey = 'candles|' + simpleHash(keyStr);
      } else if (symbol) {
        const keyObj = { symbol: symbol, interval, count, indicators: indicatorsRequested };
        cacheKey = 'symbol|' + simpleHash(JSON.stringify(keyObj));
      }
      if (cacheKey) {
        const cached = computeCache.get(cacheKey);
        if (cached && (Date.now() - cached.ts) < COMPUTE_CACHE_TTL * 1000) {
          return res.json(Object.assign({ ok: true, cached: true }, cached.result));
        }
      }
    } catch (err) {
      // ignore cache errors and continue
    }

    const result = {};
    const lastNonNull = (arr) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return arr[i]; return null; };

    // compute only requested indicators if requested
    const want = (name) => {
      if (!indicatorsRequested || (Array.isArray(indicatorsRequested) && indicatorsRequested.length === 0)) return true;
      return indicatorsRequested.includes(name);
    };

    if (want('ema9')) result.ema9 = ema(closes, 9);
    if (want('ema21')) result.ema21 = ema(closes, 21);
    if (want('rsi14')) result.rsi14 = rsi(closes, 14);
    if (want('macd')) result.macd = macd(closes, 12, 26, 9);
    if (want('vwap')) result.vwap = vwap(candles);
    if (want('atr14')) result.atr14 = atr(candles, 14);

    const last = {};
    if (result.ema9) last.ema9 = lastNonNull(result.ema9);
    if (result.ema21) last.ema21 = lastNonNull(result.ema21);
    if (result.rsi14) last.rsi14 = lastNonNull(result.rsi14);
    if (result.macd) last.macd = { macd: lastNonNull(result.macd.macd || []), signal: lastNonNull(result.macd.signal || []), hist: lastNonNull(result.macd.hist || []) };
    if (result.vwap) last.vwap = lastNonNull(Array.isArray(result.vwap) ? result.vwap : [result.vwap]);
    if (result.atr14) last.atr14 = lastNonNull(result.atr14);

    const lastCandle = candles[candles.length - 1] || null;
    if (lastCandle) {
      last.close = lastCandle.close;
      last.time = lastCandle.time;
      last.volume = lastCandle.volume;
    }

    const payloadOut = {
      ok: true,
      indicators: result,
      last,
      candles,
      interval,
      count: candles.length,
      symbol: symbol || null,
      canonicalSymbol,
      source: canonicalSymbol ? 'kraken' : (body.source || 'custom')
    };
    try { if (cacheKey) computeCache.set(cacheKey, { ts: Date.now(), result: payloadOut }); } catch (e) {}
    res.json(payloadOut);
  } catch (err) { res.status(500).json({ ok: false, error: String(err) }); }
});

function checkRelayAuth(request) {
  if (!RELAY_KEY) return true;
  const qs = urlParse(request.url, true).query || {};
  const provided = request.headers['x-relay-key'] || qs.key;
  return provided === RELAY_KEY;
}

server.on('upgrade', (request, socket, head) => {
  // Only accept upgrades on /relay path for WS-relay
  const pathname = urlParse(request.url).pathname;
  if (pathname !== '/relay') {
    socket.destroy();
    return;
  }

  if (!checkRelayAuth(request)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  // Accept WebSocket connections for relayed Kraken stream
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Handle client connections and subscription requests
wss.on('connection', (ws, request) => {
  // register
  clientSubscriptions.set(ws, new Set());

  ws.on('message', (msg) => {
    let parsed;
    try { parsed = JSON.parse(msg.toString()); } catch (err) { return; }
    if (parsed && parsed.action === 'subscribe' && parsed.pair) {
      const rawPair = parsed.pair;
      const interval = parsed.interval || 1;
      (async () => {
        try {
          // normalize to Kraken canonical pair
          const canon = await normalizeForKraken(rawPair);

          // add client subscription (store canonical)
          const set = clientSubscriptions.get(ws) || new Set();
          set.add(canon);
          clientSubscriptions.set(ws, set);

          if (!pairSubscribers.has(canon)) pairSubscribers.set(canon, new Set());
          pairSubscribers.get(canon).add(ws);

          // if first subscriber, subscribe to Kraken using canonical pair
          if (!pairToChannel.has(canon)) {
            ensureKraken();
            const subMsg = { event: 'subscribe', pair: [canon], subscription: { name: 'ohlc', interval } };
            if (krakenClient && krakenClient.readyState === WebSocket.OPEN) krakenClient.send(JSON.stringify(subMsg));
          }

          ws.send(JSON.stringify({ ok: true, action: 'subscribed', pair: canon }));
        } catch (err) {
          ws.send(JSON.stringify({ ok: false, error: String(err), action: 'subscribe', pair: rawPair }));
        }
      })();
      return;
    }

    if (parsed && parsed.action === 'unsubscribe' && parsed.pair) {
      const rawPair = parsed.pair;
      (async () => {
        try {
          const canon = await normalizeForKraken(rawPair);
          const set = clientSubscriptions.get(ws);
          if (set) set.delete(canon);
          const subs = pairSubscribers.get(canon);
          if (subs) subs.delete(ws);
          if (!subs || subs.size === 0) {
            // unsubscribe from Kraken if channel known
            const channelId = pairToChannel.get(canon);
            if (channelId && krakenClient && krakenClient.readyState === WebSocket.OPEN) {
              try { krakenClient.send(JSON.stringify({ event: 'unsubscribe', channelID: Number(channelId) })); } catch (e) {}
            }
            pairToChannel.delete(canon);
          }
          ws.send(JSON.stringify({ ok: true, action: 'unsubscribed', pair: canon }));
        } catch (err) {
          ws.send(JSON.stringify({ ok: false, error: String(err), action: 'unsubscribe', pair: rawPair }));
        }
      })();
      return;
    }

    // ping/pong
    if (parsed && parsed.action === 'ping') { ws.send(JSON.stringify({ action: 'pong' })); }
  });

  ws.on('close', () => {
    // cleanup subscriptions
    const set = clientSubscriptions.get(ws) || new Set();
    for (const pair of set) {
      const subs = pairSubscribers.get(pair);
      if (subs) {
        subs.delete(ws);
        if (subs.size === 0) {
          // unsubscribe from Kraken
          const channelId = pairToChannel.get(pair);
          if (channelId && krakenClient && krakenClient.readyState === WebSocket.OPEN) {
            try { krakenClient.send(JSON.stringify({ event: 'unsubscribe', channelID: Number(channelId) })); } catch (e) {}
          }
          pairToChannel.delete(pair);
        }
      }
    }
    clientSubscriptions.delete(ws);
  });
});

console.log('Relay scaffold running. Note: install dependencies: npm i express node-fetch ws');
