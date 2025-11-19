# API Rate Limits & Credit Management

## 🚨 CoinMarketCap API (Primary Price Source)

### Current Status
- **Plan**: Basic (Free)
- **Monthly Limit**: 10,000 credits
- **Cost per Call**: 1 credit per symbol
- **Current Usage**: Monitor at https://pro.coinmarketcap.com/account

### Critical Rules

#### ❌ NEVER:
- Poll CMC API on intervals < 5 minutes
- Make individual calls per symbol (use batch endpoints)
- Call on every page load without checking cache
- Use for real-time updates (use WebSocket instead)
- Background poll or auto-refresh CMC API

#### ✅ ALWAYS:
- Check `market_snapshots` cache first (TTL: 5 minutes)
- Verify `last_updated` timestamp before calling API
- Batch requests when possible (multiple symbols per call)
- Limit `populate-market-data` runs to max 2x per hour
- Use WebSocket for real-time price updates (no credits used)

### Implementation Strategy

#### Caching Layer
```typescript
// Check cache before API call
const { data: cachedSnapshot } = await supabase
  .from('market_snapshots')
  .select('price, last_updated')
  .eq('symbol', symbol)
  .single();

const cacheAge = (Date.now() - new Date(cachedSnapshot.last_updated).getTime()) / 1000;

// Only call API if cache > 5 minutes old
if (cacheAge > 300) {
  // Call CMC API
}
```

#### Edge Function Costs
- `populate-market-data`: ~5 credits per run (5 symbols)
- `fetch-cmc-price`: 1 credit per call
- **Max recommended runs per day**: 48 (2x per hour)

### Monitoring Usage
1. Check dashboard: https://pro.coinmarketcap.com/account
2. Log each API call in edge functions
3. Track credit usage vs remaining allowance
4. Alert when > 80% monthly limit reached

### Optimization Tips
1. **Batch Requests**: Request multiple symbols in one call
   ```
   GET /v2/cryptocurrency/quotes/latest?symbol=BTC,ETH,XRP,SOL,BNB
   ```
2. **Smart Caching**: 5-minute minimum TTL
3. **WebSocket Primary**: Use CMC only for initial load
4. **Lazy Loading**: Only fetch data when user views specific symbol

### Emergency Measures (if nearing limit)
- Increase cache TTL to 15 minutes
- Disable auto-population
- Manual refresh only
- Upgrade to paid plan ($29/month = 100,000 credits)

## CoinGlass API (Funding Rates)

### Current Status
- **Plan**: Free tier
- **Limits**: Check https://coinglass.com/pricing

### Usage Guidelines
- Use only for funding rate data
- Cache aggressively (1-hour TTL)
- Not for price data

## WebSocket (Real-time Updates)

### Advantages
- **No API credits used**
- True real-time updates
- Lower latency
- Unlimited updates

### Current Implementation
- Used for live price streaming
- Primary source for real-time data
- Fallback to CMC cache if WebSocket fails

## Cost Breakdown Estimate

### Current Usage Pattern
| Function | Calls/Day | Credits/Call | Daily Cost |
|----------|-----------|--------------|------------|
| populate-market-data | 48 | 5 | 240 |
| fetch-cmc-price | 20 | 1 | 20 |
| **Total** | | | **260/day** |

### Monthly Projection
- 260 credits/day × 30 days = **7,800 credits/month**
- **80% of monthly allowance** ⚠️
- **Remaining buffer**: 2,200 credits

## Recommendations

1. **Immediate**: Implement 5-minute cache (saves ~60% calls)
2. **Short-term**: Reduce populate runs to 1x per hour (saves 50%)
3. **Long-term**: Consider paid plan if user base grows

## Upgrade Options

| Plan | Monthly Cost | Credits | Best For |
|------|-------------|---------|----------|
| Basic | Free | 10,000 | Testing/Development |
| Hobbyist | $29 | 100,000 | Small apps |
| Startup | $79 | 500,000 | Production apps |
| Standard | $299 | 3,000,000 | High-traffic apps |
