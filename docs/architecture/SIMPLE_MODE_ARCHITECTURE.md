# Simple Mode Architecture

**Status**: Active  
**Data Sources**: Kraken API (price/candles) + CoinGlass API (derivatives)  
**Philosophy**: Minimal backend, maximum client-side processing

---

## Overview

This trading dashboard follows a **Kraken + CoinGlass** architecture:
- **Kraken Public API** provides price data, OHLC candles, and real-time WebSocket feeds
- **CoinGlass API v4** provides funding rates, open interest, and derivatives metrics
- **Local calculations** handle all technical indicators and market metrics
- **Minimal backend** stores only essential data (candles, funding rates, user watchlists)

---

## Data Sources

### 1. Kraken Public API (Primary Price Source)
**Purpose**: Real-time and historical price data

**Endpoints Used**:
- `GET /0/public/Ticker` - Current prices for all pairs
- `GET /0/public/OHLC` - Historical candle data (1m, 5m, 15m, 1h, 4h, 1d)
- `GET /0/public/AssetPairs` - Available trading pairs for discovery
- `WebSocket wss://ws.kraken.com` - Real-time price stream

**Key Features**:
- No authentication required
- Rate limits: Public endpoints allow high throughput
- Symbol translation required (BTCUSDT → XBTUSD)
- Provides up to 720 candles per request

**Storage**:
- Candles stored in `market_candles` table
- Updated hourly via `fetch-kraken-candles` edge function
- WebSocket updates cached in client state

### 2. CoinGlass API v4 (Derivatives Data)
**Purpose**: Funding rates, open interest, liquidations

**Endpoints Used**:
- Funding rate history and current rates
- Exchange coverage and pair discovery
- Liquidation data and sentiment indexes

**Key Features**:
- Requires API key
- Handles multiple exchanges (Binance, OKX, Bybit, etc.)
- Provides derivatives-specific metrics

**Storage**:
- Funding rates stored in `market_funding_rates` table
- Populated via `populate-coinglass-data` edge function

### 3. Local Generators (Fallback & Enhancement)
**Purpose**: Calculate indicators when external data unavailable

**Capabilities**:
- Technical indicators (RSI, MACD, Bollinger Bands)
- Market metrics (momentum, volatility, trend strength)
- Mock data generation for development/testing

---

## Data Refresh Patterns

### Manual Refresh (On-Demand)
When users navigate to a symbol:
- **Hook**: `useFreshSymbolData.ts`
- **Debouncing**: 30 minutes (localStorage-persisted across sessions)
- **Trigger Condition**: Checks if data is >4 hours old
- **Action**: Calls `populate-market-data` edge function
- **Purpose**: Ensure users get fresh data when viewing specific symbols
- **Persistence**: Last check time stored in localStorage per symbol

### Auto Refresh (Tracked Symbols)
For symbols marked as "tracked" by users:
- **Mechanism**: pg_cron scheduled job (every 5 minutes) - *Pending Implementation*
- **Target**: Symbols with `tracked_symbols.active = true`
- **Condition**: Only refreshes if data is >5 minutes old
- **Function**: Calls `populate-market-data` for each tracked symbol
- **Purpose**: Keep actively monitored symbols updated without user intervention

### Rate Limiting Strategy
To prevent API abuse and respect external API limits:

**Three-Layer Protection:**

1. **Edge Function Level** (30-minute cooldown)
   - Location: `populate-market-data/index.ts`
   - Checks: `market_candles.updated_at` timestamp
   - Action: Skip fetch if data fresher than 30 minutes
   - Benefit: Prevents duplicate API calls at source

2. **Hook Level** (30-minute debouncing)
   - Location: `useFreshSymbolData.ts`
   - Checks: localStorage-persisted last check time
   - Action: Skip database query if recently checked
   - Benefit: Reduces database load and edge function invocations

3. **Cron Level** (5-minute intervals with freshness checks)
   - Location: Database `refresh_tracked_symbols()` function
   - Checks: Data age before each refresh attempt
   - Action: Only fetch if data >5 minutes old
   - Benefit: Ensures tracked symbols stay current without overwhelming system

**Coordination Between Layers:**
- Manual refresh (30 min) and auto refresh (5 min) operate independently
- Manual refresh prioritizes user control and debouncing
- Auto refresh maintains background data freshness for tracked symbols
- Both respect edge function's 30-minute cooldown at API level

**Example Flow:**
```
User visits BTCUSDT page
  ↓
useFreshSymbolData checks localStorage
  ↓ (if >30 min since last check)
Queries market_candles for data age
  ↓ (if data >4 hours old)
Calls populate-market-data edge function
  ↓
Edge function checks data freshness
  ↓ (if data <30 min old)
Returns cached data, skips API call ✅
```

---

## Technical Stack

### Frontend
- **React 18** + TypeScript
- **TradingView Lightweight Charts** for visualization
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for data fetching

### Backend (Minimal)
- **Supabase Edge Functions**:
  - `fetch-kraken-candles` - Hourly candle updates
  - `populate-coinglass-data` - Funding rate updates
  - `websocket-price-stream` - Real-time price relay
  - `ai-chat` - AI analysis integration
  - `system-health-ai` - System monitoring

### Database (Supabase Postgres)
- `market_candles` - OHLC data from Kraken
- `market_funding_rates` - Funding data from CoinGlass
- `user_watchlists` - User-saved symbols
- `dashboard_versions` - Version tracking

---

## Key Components

### Trading Dashboard (`src/pages/TradingDashboard.tsx`)
Main interface displaying:
- Professional charts with TradingView Lightweight Charts
- Real-time price ticker ribbon
- KPI cards (24h volume, funding rate, volatility)
- AI analysis panel
- Alert strips for market conditions

### Chart Components
- `ProfessionalTradingChart.tsx` - Main chart with indicators
- `DayTraderChart.tsx` - Specialized day trading view
- `FundingRateChart.tsx` - CoinGlass funding visualization

### Data Hooks
- `useProfessionalChartData.ts` - Aggregates candles from `market_candles`
- `useRealtimePriceStream.ts` - WebSocket connection to Kraken stream
- `useFundingRate.ts` - Fetches CoinGlass funding data
- `useAIAnalysis.ts` - AI-powered market analysis

### Local Indicators (`src/components/trading/LocalIndicatorsPanel.tsx`)
Client-side calculations:
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Volume analysis
- Momentum indicators

---

## Data Flow

### Price Data Pipeline
```
Kraken API → fetch-kraken-candles → market_candles → useProfessionalChartData → Chart
                                                    ↓
                                            Local Indicators Panel
```

### Real-Time Updates
```
Kraken WebSocket → websocket-price-stream → useRealtimePriceStream → Live Price Header
```

### Funding Rates
```
CoinGlass API → populate-coinglass-data → market_funding_rates → useFundingRate → Funding Chart
```

---

## Symbol Translation

Kraken uses non-standard symbol formatting:
- `BTCUSDT` → `XBTUSD`
- `ETHUSDT` → `ETHUSD`
- `SOLUSDT` → `SOLUSD`

Translation handled in:
- `supabase/functions/_shared/krakenSymbols.ts`
- `supabase/functions/_shared/symbolFormatter.ts`

---

## Development Guidelines

### When Adding Features
1. **Check if external API needed** - Prefer local calculations
2. **Use existing data sources** - Kraken or CoinGlass only
3. **Cache aggressively** - Minimize API calls
4. **Calculate client-side** - Keep backend minimal

### Data Freshness & Caching Strategy

**Candle Generation Frequency:**
- New candles generated at most **once per hour** for "1h" timeframe
- Timestamps rounded to hour boundaries to ensure proper deduplication
- Database uses upsert (on conflict) to prevent duplicate hourly candles

**Freshness Check Intervals:**
- `useFreshSymbolData` hook checks data age (4-hour threshold)
- Edge function calls debounced to **max once per 5 minutes per symbol**
- Prevents excessive API calls on page renders or symbol changes

**Query Ordering:**
- Charts query most recent 500 candles (`ORDER BY timestamp DESC LIMIT 500`)
- Array reversed to chronological order for display
- Ensures charts show current data (not historical from weeks ago)

### When Debugging
1. Check `market_candles` table for data freshness
2. Verify Kraken symbol translation
3. Confirm WebSocket connection status
4. Review edge function logs in Supabase
5. Check console logs for debouncing messages (`⏭️ Skipping fresh data check`)

### Performance Optimization
- Batch candle requests (720 at a time)
- Use WebSocket for live updates only
- Cache funding rates (5-minute intervals)
- Lazy load non-critical components
- Debounce edge function calls to reduce database load

---

## API Rate Limits

### Kraken
- Public endpoints: High throughput, no strict limits
- WebSocket: Single connection per symbol recommended

### CoinGlass
- Standard tier: 1000 requests/day
- Cache funding rates to minimize calls

---

## Security

### API Keys
- CoinGlass API key stored in Supabase secrets
- Never expose keys in client code
- All external calls made through edge functions

### Database Access
- Row Level Security (RLS) enabled on all tables
- User-specific data isolated via `user_id`
- Public read for market data, authenticated write

---

## Future Considerations

### Scalability
- Current architecture handles 100+ concurrent users
- Kraken can scale to thousands of pairs
- CoinGlass data refreshes hourly

### Monitoring
- Edge function logs for API failures
- Client-side error boundaries
- WebSocket reconnection logic

### Extensibility
- Add new indicators in `lib/indicators.ts`
- Extend chart types in `components/charts/`
- New data sources should follow Kraken/CoinGlass pattern

---

## Quick Reference

**Main Entry**: `src/pages/TradingDashboard.tsx`  
**Chart Logic**: `src/hooks/useProfessionalChartData.ts`  
**Indicators**: `src/lib/indicators.ts`  
**Edge Functions**: `supabase/functions/`  
**Symbol Utils**: `supabase/functions/_shared/krakenSymbols.ts`

**Active APIs**:
- Kraken: https://api.kraken.com/0/public/
- CoinGlass: API v4 (via edge functions)

**Removed/Deprecated**:
- CoinMarketCap (replaced by Kraken)
- API Ninjas (not used)

