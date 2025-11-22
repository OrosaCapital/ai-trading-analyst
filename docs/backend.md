AI Trading Analyst — Backend Architecture
======================================

Purpose
- The relay provides normalized market data and indicator compute services for the trader UI and other consumers. It centralizes adapters (Kraken WS, CoinMarketCap REST, CoinGlass REST), computes technical indicators via a compute endpoint, and distributes normalized events via an event bus (local EventEmitter with optional Redis pub/sub).

Key components (current code)
- `server/relay.js` — Express server with REST proxies and a WebSocket upgrade handler at path `/relay`. Routes of interest:
  - `GET /proxy/cmc/ohlcv` — proxy to CoinMarketCap historical OHLC (requires `X-CMC_PRO_API_KEY` header or `CMC_API_KEY` env).
  - `GET /proxy/coinglass/funding` — proxy to Coinglass funding endpoint (optional `COINGLASS_API_KEY`).
  - `GET /normalize/kraken` — helper that canonicalizes a user symbol to Kraken pair using `src/lib/adapters/krakenPairMap.js`.
  - `POST /compute/indicators` — compute indicators from provided `candles` or fetch historical via a `symbol` parameter.
  - `GET /debug/subscriptions` — debug view of connected WS clients and pair subscriptions (auth via `RELAY_KEY` optional).
- `src/lib/eventBus.js` — EventEmitter-backed bus exposing `eventBus` (local emitter) and `publishNormalized(event)` helper. If `REDIS_URL` is set and reachable, it will use `ioredis` to publish/subscribe on the `market:events` channel and forward Redis messages to the local emitter.
- `src/lib/adapters/krakenPairMap.js` — Kraken pair discovery and normalization helper. Builds a cache of Kraken `AssetPairs`, exposes `fetchKrakenPairs()` and `normalizeForKraken(input)`.
- `src/adapters/krakenAdapter.js` — Kraken WebSocket adapter. Connects to `wss://ws.kraken.com`, subscribes to `ohlc`, and calls `publishNormalized()` with a normalized `type: 'ohlc'` event.
- `src/adapters/cmcAdapter.js` — CoinMarketCap REST adapter. Fetches latest quotes and publishes `type: 'quote'` events via `publishNormalized()`.
- `src/adapters/coinglassAdapter.js` — Coinglass REST adapter. Fetches funding/open-interest metrics and publishes `type: 'funding'` events.
- `src/lib/indicators.js` — Indicator library used by the compute endpoint (SMA, EMA, RSI, MACD, VWAP, ATR, Bollinger, Keltner, ADX, etc.).

Runtime state & caches
- `server/relay.js` currently uses small in-memory Maps:
  - `historyCache` — caches historical candles by key `${canon}|${interval}|${count}` with TTL `HISTORY_CACHE_TTL` (default 60s).
  - `computeCache` — caches compute results by a hashed key (simpleHash) with TTL `COMPUTE_CACHE_TTL` (default 30s).
  - `clientSubscriptions`, `pairSubscribers`, `pairToChannel`, `channelToPair` — in-memory subscription bookkeeping used by the WS relay.
- There is a simple per-IP rate limiter implemented in `server/relay.js` using `rateMap` to protect REST endpoints.

Event and payload shape
- `publishNormalized(event)` augments the event with canonical fields and then:
  1) emits locally on `eventBus` (`bus.emit('normalized', out)`), and
  2) publishes to Redis channel `market:events` if Redis is connected.

- Typical normalized event fields (the adapter code shows these keys):
  - `id` (uuid), `ts` (ms), `fetchedAt` (ms), `latencyMs`, `provider` (e.g., `kraken`, `coinmarketcap`), `source` (e.g., `ws`, `rest`), `type` (e.g., `ohlc`, `quote`, `funding`), `symbol` or `pair`, and `data` (payload object).

- Example OHLC event published by the Kraken adapter (approx):
  {
    "id": "...",
    "ts": 1691234567000,
    "provider": "kraken",
    "source": "ws",
    "type": "ohlc",
    "symbol": "XBTUSD",
    "data": { "time": 1691234520, "open": 0.5, "high": 0.51, "low": 0.49, "close": 0.505, "volume": 123.4 }
  }

- Compute endpoint response (`POST /compute/indicators`) returns:
  {
    "ok": true,
    "indicators": { ... arrays of values ... },
    "last": { ... latest scalar values ... }
  }

Compute endpoint behavior (implementation notes)
- Accepts body: `{ candles?: [...], symbol?: 'XRP', interval?: 1, count?: 240, indicators?: [ 'ema9', 'rsi14' ] }`.
- If `candles` not provided but `symbol` is, the relay will call Kraken public REST `OHLC` to fetch history using `normalizeForKraken(symbol)`. The fetched result is cached in `historyCache`.
- Indicator computations operate on arrays exported by `src/lib/indicators.js` and only compute requested indicators when `indicators` is supplied.
- Results are cached in `computeCache` keyed by a simple hash of the payload (function `simpleHash`) for `COMPUTE_CACHE_TTL` seconds to avoid repeated heavy work.

WebSocket relay behavior
- The HTTP server upgrades `/relay` to a WebSocket endpoint. Clients send JSON messages like `{ action: 'subscribe', pair: 'XRP', interval: 1 }`.
- On `subscribe`, the server normalizes the pair with `normalizeForKraken`, registers the client, and subscribes to Kraken via its own `krakenClient` connection when the first client for a pair appears.
- Kraken `subscriptionStatus` messages are stored in `pairToChannel` / `channelToPair` maps so subsequent data arrays (which come with channel IDs) can be attributed to the canonical pair and forwarded only to subscribed clients.
- On `unsubscribe` or client `close`, the server cleans up and will unsubscribe from Kraken when no more local subscribers remain.

Where to look in code (precise paths)
- `server/relay.js` — main server and WS relay
- `src/lib/eventBus.js` — `eventBus` (EventEmitter) and `publishNormalized()` helper
- `src/lib/adapters/krakenPairMap.js` — pair normalization utilities
- `src/adapters/krakenAdapter.js` — Kraken WS adapter (publishes `type: 'ohlc'`)
- `src/adapters/cmcAdapter.js` — CoinMarketCap adapter (publishes `type: 'quote'`)
- `src/adapters/coinglassAdapter.js` — Coinglass adapter (publishes `type: 'funding'`)
- `src/lib/indicators.js` — indicator implementations

Operational notes & gotchas
- Redis: `eventBus` uses `ioredis` with `lazyConnect: true`. If Redis is not running or `REDIS_URL` is incorrect, the bus logs warnings but falls back to the local emitter. To enable multi-instance replication, run Redis and set `REDIS_URL`.
- Environment variables used:
  - `REDIS_URL` (default `redis://127.0.0.1:6379`)
  - `PORT` (default `4000`)
  - `CMC_API_KEY`, `COINGLASS_API_KEY` (optional for adapters)
  - `RELAY_KEY` (optional simple auth for HTTP + WS debug endpoints)
  - `HISTORY_CACHE_TTL`, `COMPUTE_CACHE_TTL` (seconds)
- Rate limiting: a simple per-IP limiter is implemented in `server/relay.js` using an in-memory `rateMap` (reset every minute). For production, replace with a robust rate-limiter or API gateway.
- Logs: adapter code prints connection status (e.g., `krakenAdapter: connected`). Use `nohup node server/relay.js > relay.log 2>&1 &` and `tail -f relay.log` for long-running deployments.
