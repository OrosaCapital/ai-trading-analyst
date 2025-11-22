## Sprint: Finish Relay → Dashboard E2E

### Summary
- Completed end-to-end pipeline: Kraken adapter -> eventBus -> relay -> Trader UI.
- Live publisher `scripts/live_xrp_relay.cjs` publishes normalized XRP ticks to Redis.
- UI fix and Puppeteer smoke test validate `#live-price` updates from the relay.

### Verification Steps
1. Start Redis locally: `redis-server` or ensure `redis://127.0.0.1:6379` reachable.
2. From `ai-trading-analyst/`: `npm ci` then `node server/relay.js`.
3. Optionally run live publisher: `node scripts/live_xrp_relay.cjs`.
4. Run tests: `npm run test:integration` and `npm run test:ui`.

### Changes
- `Dev Environment/websites/cc.com/src/trader/app.js` — UI bug fix + `fetchCanonicalSymbol`.
- `test/ui_trader_puppeteer_test.js` — Puppeteer smoke test.
- `test/integration_relay_ws_test.js` — integration WS test.
- `PR_NOTES.md` and CI workflow `.github/workflows/test-all.yml` added.

### Next Tasks
- Add TLS/auth for relay endpoints.
- Persist metrics (Prometheus/Grafana).
- Add CI runner Chromium configuration for Puppeteer (if missing in runner).

_Auto-generated template — edit as needed before opening the PR._
