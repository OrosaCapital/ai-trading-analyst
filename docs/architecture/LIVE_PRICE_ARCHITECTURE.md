# Live Price Architecture

## Critical Rule: WebSocket-Only for Live Prices

**NEVER use database candles as fallback for current/live price display.**

## Data Source Separation

### WebSocket (Real-Time)
- **Source**: `useRealtimePriceStream` hook → Kraken WebSocket API
- **Purpose**: Current/live price display ONLY
- **Used By**:
  - Trading Dashboard KPI cards
  - DayTrader Chart live price overlay
  - Any "Current Price" displays
- **Fallback**: Show "Connecting..." or loading state if unavailable
- **NO DATABASE FALLBACK ALLOWED**

### Database Candles (Historical)
- **Source**: `market_candles` table → populated by `populate-market-data` edge function
- **Purpose**: 
  1. Chart rendering (historical OHLCV data)
  2. AI analysis (pattern recognition, indicators)
- **Used By**:
  - `DayTraderChart` component (historical bars)
  - `useAIAnalysis` hook (technical analysis)
  - `useProfessionalChartData` hook (indicators, patterns)
- **NEVER for current price display**

## Implementation Pattern

### ✅ CORRECT
```typescript
// Live price component
const { priceData, isConnected } = useRealtimePriceStream(symbol, true);
const currentPrice = priceData?.price ?? null;

// Display
{currentPrice 
  ? formatPrice(currentPrice) 
  : isConnected ? "Connecting..." : "WebSocket Offline"
}
```

### ❌ WRONG - DO NOT DO THIS
```typescript
// WRONG: Mixing real-time and historical data sources
const currentPrice = priceData?.price ?? candles[0]?.close;

// This causes:
// - Stale prices shown when WebSocket temporarily unavailable
// - User confusion (showing old database price as "live")
// - Defeats purpose of real-time WebSocket connection
```

## Why This Matters

1. **Data Freshness**: WebSocket provides sub-second updates. Database candles updated every 1-15 minutes depending on timeframe.

2. **User Trust**: Showing stale data as "live" destroys user confidence in the platform.

3. **Architectural Clarity**: Clear separation prevents bugs where "current price" could mean different things in different contexts.

4. **Development Cost**: Repeatedly debugging why "live prices" show old data wastes time and AI tokens.

## Edge Cases

### WebSocket Not Connected Yet
- Show: "Connecting..." with loading indicator
- Do NOT show: Last database candle price

### WebSocket Connection Lost
- Show: "Reconnecting..." or "WebSocket Offline"
- Do NOT show: Fallback to database price
- Optional: Attempt reconnection via `reconnect()` from hook

### Symbol Changed
- Show: Loading state for new symbol
- Wait for: First price update from WebSocket for new symbol
- Do NOT show: Old price from previous symbol or database

## Testing Checklist

When making changes that touch price display:

- [ ] Verify live prices ONLY come from `priceData?.price`
- [ ] Confirm no `?? candles[...]` fallback exists
- [ ] Check loading state shows when WebSocket not ready
- [ ] Verify database candles still used for charts/AI (not removed entirely)
- [ ] Test symbol change → old price doesn't briefly show
- [ ] Document any new components that display current price

## Related Files

- `src/hooks/useRealtimePriceStream.ts` - WebSocket connection management
- `src/pages/TradingDashboard.tsx` - Main live price display
- `src/components/charts/DayTraderChartContainer.tsx` - Chart with live price overlay
- `supabase/functions/websocket-price-stream/index.ts` - WebSocket proxy to Kraken
