# Price Relay Rollout Plan

## Objective
Stand up a real-time relayer that ingests Kraken (and future) WebSocket feeds, normalizes ticks/candles, streams live data through Supabase Realtime, and asynchronously persists canonical candles into `historical_candles`. This keeps UI decisions synced to a single low-latency source while preserving complete history for analytics.

## Architecture Snapshot
1. **Source Feeds** – Kraken WS (ticker + OHLC). Future providers plug in via adapter interface.
2. **Price Relay Function (new)** – `supabase/functions/price-relay` (Deno)
   - Maintains provider connections per symbol/timeframe
   - Runs normalization + indicator pre-compute
   - Publishes to Realtime channel `price_relay:{symbol}`
   - Enqueues completed bars to a durable queue (Supabase table or edge task) for historical storage
3. **Historical Writer Worker** – simple loop or cron that drains queue into `historical_candles` with idempotent upserts.
4. **Frontend Hooks** – subscribe to `price_relay` channel, merge frames with local chart state, fall back to historical fetch on reconnect.

## Rollout Phases
### Phase 0 – Prereqs (parallel agent)
- Provision Supabase project (`nwxbepslzlecpmkariir`).
- Create base schema: `historical_candles`, `live_ticks`, `relay_jobs` (if queue), RLS policies.

### Phase 1 – Relay Skeleton
- Scaffold `supabase/functions/price-relay/index.ts`.
- Shared utils: provider adapters, normalizer, Realtime publisher, queue client.
- Config entry in `supabase/config.toml` (`verify_jwt=false`).

### Phase 2 – Provider Integration
- Implement Kraken adapter (subscribe/unsubscribe, heartbeat, reconnect).
- Normalize payload → `{ symbol, price, volume, bid, ask, timestamp }`.
- Candle builder (1m default) with EMA-ready payload.

### Phase 3 – Distribution & Storage
- Publish ticks/candles to Supabase Realtime channel (presence optional).
- Queue finished candles (e.g., insert into `relay_jobs` table).
- Writer task (Edge Function or cron) upserts into `historical_candles` with `ON CONFLICT (symbol, timeframe, timestamp)`.

### Phase 4 – Frontend Wiring
- Hook `useRealtimePriceStream` to new channel.
- `useStreamingChartData` merges live candles with historical.
- Kill legacy point-to-point WS proxies.
- Add Fear & Greed sentiment tile powered by relay metadata (or sentiment endpoint) and mapped to existing `--sentiment-*` palette.

### Phase 5 – Observability & Hardening
- Structured logs (symbol, latency, dropped packets).
- Health endpoint returning provider status.
- Alerting when drift between live/historical exceeds threshold.

## Deliverables
- `supabase/functions/price-relay/index.ts` + tests/mocks
- Schema migration creating job tables if needed
- Docs: architecture diagram, troubleshooting guide
- Updated frontend hooks referencing the relay
- Fear & Greed indicator spec (data pipeline + UI placement)
- Crypto News widget brief (placement + data-source contract)

## Open Questions
1. Preferred queue mechanism? (table vs. Edge Task vs. external)
2. Target timeframes beyond 1m?
3. Should relay compute lightweight indicators (EMA/VWAP) server-side now or later?
4. Should fear & greed be broadcast through the relay or fetched from a dedicated sentiment service?
5. Auth requirements for downstream consumers?
6. News source selection:
   - **CryptoPanic API** (aggregated sentiment + filters; requires API key for historical features).
   - **CoinDesk / CoinTelegraph RSS** (simple HTTP fetch + XML parsing; no auth, but limited metadata).
   - **NewsAPI / Finbold / Messari** (REST feeds with API keys; richer tagging but rate limits).
   - Need to decide who hosts parsing (Edge function vs. frontend) and cadence (pull every N minutes).

## Success Criteria
- Frontend receives <250ms relay latency relative to Kraken feed.
- All candles persisted without gaps for supported symbols/timeframes.
- Relay auto-reconnects within 5s and emits status events for UI.
- Single source of truth (no UI using direct provider feeds).

*Document owner: Codex agent. Keep updated as rollout progresses.*
