import EventEmitter from 'events';
import IORedis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Read REDIS_URL from env, fall back to localhost
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const REDIS_CHANNEL = process.env.MARKET_EVENTS_CHANNEL || 'market:events';

let pub = null;
let sub = null;
try {
  // use lazyConnect so we can attach error handlers before the socket connects
  pub = new IORedis(REDIS_URL, { lazyConnect: true });
  sub = new IORedis(REDIS_URL, { lazyConnect: true });
  // attach error handlers so ioredis doesn't emit unhandled errors when Redis is not reachable
  pub.on('error', (err) => { console.warn('[ioredis pub] error', err && err.message); });
  sub.on('error', (err) => { console.warn('[ioredis sub] error', err && err.message); });
  // attempt to connect, but don't crash if connection refused
  (async () => { try { await pub.connect(); await sub.connect(); } catch (e) { /* ignore connection failure */ } })();
} catch (e) {
  // If Redis client creation fails, fall back to local bus
  pub = null; sub = null;
}

const bus = new EventEmitter();

// If Redis is available, subscribe to channel and forward messages to local EventEmitter
if (sub) {
  sub.subscribe(REDIS_CHANNEL).catch(() => {});
  sub.on('message', (channel, message) => {
    if (channel !== REDIS_CHANNEL) return;
    try {
      const obj = JSON.parse(message);
      bus.emit('normalized', obj);
    } catch (e) { /* ignore */ }
  });
}

function nowMs() { return Date.now(); }

async function publishNormalized(event) {
  // ensure canonical fields
  const out = Object.assign({
    id: event.id || uuidv4(),
    ts: event.ts || nowMs(),
    fetchedAt: event.fetchedAt || nowMs(),
    latencyMs: typeof event.latencyMs === 'number' ? event.latencyMs : 0,
    provider: event.provider || 'relay',
    source: event.source || 'unknown',
    type: event.type || 'event',
    symbol: event.symbol || null,
    data: event.data || {}
  }, event);

  // quick validation: warn if essential fields missing or malformed
  try {
    const problems = [];
    if (!out.type) problems.push('type');
    if (!out.symbol) problems.push('symbol');
    if (!out.data || typeof out.data !== 'object') problems.push('data');
    if (out.data && (out.data.time == null)) problems.push('data.time');
    if (problems.length > 0) console.warn('[eventBus] publishNormalized missing fields:', problems.join(', '), out && out.id ? out.id : 'no-id');
  } catch (e) { /* ignore validation errors */ }

  // local emit
  process.nextTick(() => bus.emit('normalized', out));

  // publish to redis if available
  if (pub) {
    try {
      await pub.publish(REDIS_CHANNEL, JSON.stringify(out));
    } catch (e) {
      // swallow redis publish errors
      console.warn('eventBus publish failed', e && e.message);
    }
  }
  return out;
}

export { bus as eventBus, publishNormalized };
