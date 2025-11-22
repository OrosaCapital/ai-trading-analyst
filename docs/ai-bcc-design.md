# AI BCC (Brain Command Center) – Design Proposal

## 1. Mission
Deliver a real‑time decision layer that ingests multi‑exchange data (Kraken, CoinMarketCap, CoinGlass, future order‑flow feeds), computes indicators, reasons over risk and intent, and outputs trade directives + UI status with measurable accuracy goals.

## 2. Key Data Inputs
| Feed | Purpose | Transport | Latency Target |
| --- | --- | --- | --- |
| Kraken WS OHLC / Trades | Base candles + live fills | Relay WS fan‑out | < 300 ms |
| CoinMarketCap REST | Market cap, RSI/volatility refs, alt data | Relay REST pull + cache | < 2 s |
| CoinGlass Funding / Long-Short | Sentiment + leverage skew | Relay REST pull + cache | < 2 s |
| Order Flow (Binance/Bybit/etc.) | Book delta & flow for AI BCC | Stream adapters -> bus | < 400 ms |

## 3. Architecture Overview
1. **Ingestion Layer** – Adapter microservices per provider with retry, rate shaping, signed secrets, and Redis/Timescale buffers.  
2. **Event Bus (NATS/Kafka)** – Normalizes payloads into `market.tick`, `indicator.update`, `risk.alert`.  
3. **Signal Engine** – Runs ai-trading-analyst indicator suite, multi-timeframe aggregation, and health scoring.  
4. **AI BCC Core** – Hybrid rule engine + ML models:
   - *State Model*: maintains per-symbol context (trend regime, liquidity, funding).  
   - *Decision Model*: gradient boosted bands / RL policy evaluating long/short/flat with confidence.  
   - *Risk Layer*: position sizing, exposure caps, compliance toggles.  
5. **Action & Telemetry** – Emits `bcc.decision` events, updates Trader Dashboard, and can trigger broker executors.  
6. **Persistence** – Postgres/Timescale for audit, feature store (Parquet/S3) for training, Redis for hot state.  
7. **Observability** – Structured logging, Prometheus metrics, alerting on feed drop or confidence decay.

## 4. Decision Flow
1. Ingestion pushes normalized tick -> Bus.  
2. Signal Engine updates indicators (EMA, RSI, ATR, VWAP, order-flow metrics).  
3. AI BCC builds feature vector (latest indicators, funding deltas, sentiment, position state).  
4. Policy returns `action`, `confidence`, `riskScore`, `reason`.  
5. Command Center renders decision, toggles LEDs, logs to audit, and optionally sends order to execution service.  
6. Feedback (fill result, PnL) loops back for reinforcement and accuracy tracking.

## 5. Accuracy & Roadmap
| Phase | Scope | Target Accuracy (directional hit-rate) | Timeline |
| --- | --- | --- | --- |
| P0 – Indicator parity | Ensure AI BCC matches current dashboard signals | ≥ 95% agreement on indicator status | 2 weeks |
| P1 – Deterministic strategy | Rule-based long/short vs. benchmark | ≥ 58% win rate @ 1:1 RR on 1m/5m | +4 weeks |
| P2 – ML augmentation | Train on live + historical features | ≥ 62% win rate or Sharpe > 1.5 | +8 weeks |
| P3 – Autonomous execution | Closed-loop trade mgmt | Maintain drawdown < 5%, success alerts realtime | +6 weeks |

## 6. Reporting & Governance
- **Real-time:** Dashboard tiles show feeds status, AI BCC recommendation, confidence, and next action.  
- **Hourly:** Automated digest (Slack/Email) with signal coverage, trades placed, PnL, anomalies.  
- **Daily:** Accuracy metrics vs. benchmarks, feed latency, incident log.  
- **Weekly:** Model retraining summary, feature drift report, upcoming tuning tasks.

## 7. Next Implementation Steps
1. Build adapter services with durable queues + Redis caches.  
2. Stand up Kafka/NATS topics and schema contracts.  
3. Implement AI BCC Core skeleton (state store + rule engine) and wire to dashboard via Supabase channel.  
4. Add telemetry + automated reports for accuracy tracking.  
5. Iterate into ML-driven decisions once deterministic baseline validated.

> This document will evolve as we implement adapters, bus topology, and AI BCC policies.
