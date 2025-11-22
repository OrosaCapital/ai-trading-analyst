# Setup & Run — ai-trading-analyst (macOS / zsh)

This guide walks through installing dependencies, configuring environment variables, starting Redis, and running the relay and tests. It assumes macOS with `zsh`.

1) Node dependencies
```bash
cd "/Users/franciscoorosa/Desktop/Rumble & Local Dev Project/ai-trading-analyst"
# install runtime + helpers
npm install express node-fetch@2 ws ioredis bottleneck p-retry uuid
# or using pnpm
# pnpm install express node-fetch@2 ws ioredis bottleneck p-retry uuid
```

2) Redis (recommended)
```bash
# Install via Homebrew (if not installed)
brew install redis
# Start as a background service
brew services start redis
# Verify
redis-cli ping
# expected: PONG
```

3) Environment variables (zsh examples)
```bash
export REDIS_URL="redis://127.0.0.1:6379"
export PORT=4000
export CMC_API_KEY="your-cmc-key"
export COINGLASS_API_KEY="your-coinglass-key"
export RELAY_KEY="optional-relay-key"
```

4) Run the relay
```bash
cd "/Users/franciscoorosa/Desktop/Rumble & Local Dev Project/ai-trading-analyst"
node server/relay.js
# background
nohup node server/relay.js > relay.log 2>&1 &
tail -f relay.log
```

5) Run smoke tests (after relay is up)
```bash
node test/ws_subscribe_test.js
node test/test_compute_endpoint.js
```

6) Useful checks
- Check port: `lsof -i :4000 -sTCP:LISTEN -Pn`
- HTTP normalize test: `curl -s "http://localhost:4000/normalize/kraken?symbol=XRP" | jq -C '.'`
- Redis pub/sub channel: `redis-cli subscribe market:events`

7) Running behind a proxy
- If you are behind a corporate proxy, configure `HTTP_PROXY` and `HTTPS_PROXY` in your environment so `node-fetch` can access external APIs.
