# Lovable CoinGlass Integration Package

## Overview
Complete CoinGlass API integration with Hobbyist plan support, retry logic, caching, and comprehensive error handling.

## Components

### 1. Core Services

#### `_shared/services/coinglassService.ts`
- Retry with exponential backoff (3 attempts)
- Automatic cache fallback on failure
- Comprehensive logging and metrics
- 60-second cache TTL

#### `_shared/services/coinglassChartService.ts`
- Hobbyist plan interval enforcement (4h/1d only)
- Automatic fallback from 4h to 1d
- Interval validation and normalization
- User-friendly error messages

#### `_shared/services/tatumService.ts`
- Tatum API integration with retry
- Price data fetching
- Rate limit handling

### 2. Middleware

#### `_shared/middleware/cacheMiddleware.ts`
- Get/set cached data with TTL
- Stale cache serving on API failure
- Automatic cache invalidation
- Supabase market_data_cache integration

### 3. Monitoring

#### `_shared/monitoring/logger.ts`
- Structured JSON logging
- Log levels: debug, info, warn, error
- Context-aware logging
- API call tracking

#### `_shared/monitoring/metrics.ts`
- In-memory metrics tracking
- Metric aggregation
- Key metrics:
  - `coinglass_success_count`
  - `coinglass_failure_count`
  - `derivatives_na_count`
  - `cache_fallback_count`
  - `coinglass_interval_fallback`

### 4. Edge Functions

#### `fetch-chart-data`
- Multi-timeframe chart generation
- Hobbyist plan interval restrictions
- Automatic 4h/1d fallback
- RSI, EMA, volume analysis
- Trading signals generation

#### `fetch-funding-rate`
- Funding rate data with validation
- Cache integration
- Sentiment analysis

#### `fetch-open-interest`
- Open interest tracking
- Exchange breakdown
- Historical data

#### `fetch-liquidations`
- Liquidation data with heatmap
- Major event detection
- Long/short analysis

#### `fetch-long-short-ratio`
- Trader positioning
- Exchange-level data
- Sentiment classification

#### `fetch-taker-volume`
- Buy/sell volume tracking
- CVD calculation
- Market pressure analysis

#### `health-derivatives`
- Endpoint health monitoring
- Plan restriction detection
- Status reporting

### 5. Utilities

#### `_shared/symbolFormatter.ts`
- Symbol normalization (BTCUSDT → BTC)
- Endpoint support validation
- Plan tier checking
- Blocked endpoint responses

#### `_shared/coinglassClient.ts`
- Unified API client
- Endpoint management
- Request validation

### 6. Frontend Components

#### Updated Components
- `EnhancedMarketMetrics.tsx` - Shows "Refreshing..." instead of "N/A"
- `TechMetricCard.tsx` - Graceful N/A handling
- All metric displays now use fallback UI

## Hobbyist Plan Restrictions

### Supported Intervals
- ✅ **4h** (4 hours)
- ✅ **1d** (1 day)

### Unsupported Intervals
- ❌ 1m, 5m, 15m, 1h (automatically fallback to 4h)

### Supported Symbols
Major cryptocurrencies only:
- BTC, ETH, BNB, XRP, ADA, SOL, DOGE, MATIC, DOT, AVAX

### Endpoint Support Matrix

| Endpoint | Hobbyist Support | Major Coins | Extended Coins |
|----------|-----------------|-------------|----------------|
| `funding_rate` | Major only | ✅ | ❌ |
| `open_interest` | Major only | ✅ | ❌ |
| `rsi` | Major only | ✅ | ❌ |
| `futures_basis` | Major only | ✅ | ❌ |
| `long_short_ratio` | Extended | ✅ | ✅ |
| `taker_volume` | Extended | ✅ | ✅ |
| `liquidations` | Extended | ✅ | ✅ |

## Error Handling Flow

```
API Call
    ↓
Retry (3x with backoff)
    ↓
Interval Fallback (4h → 1d)
    ↓
Cache Fallback (up to 5 min old)
    ↓
Graceful UI Degradation
```

## Usage Examples

### Fetch Chart Data
```typescript
import { supabase } from "@/integrations/supabase/client";

const { data } = await supabase.functions.invoke('fetch-chart-data', {
  body: { 
    symbol: 'BTC',  // Use base symbol only
    days: 7
  }
});
```

### Fetch Derivatives
```typescript
const { data: fundingRate } = await supabase.functions.invoke('fetch-funding-rate', {
  body: { symbol: 'BTC', interval: 'h1' }
});

const { data: openInterest } = await supabase.functions.invoke('fetch-open-interest', {
  body: { symbol: 'BTC' }
});
```

### Health Check
```typescript
const { data: health } = await supabase.functions.invoke('health-derivatives');
console.log(health.endpoints); // Status of all endpoints
```

## Configuration

### Required Secrets
- `COINGLASS_API_KEY` - Your CoinGlass API key
- `SUPABASE_URL` - Supabase project URL (auto-configured)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-configured)

### Cache Configuration
Default TTL: 60 seconds
Stale cache tolerance: 300 seconds (5 minutes)

## Metrics Tracking

Key metrics automatically tracked:
- `coinglass_success_count` - Successful API calls
- `coinglass_failure_count` - Failed API calls by attempt
- `derivatives_na_count` - N/A responses by endpoint
- `cache_fallback_count` - Cache served instead of live data
- `coinglass_interval_fallback` - Interval adjustments
- `coinglass_chart_success` - Chart data fetches
- `coinglass_chart_failure` - Chart data failures

## Troubleshooting

### 500 Errors
1. Check `COINGLASS_API_KEY` is set
2. Verify symbol format (use base only: BTC not BTCUSDT)
3. Check interval restrictions (4h/1d only)
4. Review edge function logs

### N/A Data
1. Check Hobbyist plan restrictions
2. Verify symbol is supported (major coins only)
3. Review cache for stale data
4. Check endpoint support matrix

### Blank Charts
1. Ensure 4h or 1d interval used
2. Check symbol normalization
3. Verify API key validity
4. Review network logs

## Best Practices

1. **Always use base symbols**: BTC, ETH, not BTCUSDT
2. **Respect interval limits**: Only request 4h or 1d
3. **Handle N/A gracefully**: Show "Refreshing..." not raw "N/A"
4. **Check endpoint support**: Use `isEndpointSupported()` before calling
5. **Monitor metrics**: Track failures to detect issues early
6. **Use caching**: Leverage cache to reduce API calls
7. **Log everything**: All failures logged with context

## Future Enhancements

- [ ] WebSocket integration for real-time data
- [ ] Historical data aggregation
- [ ] Custom interval aggregation (e.g., 2h from 1h data)
- [ ] Advanced caching strategies
- [ ] Rate limit prediction
- [ ] Multi-exchange aggregation
- [ ] Automatic plan detection

## Support

For issues or questions:
1. Check edge function logs in Lovable Cloud
2. Review console logs in browser
3. Verify API key and plan tier
4. Consult [CoinGlass API docs](https://coinglass.com/api)
5. Check [Lovable docs](https://docs.lovable.dev)

---

**Package Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: ✅ Production Ready
