# 🚀 CoinGlass Package Deployment Guide

## Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Lovable Cloud enabled
- [ ] CoinGlass API key obtained
- [ ] Supabase project configured
- [ ] `market_data_cache` table exists

### ✅ Configuration
- [ ] `COINGLASS_API_KEY` secret set in Lovable Cloud
- [ ] `SUPABASE_URL` available (auto-configured)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` available (auto-configured)

## Files Created/Updated

### 📁 Core Services (New)
```
supabase/functions/_shared/services/
├── coinglassService.ts          ✅ Created - Retry + cache logic
├── coinglassChartService.ts     ✅ Created - Chart handling
└── tatumService.ts              ✅ Created - Tatum integration
```

### 📁 Middleware (Updated)
```
supabase/functions/_shared/middleware/
└── cacheMiddleware.ts           ✅ Enhanced - Full cache implementation
```

### 📁 Monitoring (Updated)
```
supabase/functions/_shared/monitoring/
├── logger.ts                    ✅ Enhanced - Structured logging
└── metrics.ts                   ✅ Enhanced - Metrics tracking
```

### 📁 Edge Functions (Updated)
```
supabase/functions/
├── fetch-chart-data/index.ts    ✅ Updated - New service integration
└── health-derivatives/index.ts  ✅ Created - Health monitoring
```

### 📁 Frontend Components (Updated)
```
src/components/
├── symbol/TechMetricCard.tsx    ✅ Updated - N/A handling
└── EnhancedMarketMetrics.tsx    ✅ Updated - Refreshing UI
```

### 📁 Documentation (New)
```
docs/
├── COINGLASS_README.md              ✅ Created - Main readme
├── COINGLASS_PACKAGE.md             ✅ Created - Full docs
├── COINGLASS_QUICK_REFERENCE.md     ✅ Created - Quick ref
├── COINGLASS_CHANGELOG.md           ✅ Created - Version history
├── COINGLASS_DEPLOYMENT.md          ✅ Created - This file
├── DERIVATIVES_FIX_INSTRUCTIONS.txt ✅ Created - Fix guide
└── FETCH_CHART_DATA_FIX.txt        ✅ Created - Chart fixes
```

## Deployment Steps

### 1. Verify Configuration

```bash
# Check secrets exist
Lovable Cloud -> Settings -> Secrets
- COINGLASS_API_KEY: ✓
- SUPABASE_URL: ✓ (auto)
- SUPABASE_SERVICE_ROLE_KEY: ✓ (auto)
```

### 2. Deploy Edge Functions

All edge functions deploy automatically when you save changes in Lovable. No manual deployment needed.

To verify deployment:
1. Go to Lovable Cloud -> Functions
2. Check status of:
   - `fetch-chart-data`
   - `fetch-funding-rate`
   - `fetch-open-interest`
   - `fetch-liquidations`
   - `fetch-long-short-ratio`
   - `fetch-taker-volume`
   - `health-derivatives`

### 3. Test Health Check

```bash
# Via Lovable Cloud
Open browser console on your app page:

const { data } = await supabase.functions.invoke('health-derivatives');
console.log(data);

# Expected output:
{
  "ok": true,
  "symbol": "BTC",
  "timestamp": "2025-11-18T...",
  "endpoints": {
    "funding_rate": { "ok": true },
    "open_interest": { "ok": true },
    "long_short_ratio": { "ok": true },
    "liquidations": { "ok": true }
  }
}
```

### 4. Test Chart Data

```typescript
const { data, error } = await supabase.functions.invoke('fetch-chart-data', {
  body: { symbol: 'BTC', days: 7 }
});

console.log('Chart data:', {
  success: !error,
  candles: data?.candles1h?.length || 0,
  signals: data?.signals?.length || 0,
  trend: data?.trend1h
});
```

Expected output:
```json
{
  "success": true,
  "candles": 42,
  "signals": 3,
  "trend": "bullish"
}
```

### 5. Test Derivatives

```typescript
// Test each endpoint
const tests = [
  { name: 'funding-rate', body: { symbol: 'BTC', interval: 'h1' } },
  { name: 'open-interest', body: { symbol: 'BTC' } },
  { name: 'long-short-ratio', body: { symbol: 'BTC' } },
  { name: 'liquidations', body: { symbol: 'BTC' } }
];

for (const test of tests) {
  const { data, error } = await supabase.functions.invoke(`fetch-${test.name}`, {
    body: test.body
  });
  console.log(test.name, { ok: !error && !data?.unavailable });
}
```

### 6. Verify Frontend

1. Open your app at `/symbol/BTC`
2. Check metrics display:
   - [ ] Funding Rate shows data or "Refreshing..."
   - [ ] Open Interest shows data or "Refreshing..."
   - [ ] Long/Short Ratio shows data or "Refreshing..."
   - [ ] Liquidations show data or "Refreshing..."
   - [ ] No raw "N/A" or "Unavailable" text

3. Check chart:
   - [ ] Chart loads with data
   - [ ] Shows 4h or 1d candles
   - [ ] No console errors

### 7. Monitor Logs

```bash
# In Lovable Cloud
1. Go to Functions tab
2. Select a function (e.g., fetch-chart-data)
3. View Logs

# Look for:
✅ "Chart data fetched successfully"
✅ "Cache hit" messages
⚠️  "Using fallback interval" (expected for Hobbyist)
❌ Any error messages
```

## Post-Deployment Verification

### ✅ Functional Tests

| Test | Expected Result |
|------|----------------|
| Health check passes | All endpoints return status |
| Chart loads for BTC | 4h or 1d candles display |
| Funding rate shows | Data or "Refreshing..." |
| Open interest works | Data or "Refreshing..." |
| Cache is working | Second load is faster |
| Metrics logged | Console shows metrics |
| Errors logged | Failures show in logs |

### ✅ Performance Tests

| Metric | Target | How to Check |
|--------|--------|-------------|
| First load time | < 2s | Network tab in DevTools |
| Cached load time | < 100ms | Second page visit |
| API success rate | > 95% | Function logs |
| Cache hit rate | > 90% | Metric logs |

### ✅ Error Handling Tests

Test these scenarios:
1. **Invalid symbol**: Use `XYZ` → Should show "Refreshing..."
2. **Rate limit**: Rapid requests → Should use cache
3. **Network error**: Offline → Should show cached data
4. **Invalid interval**: Request 1m → Should fallback to 4h

## Rollback Plan

If issues occur:

### Quick Rollback
1. Disable problematic function in Lovable Cloud
2. Use previous version from git history
3. Redeploy stable version

### Gradual Rollback
1. Revert individual files:
   ```bash
   # Find previous version in Lovable history
   # Restore specific file
   ```

2. Test incrementally:
   - Revert services first
   - Then middleware
   - Then edge functions
   - Finally frontend

## Monitoring Setup

### Key Metrics to Watch

```typescript
// Set up monitoring alerts for:
- coinglass_failure_count > 10/hour
- derivatives_na_count > 50/hour
- cache_fallback_count > 100/hour
```

### Log Patterns to Monitor

```bash
# Success patterns
"Chart data fetched successfully"
"Cache hit"
"Metric tracked"

# Warning patterns
"Using fallback interval"
"Serving stale cache"
"Retry attempt"

# Error patterns
"All retries exhausted"
"No cached data available"
"API call failed"
```

## Troubleshooting

### Issue: 500 Errors

**Symptoms**: Edge function returns 500
**Diagnosis**:
```bash
1. Check function logs for error stack
2. Verify COINGLASS_API_KEY is set
3. Test with curl
```

**Fix**:
```bash
1. Verify API key: Lovable Cloud -> Secrets
2. Check symbol format: Use BTC not BTCUSDT
3. Verify interval: Use 4h or 1d
4. Review logs for specific error
```

### Issue: No Data Showing

**Symptoms**: UI shows "Refreshing..." indefinitely
**Diagnosis**:
```typescript
// Check in browser console
const { data } = await supabase.functions.invoke('fetch-funding-rate', {
  body: { symbol: 'BTC' }
});
console.log(data);
```

**Fix**:
1. Check if `data.unavailable === true`
2. Review `data.message` for reason
3. Verify symbol is supported
4. Check Hobbyist plan restrictions

### Issue: Slow Performance

**Symptoms**: Loads take > 5 seconds
**Diagnosis**:
```bash
1. Check cache hit rate in logs
2. Review network tab in DevTools
3. Check function cold start times
```

**Fix**:
1. Increase cache TTL if appropriate
2. Implement request batching
3. Consider instance upgrade if needed

## Success Criteria

### ✅ Deployment Complete When:

- [ ] All edge functions deployed
- [ ] Health check passes
- [ ] Chart data loads for BTC
- [ ] Derivatives show data or "Refreshing..."
- [ ] No console errors
- [ ] Cache working (see hit rate in logs)
- [ ] Metrics tracking (see in logs)
- [ ] Error handling working (tested manually)
- [ ] Documentation reviewed
- [ ] Team notified

## Support Contacts

- **CoinGlass**: https://coinglass.com/api
- **Lovable**: https://docs.lovable.dev
- **Discord**: https://discord.gg/lovable

## Next Steps

After successful deployment:

1. **Monitor for 24 hours**
   - Watch error rates
   - Check cache performance
   - Review user feedback

2. **Optimize if needed**
   - Adjust cache TTL
   - Tune retry settings
   - Optimize queries

3. **Document any issues**
   - Update troubleshooting guide
   - Add to FAQ
   - Share with team

4. **Plan enhancements**
   - See COINGLASS_CHANGELOG.md for roadmap
   - Prioritize based on usage
   - Gather user feedback

---

**Deployment Guide Version**: 1.0.0
**Package Version**: 1.0.0
**Last Updated**: 2025-11-18

🎉 **Ready to deploy!** Follow the steps above for a smooth rollout.
