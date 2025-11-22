# Troubleshooting — ai-trading-analyst

Common issues and how to resolve them.

1) Redis connection errors (ECONNREFUSED)
- Symptom: `ioredis` logs `Error: connect ECONNREFUSED 127.0.0.1:6379` and the relay logs noisy errors.
- Fix: Ensure Redis is running. On macOS:
  ```bash
  brew services start redis
  redis-cli ping
  # should return PONG
  ```
- If Redis is remote, set `REDIS_URL` accordingly and ensure network access.

2) Relay fails to start (port in use)
- Symptom: `EADDRINUSE` or relay doesn't bind to `4000`.
- Fix: Check process using port and kill it or change `PORT` env var.
  ```bash
  lsof -i :4000 -sTCP:LISTEN -Pn
  kill <pid>
  # or
  export PORT=4100 && node server/relay.js
  ```

3) Missing API keys errors (CoinMarketCap / CoinGlass)
- Symptom: Adapters return auth/403 errors or skip publishing.
- Fix: Export `CMC_API_KEY` and `COINGLASS_API_KEY` in your shell.

4) Kraken WS subscription issues
- Symptom: SubscriptionStatus warnings about canonical pair format or messages not appearing.
- Notes: Kraken uses specific pair formats (e.g., `XXBTZUSD` for BTC/USD). Use `/normalize/kraken?symbol=` helper to canonicalize symbols.

5) Compute endpoint returns errors
- Symptom: `POST /compute/indicators` returns non-200 or `ok:false`.
- Fixes:
  - Ensure payload includes `candles` (array) or `symbol` and `interval` and that the server has access to history for that symbol.
  - Check server logs for detailed stack trace and confirm `src/lib/indicators.js` hasn't been modified incorrectly.

6) How to inspect event stream
- Use Redis subscribe to see normalized events published by adapters:
  ```bash
  redis-cli subscribe market:events
  ```

7) When in doubt: collect logs
- Redirect relay logs to a file and share the last 200 lines to diagnose problems:
  ```bash
  nohup node server/relay.js > relay.log 2>&1 &
  tail -n 200 relay.log
  ```
