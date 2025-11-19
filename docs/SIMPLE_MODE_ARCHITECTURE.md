# Simple Mode Architecture

## Overview

This trading dashboard operates in **Simple Mode** - a streamlined architecture using only local chart calculations and minimal external API dependencies.

## Core Principles

1. **Local-First**: All technical indicators calculated locally from chart data
2. **Minimal APIs**: Only Tatum for price data and WebSocket for real-time updates
3. **No Derivatives**: No external derivative data (funding rates, OI, liquidations)
4. **Self-Contained**: All analytics run client-side from chart stream

## Data Sources

### Active APIs
- **Tatum API**: Historical price data only
- **WebSocket Stream**: Real-time price updates via `websocket-price-stream` edge function

### Removed APIs
- ❌ CoinGlass (derivatives)
- ❌ CoinMarketCap (market data)
- ❌ API Ninjas (historical data)
- ❌ All other external APIs

## Technical Stack

### Frontend
- **TradingView Lightweight Charts**: Chart rendering
- **Local Indicators**: All calculations done in browser
  - EMA (9, 21, 50)
  - RSI-14
  - ATR
  - Volume analysis
  - Trend detection

### Backend (Minimal)
- **tatum-price-logger**: Logs prices at intervals (1m, 5m, 10m, 15m, 1h)
- **websocket-price-stream**: Real-time price WebSocket relay

### Database
Essential tables only:
- `profiles`: User data
- `user_watchlists`: User preferences
- `tatum_price_cache`: Tatum API caching
- `tatum_price_logs`: Price history

## Key Components

### Trading Dashboard (`src/pages/TradingDashboard.tsx`)
Main interface with:
- TradingView chart
- Local indicators panel
- Session statistics
- Alert system

### Local Indicators Panel (`src/components/trading/LocalIndicatorsPanel.tsx`)
Client-side technical analysis:
- Trend Score (0-3)
- RSI-14
- ATR %
- Volume Pressure
- Momentum
- Price sparkline

### Chart Data Hook (`src/hooks/useProfessionalChartData.ts`)
Manages candle data:
- 1m, 5m, 15m, 1h timeframes
- Aggregates from WebSocket stream
- Generates sample data on init
- No external API calls

## Development Guidelines

1. **No External API Integration**: Do not add new external API dependencies
2. **Local Calculations Only**: All indicators must be computed from chart data
3. **WebSocket Priority**: Use WebSocket for real-time data, never polling
4. **Simple & Fast**: Keep architecture minimal and performant

## File Structure

```
src/
├── pages/
│   └── TradingDashboard.tsx         # Main dashboard
├── components/
│   └── trading/
│       ├── LocalIndicatorsPanel.tsx  # Client-side indicators
│       ├── TradingCommandCenter.tsx  # Symbol search & controls
│       └── TradingViewChart.tsx      # Chart wrapper
├── hooks/
│   ├── useProfessionalChartData.ts  # Candle data management
│   └── useRealtimePriceStream.ts    # WebSocket connection
└── lib/
    └── indicators.ts                 # Technical indicator calculations

supabase/functions/
├── tatum-price-logger/              # Price logging
├── websocket-price-stream/          # WebSocket relay
└── _shared/                         # Shared utilities
```

## Security Notes

- All database tables use Row Level Security (RLS)
- User data isolated by `user_id`
- Public read access for price data
- Minimal external API exposure

## Performance Optimizations

1. **Local Indicators**: No API latency
2. **WebSocket**: Single connection for real-time updates
3. **No Polling**: Zero redundant API calls
4. **Memoization**: Cached calculations in React
5. **Minimal Backend**: Only essential edge functions

## Future Considerations

If adding features:
- Maintain local-first approach
- Avoid external API dependencies
- Keep calculations client-side
- Preserve simple architecture
