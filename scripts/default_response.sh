#!/usr/bin/env bash
cat <<'EOF'
Sprint: Finish Relay → Dashboard E2E

Summary
- Completed end-to-end pipeline: Kraken adapter -> eventBus -> relay -> Trader UI.
- Added a live publisher `scripts/live_xrp_relay.cjs` to publish normalized XRP ticks to Redis.
- Fixed UI bug and added UI Puppeteer test to validate live-price updates.

Verification steps
1. Start Redis locally (default at `redis://127.0.0.1:6379`).
2. In `ai-trading-analyst/`: `npm ci` then `node server/relay.js`.
3. Start live publisher (optional): `node scripts/live_xrp_relay.cjs` or `nohup node scripts/live_xrp_relay.cjs &`.
4. Run tests: `npm run test:integration` and `npm run test:ui`.

Next tasks
- Add TLS / auth for relay endpoints.
- Persist metrics to Prometheus/Grafana (currently in-memory counters).
- Harden adapter error handling & observability (log rotation, rate limiting per connection).

EOF
