Here is the full organized prioritized content ...
 
## Relay / Event Bus Log (2025-11-22)

- Redis-backed event bus and adapters were added and wired into the local relay.
- Redis was installed via Homebrew and started (`brew install redis` / `brew services start redis`). `redis-cli ping` → `PONG`.
- Relay started and connected to Kraken WS; adapters publishing normalized `ohlc` events and the relay forwards normalized events to connected WS clients and Redis `market:events`.
- Smoke tests executed successfully:
	- `node test/ws_subscribe_test.js` — subscribe/unsubscribe OK (Kraken subscriptionStatus showed a formatting warning but flows worked).
	- `node test/test_compute_endpoint.js` — compute endpoint returned `ok: true` for candles and symbol tests.

Files of interest:
- `ai-trading-analyst/src/lib/eventBus.js`
- `ai-trading-analyst/src/adapters/krakenAdapter.js`
- `ai-trading-analyst/src/adapters/cmcAdapter.js`
- `ai-trading-analyst/src/adapters/coinglassAdapter.js`
- `ai-trading-analyst/server/relay.js`
- `Dev Environment/websites/cc.com/src/trader/app.js`

Quick commands used:
```
brew install redis
brew services start redis
redis-cli ping
cd ai-trading-analyst
npm install ioredis bottleneck p-retry uuid
nohup node server/relay.js > relay.log 2>&1 &
node test/ws_subscribe_test.js
node test/test_compute_endpoint.js
```

Next steps / recommendations
- Harden adapters with per-provider rate-limits and retry/backoff (use `bottleneck` + `p-retry`).
- Move caches from in-memory Maps to Redis keys/lists for multi-instance consistency.
- Add sequence IDs and persistent per-symbol snapshots (Redis lists `candles:{symbol}`).

Recorded by: dev assistant — 2025-11-22