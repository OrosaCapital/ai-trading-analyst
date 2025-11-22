workspace_rules

All responses must be short, direct, and low token.
Do not apply fixes, refactors, or code changes until you ask Confirm.
Use auto heal for broken code. Detect the issue, propose a small patch, and ask Confirm.
Never assume missing paths, variables, or structures. Always ask.
Always state which files will be modified and why before writing code.
All code delivered must be clean, modular, and production grade.
Avoid layered, stacked, or messy code.
Document every change with a short summary of what changed, why, and the effect.
Prioritize speed, stability, readability, and maintainability.
Avoid unnecessary explanations or speculation.
No code is produced without deliberate approval.
Focus on assembling systems clearly and cleanly.

⸻

project_environment

Project uses React, Tailwind, Supabase, Edge Functions, and WebSockets.
Primary folder structure generally includes:
src/components
src/hooks
src/lib
src/utils
supabase directory for SQL and edge functions
Environment includes:
Supabase Edge Functions for data pipelines
Supabase SQL for tables and views
Database stores historical candles, tokens, user settings, and logs
WebSockets supply real time price and indicator data
Frontend receives normalized data from hooks and lib functions
HubSpot API is used for form sync and automated CRM tasks
Dashboards require clean layout, responsive panels, and indicator rendering
Crypto feeds may include price, liquidity, volume, and token metadata
Errors related to null, undefined, or missing fields must be isolated quickly
Avoid modifying database structure without explicit approval
Agent must always respect the workspace rules before modifying any code

⸻

trading_logic

Charts use OHLC candle structures with timestamp, open, high, low, close, and volume.
Indicators may include EMA, RSI, MACD, VWAP, swing points, and liquidity sweeps.
Multi timeframe logic relies on a single lower timeframe feed, usually 1 hour or lower.
Derived timeframes must be consistent and validated.
Chart layouts cannot overlap, stack, or misalign. Priority is clean and readable panels.
Data pipeline:
WebSocket feeds real time data
Database stores historical candles
Frontend hooks merge real time and stored data
Indicator calculations occur in lib or dedicated indicator files
If indicator errors occur, agent must auto heal by checking:
Missing fields
Incorrect timeframe conversion
Division by zero
Unexpected null values
Charts must work for fast switching between timeframes and tokens.
Trading dashboard requires stability, minimal flicker, and predictable render behavior.
Agent must confirm any changes before implementing.

⸻

workspace_indicator_summary

The workspace contains an additive indicator library, UI preview, presets, demos, and tests to support UI-only staging and algorithm prototyping. Use these files for reference, demos, and to wire the indicators into the trader UI.

- Indicator implementations:
	- `ai-trading-analyst/src/lib/indicators.js` — SMA, EMA, RSI, MACD, VWAP, ATR, Bollinger, Stochastic, CCI, ROC, OBV, CMF, ADX, Parabolic SAR, TRIX, Keltner.

- Presets and loader:
	- `ai-trading-analyst/src/config/indicator-presets.json` — indicator metadata and timeframe presets (1m/5m/15m/1h).
	- `ai-trading-analyst/src/lib/presets.js` — loader and `getIndicator` / `getTimeframePreset` helpers.

- Demos and validators:
	- `ai-trading-analyst/scripts/demo_indicators_run.js` — computes indicators on synthetic candles (ESM demo).
	- `ai-trading-analyst/scripts/demo_presets_run.js` — verifies presets load correctly.

- Unit tests:
	- `ai-trading-analyst/test/test_indicators_basic.js` — basic tests for SMA, Bollinger, ATR, ADX, MACD/EMA/RSI presence.
	- `ai-trading-analyst/test/run_tests.js` — lightweight runner. Run with `node ai-trading-analyst/test/run_tests.js`.

- Trader UI preview (UI-only):
	- `Dev Environment/websites/cc.com/src/trader/index.html` — staged OCAPX Trader UI page.
	- `Dev Environment/websites/cc.com/src/trader/styles.css` — styling tokens and layout.
	- `Dev Environment/websites/cc.com/src/trader/app.js` — Lightweight Charts initialization, synthetic candles, and overlays (EMA(9), Bollinger Bands, Keltner Channels).
	- Preview at: `http://localhost:3000/trader/index.html` (if dev server running via `start-dev.sh`).

- Quick run commands (from workspace root):
	- `node ai-trading-analyst/scripts/demo_indicators_run.js` — run indicator demo.
	- `node ai-trading-analyst/scripts/demo_presets_run.js` — verify presets loader.
	- `node ai-trading-analyst/test/run_tests.js` — run unit tests.

- Notes:
	- All UI changes are additive and UI-only unless otherwise requested.
	- The indicator implementations are intended for clarity and demo purposes; production systems should harden numeric stability and edge-case handling.
	- Use `ai-trading-analyst/src/config/indicator-presets.json` to seed UI toggles and timeframe presets.

If you want this summary in a separate file instead, say so and I will create `WORKSPACE_SUMMARY.md` instead.