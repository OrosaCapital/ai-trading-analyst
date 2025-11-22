# Tests & Verification

Smoke tests included in this repo are simple sanity checks for the relay's WebSocket and compute endpoints.

Run them from the `ai-trading-analyst` folder after the relay is running:

```bash
cd "/Users/franciscoorosa/Desktop/Rumble & Local Dev Project/ai-trading-analyst"
node test/ws_subscribe_test.js
node test/test_compute_endpoint.js
```

What they do
- `ws_subscribe_test.js` — connects to `ws://localhost:4000/relay` and performs a subscribe/unsubscribe flow to ensure the relay forwards subscription acknowledgements.
- `test_compute_endpoint.js` — posts sample `candles` and `symbol` payloads to `POST /compute/indicators` and expects `ok:true` with arrays of indicator values in the response.

When tests fail
- Capture server logs and paste the relevant tail lines. See `troubleshooting.md` for common failures.
