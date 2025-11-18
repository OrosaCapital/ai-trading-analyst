# CoinGlass Quick Reference

## Hobbyist Plan Limits

### ✅ Allowed Intervals
- `4h` - 4 hours
- `1d` - 1 day

### ❌ Blocked Intervals (auto-fallback to 4h)
- `1m`, `5m`, `15m`, `1h`

### ✅ Supported Symbols
BTC, ETH, BNB, XRP, ADA, SOL, DOGE, MATIC, DOT, AVAX

### Symbol Format
Always use **BASE symbol only**:
- ✅ `BTC` 
- ❌ `BTCUSDT`, `BTCUSD`, `BTC/USDT`

## Quick Commands

### Fetch Chart Data
```javascript
const { data } = await supabase.functions.invoke('fetch-chart-data', {
  body: { symbol: 'BTC', days: 7 }
});
```

### Fetch Funding Rate
```javascript
const { data } = await supabase.functions.invoke('fetch-funding-rate', {
  body: { symbol: 'BTC', interval: 'h1' }
});
```

### Check Health
```javascript
const { data } = await supabase.functions.invoke('health-derivatives');
```

## Error Messages

| Message | Meaning | Solution |
|---------|---------|----------|
| "Upgrade plan" | Endpoint blocked on Hobbyist | Use supported symbol/endpoint |
| "instrument" | Symbol not supported | Use major cryptocurrency |
| "interval" | Interval not allowed | Use 4h or 1d |
| 429 | Rate limited | Wait and retry |
| 500 | Server error | Check logs, retry |

## Endpoint Support

### Major Coins Only
- funding_rate
- open_interest
- rsi
- futures_basis

### Extended Support (includes XLM, LINK, etc.)
- long_short_ratio
- taker_volume
- liquidations

## Troubleshooting

### Getting 500 Errors?
1. Check symbol is base only (BTC not BTCUSDT)
2. Use 4h or 1d interval
3. Verify COINGLASS_API_KEY set
4. Check edge function logs

### Seeing N/A?
1. Symbol may not be supported
2. Check Hobbyist plan restrictions
3. Wait for data refresh (60s cache)
4. Use major cryptocurrency

### Blank Chart?
1. Interval must be 4h or 1d
2. Symbol format must be base only
3. Check API key validity
4. Review browser console

## Import Paths

```typescript
// Services
import { fetchCoinglassWithRetry } from '../_shared/services/coinglassService.ts';
import { fetchChartDataWithFallback } from '../_shared/services/coinglassChartService.ts';

// Utils
import { formatForCoinglass, isEndpointSupported } from '../_shared/symbolFormatter.ts';

// Monitoring
import { log } from '../_shared/monitoring/logger.ts';
import { trackMetric } from '../_shared/monitoring/metrics.ts';

// Cache
import { getCachedData, setCachedData } from '../_shared/middleware/cacheMiddleware.ts';
```

## Key Metrics

Monitor these in logs:
- `coinglass_success_count` - Successful calls
- `coinglass_failure_count` - Failed calls
- `derivatives_na_count` - N/A responses
- `cache_fallback_count` - Cache usage
- `coinglass_interval_fallback` - Interval adjustments

## Cache Settings

- **Default TTL**: 60 seconds
- **Stale Tolerance**: 300 seconds (5 min)
- **Table**: `market_data_cache`

## Best Practices

1. ✅ Always normalize symbols: `formatForCoinglass(symbol)`
2. ✅ Check support: `isEndpointSupported(symbol, endpoint)`
3. ✅ Use base symbols only
4. ✅ Respect 4h/1d interval limits
5. ✅ Log all failures
6. ✅ Handle N/A gracefully in UI
7. ✅ Leverage cache to reduce API calls

## Support Checklist

Before reporting issues:
- [ ] Using base symbol (BTC not BTCUSDT)?
- [ ] Using 4h or 1d interval?
- [ ] COINGLASS_API_KEY configured?
- [ ] Symbol in supported list?
- [ ] Checked edge function logs?
- [ ] Reviewed browser console?
- [ ] Verified cache settings?

---
**Quick Ref Version**: 1.0.0
