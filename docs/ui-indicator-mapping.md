# UI → Indicator → Data Connector Mapping

This document maps the staged OCAPX Trader UI components to the indicator implementations in the workspace, and documents the data each indicator needs plus recommended data connectors (WebSocket/REST endpoints) and integration notes.

Purpose
- Provide a single reference mapping for front-end engineers to wire indicators to chart series and to choose/connect live data sources.
- Serve as documentation for building UI toggles that enable/disable overlays/subpanels and switch between demo and live data.

Files referenced
- UI preview: `Dev Environment/websites/cc.com/src/trader/index.html`
- UI script: `Dev Environment/websites/cc.com/src/trader/app.js`
- Styles: `Dev Environment/websites/cc.com/src/trader/styles.css`
- Indicator implementations: `ai-trading-analyst/src/lib/indicators.js`
- Presets JSON: `ai-trading-analyst/src/config/indicator-presets.json`
- Presets loader: `ai-trading-analyst/src/lib/presets.js`

How to read this document
- Each indicator entry lists: Implementation (function/file), UI placement, Data required, Recommended connector(s), Example endpoints, Display type in chart.

---

## UI Components (where indicators appear)

- **Main Chart** (`#tv-chart` in `index.html`): primary place for price candlesticks and overlays (moving averages, Bollinger bands, VWAP, Parabolic SAR, Keltner channels).
  - Series types: Candlestick series, LineSeries (EMAs, SMA), Area/Line (bands), ShapeSeries or markers (SAR dots).

- **Indicators Panel (right rail)** (`.indicator-list`): list of indicator controls. Toggles here should call into the chart code to add/remove series and to configure parameters (periods, mults).

- **Subpanels (bottom or separate panels)**: RSI, MACD, ATR, OBV, ADX — rendered as separate chart panes (histogram or line series) that share time scale with the main chart.

---

## Indicator Mapping (summary table)

- **SMA**
  - Implementation: `sma(values, period)` in `ai-trading-analyst/src/lib/indicators.js`
  - UI placement: Main Chart overlay
  - Data required: Close
  - Connector: Kline (candlestick) stream (WS) or REST klines
  - Recommended endpoints: Binance kline stream `wss://stream.binance.com:9443/ws/<symbol>@kline_<interval>`, REST `GET /api/v3/klines`
  - Display: LineSeries

- **EMA**
  - Implementation: `ema(values, period)`
  - UI placement: Main Chart overlay
  - Data required: Close
  - Connector: Kline stream / REST klines
  - Display: LineSeries

- **RSI**
  - Implementation: `rsi(values, period)`
  - UI placement: Subpanel
  - Data required: Close
  - Connector: Kline stream / REST klines (compute on ticks or candles)
  - Display: LineSeries (0–100)

- **MACD**
  - Implementation: `macd(values, fast, slow, signal)`
  - UI placement: Subpanel
  - Data required: Close
  - Connector: Kline stream / REST klines
  - Display: LineSeries for MACD & signal, histogram for difference

- **VWAP**
  - Implementation: `vwap(candles)` (session-aware in code)
  - UI placement: Overlay (typically session-reset daily)
  - Data required: High/Low/Close/Volume per candle
  - Connector: Kline stream with volume (WS/REST) — must reset at session boundaries
  - Display: LineSeries (overlay)
  - Note: Requires session definition (exchange timezone/session start)

- **ATR**
  - Implementation: `atr(candles, period)`
  - UI placement: Subpanel (volatility measure)
  - Data required: High/Low/Close per candle
  - Connector: Kline stream / REST klines
  - Display: LineSeries

- **Bollinger Bands**
  - Implementation: `bollinger(values, period, stdDev)`
  - UI placement: Overlay (upper/lower as bands around SMA)
  - Data required: Close
  - Connector: Kline stream / REST klines
  - Display: AreaSeries or two LineSeries + filled area

- **Stochastic (%K/%D)**
  - Implementation: `stochastic(candles, kPeriod, dPeriod)`
  - UI placement: Subpanel
  - Data required: High, Low, Close per candle
  - Connector: Kline stream / REST klines
  - Display: Two LineSeries (K and D)

- **CCI**
  - Implementation: `cci(candles, period)`
  - UI placement: Subpanel
  - Data required: High, Low, Close
  - Connector: Kline stream / REST klines

- **ROC**
  - Implementation: `roc(values, period)`
  - UI placement: Subpanel
  - Data required: Close
  - Connector: Kline stream / REST klines

- **OBV**
  - Implementation: `obv(candles)`
  - UI placement: Subpanel
  - Data required: Close, Volume
  - Connector: Trade/Volume stream (WS) or kline with volume

- **Chaikin Money Flow (CMF)**
  - Implementation: `cmf(candles, period)`
  - UI placement: Subpanel
  - Data required: High, Low, Close, Volume

- **ADX**
  - Implementation: `adx(candles, period)`
  - UI placement: Subpanel
  - Data required: High, Low, Close

- **Parabolic SAR**
  - Implementation: `parabolicSAR(candles, step, maxStep)`
  - UI placement: Overlay (via markers or small series)
  - Data required: High, Low, Close

- **TRIX**
  - Implementation: `trix(values, period, signal)`
  - UI placement: Subpanel
  - Data required: Close

- **Keltner Channels**
  - Implementation: `keltner(candles, emaPeriod, atrPeriod, mult)`
  - UI placement: Overlay (center = EMA, bands = ATR-based)
  - Data required: High, Low, Close, Volume (for ATR)

---

## Connector Recommendations (quick)

- **Binance (recommended for first integration)**
  - WS Kline stream format: `wss://stream.binance.com:9443/ws/<symbol>@kline_<interval>` (e.g. `btcusdt@kline_1m`). Message provides kline object with open, high, low, close, volume.
  - REST klines: `GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=500`
  - Note: Binance WS is browser-friendly and a good default for UI demos.

- **Kraken / Coinbase**
  - Similar streams available; Kraken uses a different protocol and may require a relay due to CORS.

- **Server Relay**
  - If CORS or cross-origin limits are an issue, implement a small edge function or Node relay that subscribes to exchange streams and re-broadcasts via a permissive endpoint to the browser. Place in `supabase/functions/` or a small `server/` folder.

---

## Incoming Data Feeds (workspace focus)

The team will focus incoming data points from these providers: **Kraken Public API**, **CoinMarketCap API**, and **Coinglass API**. Below are practical integration notes and how each feed maps to our indicators and UI needs.

### Kraken Public API
- Protocols: WebSocket (preferred for live) and REST (historical/fallback).
- WS endpoint (public): `wss://ws.kraken.com` — supports subscriptions for `ohlc` (candles), `trade`, and `book` (order book snapshots).
- REST example (historical candles): `https://api.kraken.com/0/public/OHLC?pair=<PAIR>&interval=<MINUTES>`
- Data provided: OHLC candles with volume, trade ticks, order-book snapshots.
- Auth: Public endpoints do not require API keys for market data.
- CORS: Kraken WS is usable from the browser; REST may require CORS checks in-browser — use relay if blocked.
- Rate limits: Respect Kraken public rate limits for REST; WS is typically push-based and lower overhead.
- Mapping to indicators:
  - Candles (OHLCV): All time-series indicators (SMA, EMA, RSI, MACD, Bollinger, ATR, Keltner, VWAP) — use the `ohlc` channel.
  - Trades/Volume ticks: VWAP incremental updates and high-frequency OBV/volume analytics.
  - Order book: Order-flow and liquidity indicators (depth-based signals) — useful for advanced flow indicators.

### CoinMarketCap (CMC) API
- Protocols: REST primary (market quotes, OHLC endpoints depend on plan); CMC does not offer a public WS for all market data.
- Auth: API key required (pass via `X-CMC_PRO_API_KEY` header). Rate limits depend on account tier.
- Useful endpoints: latest quotes, metadata, historical OHLCV endpoints (time series) — check account plan for granularity.
- Data provided: canonical price quotes, circulating supply, market cap, 24h volume, and (depending on plan) historical OHLCV.
- Mapping to indicators:
  - Price/Close & Volume: fallback source for historical candles where exchange-specific granularity isn't required.
  - Market-level metrics (market cap, volume_24h): useful for higher-level signals and weighting across markets (not per-candle indicators).
  - Use case: ideal for seeding initial historical data where exchange REST is insufficient; combine with exchange candles for live updates.

### Coinglass (derivatives & risk metrics)
- Protocols: REST (public endpoints) and premium endpoints for higher throughput; some metrics may require API keys.
- Data provided (examples): funding rates, open interest, large liquidations, futures metrics, funding history, perpetual swaps summary.
- Auth: API key required for some endpoints; check Coinglass docs for header name and limits.
- Mapping to indicators/UI:
  - Funding rates & open interest: feed into liquidity/risk panels (displayed in right rail or subpanel); useful for trend strength heuristics and for adding contextual overlays (e.g., high open interest + rising price → trend confirmation).
  - Liquidations data: feed to an Order Flow / Alerts panel (heatmap of recent liquidation events), and used to generate short-term momentum signals.
  - Not typically used to compute SMA/RSI/MACD, but valuable meta-data for signal weighting and position sizing logic.

---

## Practical integration guidance

- Priority feed for live candles: connect to **Kraken WS** `ohlc` for symbol-level candlesticks and use it as the source-of-truth for indicators that need per-candle values.
- Use **CoinMarketCap** REST as a reliable source of historical candles and market metadata when backend aggregation or cross-exchange comparisons are required.
- Use **Coinglass** REST to enrich the UI with derivatives metrics (funding, open interest, liquidation events) — surface these in the right-rail mini-cards, order-flow panel, or as overlays/alerts.
- If browser CORS or rate limits block direct connections, run a small relay/edge function to subscribe to Kraken WS and forward normalized messages to the browser; also proxy CMC/Coinglass REST through the relay when needed.

---

## Next steps & confirmation

If you'd like, I can scaffold adapter files for these three providers (Kraken WS adapter, CMC REST wrapper, Coinglass REST wrapper) and wire a "Live: Kraken + Coinglass" mode in the trader UI. Confirm and I'll start scaffolding the adapters next.

---

## UI wiring notes (how the UI should integrate with connectors)

1. Build an adapter interface (`connect`, `subscribeKlines`, `subscribeTrades`, `fetchHistoricalKlines`, `disconnect`) — implement in `ai-trading-analyst/src/lib/wsAdapter.js` and `restAdapter.js`.
2. Chart manager in `Dev Environment/websites/cc.com/src/trader/app.js` accepts a data source object implementing the adapter interface. Default to synthetic generator if adapter is not set or `demo` mode is selected.
3. Indicator computation: prefer doing the indicator math in the `ai-trading-analyst/src/lib/indicators.js` library (shared code) so both UI and server can call it. The UI should pass arrays of closes/candles to the functions and map outputs to chart series.
4. For volume-based indicators (VWAP/OBV/CMF) ensure the data feed includes `volume` per candle; otherwise compute these on aggregate trade feeds if the exchange provides them.
5. Session-aware indicators (VWAP) need session boundaries; provide a small helper that annotates candles with session index or resets accumulators at session start.

---

## Example mapping (control → chart action)

- Toggle `EMA(9)` in Indicators Panel
  - UI action: call `chartManager.addOverlay('ema', {period:9})`
  - chartManager: computes `ema(closes, 9)` and creates/updates a `LineSeries` with {time,value} pairs

- Enable `Bollinger(20,2)`
  - UI action: `chartManager.addBand('bollinger', {period:20,stdDev:2})`
  - chartManager: computes `bollinger(closes,period,stdDev)` and creates two `LineSeries` (upper/lower) and an `AreaSeries` fill

- Switch to `Live` mode
  - UI action: chartManager calls adapter.connect(); adapter.subscribeKlines(symbol, interval, onKline)
  - onKline: update candle buffer, recompute indicators incrementally, update series setData or update API

---

## Next steps & operational notes

- Add a simple `wsAdapter` for Binance public klines (no API key) at `ai-trading-analyst/src/lib/wsAdapter.js` and a `restAdapter.js` for historical fetch.
- Add UI toggle controls in the Indicators panel to switch demo ↔ live and to enable/disable specific overlays; use the existing `presets.json` for timeframe defaults.
- Add small integration tests that mock adapter messages and assert that chartManager updates series correctly (use the existing test folder pattern).

If you want, I can now scaffold the adapter files and the UI toggle wiring (add simple toggles to the indicator list in `index.html` and hook them in `app.js`). Say "scaffold adapters and toggle wiring" and I'll implement that next. 
