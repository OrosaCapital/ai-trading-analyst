# Tatum API Documentation

## Overview
Tatum is a blockchain development platform that provides unified API access to 100+ blockchains and crypto market data. This project uses Tatum's Data API for real-time cryptocurrency price feeds.

**API Version**: v4  
**Base URL**: `https://api.tatum.io/v4`  
**Official Documentation**: https://docs.tatum.io/

---

## Plan & Pricing

### Free Plan (Current Implementation)
- **Cost**: Free forever
- **Credits**: 100,000 credits/month
- **Rate Limit**: 3 requests per second (RPS)
- **API Keys**: 2 keys included
- **Features**:
  - Full node access
  - All main and test networks
  - Analytics dashboard
  - Debugging tools
  - Community support

### Pay as You Go Plan
- **Cost**: Starting at $29/month
- **Credits**: 4,000,000 credits/month (baseline)
- **Rate Limit**: 200 requests per second (RPS)
- **API Keys**: Unlimited
- **Features**:
  - Everything in Free plan
  - Higher rate limits
  - Priority support
  - Overage charges apply beyond baseline

### Billing Model
- **Type**: Pay as you go (via Stripe)
- **Subscription Options**: Monthly or Yearly
- **Overage**: Automatic charges for usage beyond baseline allocation
- **Monitoring**: Track usage via Tatum Dashboard → Usage

---

## Authentication

All API requests require authentication using an API key in the request header:

```http
x-api-key: your_api_key_here
```

**Security**: The `TATUM_API_KEY` is stored as a Supabase secret and accessed only from edge functions, never exposed to the client.

---

## Current Implementation

### Endpoints Used

#### Get Exchange Rate by Symbol
- **Endpoint**: `/v4/data/rate/symbol`
- **Method**: GET
- **Parameters**:
  - `symbol`: Base cryptocurrency symbol (e.g., "BTC", "ETH")
  - `basePair`: Quote currency (e.g., "USD")
- **Example**: `/v4/data/rate/symbol?symbol=BTC&basePair=USD`
- **Response**:
  ```json
  {
    "value": "91698.16160000",
    "basePair": "USD",
    "timestamp": 1763430540610,
    "source": "CoinGecko",
    "symbol": "BTC"
  }
  ```
- **Credit Cost**: 1 credit per request
- **Update Frequency**: Real-time (sub-minute updates)

### Edge Functions Using Tatum

#### `fetch-tatum-price`
- **Purpose**: Fetch current cryptocurrency price
- **Call Frequency**: Every 5 seconds (live price updates)
- **Monthly Requests**: ~518,400 requests/month (assuming 24/7 operation)
- **Credit Usage**: ~518,400 credits/month
- **Status**: ⚠️ **High usage** - Exceeds Free Plan limit (100K/month)

#### `tatum-price-logger`
- **Purpose**: Log prices to database at intervals (1m, 5m, 10m, 15m)
- **Call Frequency**: Variable based on interval
- **Status**: Lower frequency, manageable usage

---

## Rate Limits & Best Practices

### Current Rate Limits
- **Free Plan**: 3 requests/second (RPS) = 180 requests/minute
- **Pay as You Go**: 200 RPS = 12,000 requests/minute

### ⚠️ Current Implementation Issues

**Problem**: Polling every 5 seconds = 12 requests/minute = 17,280 requests/day = ~518K requests/month

**Impact**:
- Exceeds Free Plan's 100K credits/month by 5x
- Will incur overage charges or rate limiting
- Inefficient API usage for data that updates less frequently

### Recommended Optimizations

#### 1. Implement Caching (High Priority)
```typescript
// Cache price data for 30 seconds
const CACHE_DURATION = 30 * 1000; // 30 seconds

async function getCachedPrice(symbol: string) {
  const { data: cached } = await supabase
    .from('tatum_price_cache')
    .select('*')
    .eq('symbol', symbol)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached) return cached.data;

  // Fetch fresh data and cache it
  const freshData = await fetchTatumPrice(symbol);
  
  await supabase.from('tatum_price_cache').insert({
    symbol,
    data: freshData,
    expires_at: new Date(Date.now() + CACHE_DURATION).toISOString()
  });

  return freshData;
}
```

**Benefits**:
- Reduces API calls from ~518K/month to ~86K/month (30-second cache)
- Stays within Free Plan limits
- Still provides near-real-time updates

#### 2. Adjust Polling Intervals
```typescript
// Instead of 5 seconds, use:
const PRICE_UPDATE_INTERVAL = 30000; // 30 seconds

// For high-frequency trading, use 10 seconds minimum
const HIGH_FREQ_INTERVAL = 10000; // 10 seconds
```

**Recommended Intervals by Use Case**:
- **Live Trading Dashboard**: 10-15 seconds
- **General Price Display**: 30-60 seconds  
- **Historical Logging**: 5+ minutes (current implementation is good)

#### 3. WebSocket Alternative (Future Enhancement)
Consider Tatum's WebSocket API for real-time updates without polling:
- More efficient for live price feeds
- Reduces API credit consumption
- Better for high-frequency requirements

---

## Available Endpoints (Not Yet Implemented)

### Exchange Rate Endpoints

#### Multiple Exchange Rates
- **Endpoint**: `/v4/data/rates`
- **Method**: GET
- **Description**: Get exchange rates for multiple cryptocurrencies in one call
- **Use Case**: Batch fetch prices for multiple coins (BTC, ETH, XRP, etc.)
- **Advantage**: More efficient than multiple single requests

#### Historical Rates
- **Endpoint**: `/v4/data/rate/history`
- **Method**: GET
- **Description**: Get historical exchange rate data
- **Use Case**: Backfill price history, charting, analysis

### Market Data Endpoints

#### OHLC Data
- **Endpoint**: `/v4/data/ohlc`
- **Description**: Get Open, High, Low, Close candlestick data
- **Use Case**: Chart visualization, technical analysis
- **Note**: Currently using computed candles from 1m logs

#### Volume Data
- **Endpoint**: `/v4/data/volume`
- **Description**: Get trading volume data
- **Current Status**: Volume set to 0 in implementation
- **Opportunity**: Replace with real volume data

---

## Integration with Other APIs

### Current Data Flow
```
Tatum API → Price Data
     ↓
Price Logger → Database (tatum_price_logs table)
     ↓
Trading Data Function → EMA Calculation
     ↓
AI Trading Decision Engine
```

### Complementary APIs
- **CoinMarketCap (CMC)**: Volume, market cap, % changes
- **CoinGlass**: Funding rates, liquidations, sentiment
- **Tatum**: Real-time prices (lowest latency)

**Why Use Multiple APIs?**
- **Redundancy**: Fallback if one API fails
- **Data Variety**: Different data types from different sources
- **Cost Optimization**: Use each API for its strengths

---

## Monitoring & Troubleshooting

### Check Current Usage
1. Visit [Tatum Dashboard](https://dashboard.tatum.io)
2. Navigate to **Usage** section
3. Monitor credit consumption

### Error Handling

#### Common Errors

**Rate Limit Exceeded (429)**
```json
{
  "unavailable": true,
  "reason": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests"
}
```
**Solution**: Implement caching, reduce polling frequency

**API Key Invalid (401)**
```json
{
  "unavailable": true,
  "reason": "AUTH_ERROR",
  "message": "Invalid API key"
}
```
**Solution**: Verify `TATUM_API_KEY` secret is set correctly

**Service Unavailable (503)**
```json
{
  "unavailable": true,
  "reason": "TATUM_API_ERROR",
  "message": "Tatum API returned 503"
}
```
**Solution**: Implement retry logic with exponential backoff

### Best Practices for Error Handling

```typescript
// Implement graceful degradation
try {
  const tatumPrice = await fetchTatumPrice(symbol);
  return tatumPrice;
} catch (error) {
  console.error('Tatum API error:', error);
  
  // Fallback to cached data if available
  const cachedPrice = await getCachedPrice(symbol);
  if (cachedPrice) return cachedPrice;
  
  // Final fallback: Use CMC price
  const cmcPrice = await fetchCMCPrice(symbol);
  return cmcPrice;
}
```

---

## Migration from Free to Paid Plan

### When to Upgrade

Consider upgrading when:
- ✅ Monthly credit usage consistently exceeds 100K
- ✅ Need higher rate limits (>3 RPS)
- ✅ Require more than 2 API keys
- ✅ Need priority support
- ✅ Building production application

### Cost Estimation

**Current Implementation (No Cache)**:
- Usage: ~518K credits/month
- Plan: Pay as You Go ($29/month for 4M credits)
- Status: Well within limits ✅

**With Caching (30-second)**:
- Usage: ~86K credits/month
- Plan: Free Plan (100K credits/month)
- Status: Within free tier ✅

**Recommendation**: Implement caching first before considering paid plan.

---

## Security Considerations

### API Key Management
- ✅ **Never** commit API keys to repository
- ✅ Store in Supabase Secrets (environment variables)
- ✅ Access only from edge functions (server-side)
- ✅ Rotate keys periodically
- ✅ Use separate keys for dev/production

### Client-Side Exposure
- ❌ **Never** call Tatum API directly from client
- ✅ Always proxy through edge functions
- ✅ Implement rate limiting on edge function level
- ✅ Add authentication to edge functions if needed

---

## Development Guidelines

### Adding New Tatum Endpoints

1. **Research the endpoint** in [Tatum API Docs](https://docs.tatum.io/reference)
2. **Check credit cost** (varies by endpoint complexity)
3. **Create edge function** following existing patterns
4. **Implement caching** if called frequently
5. **Add error handling** with fallbacks
6. **Test rate limits** before production deploy
7. **Update this documentation**

### Testing Tatum Integration

```bash
# Test edge function locally
supabase functions serve fetch-tatum-price

# Call with test data
curl -X POST http://localhost:54321/functions/v1/fetch-tatum-price \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTCUSD"}'
```

### Monitoring in Production

- Track credit usage weekly via Tatum Dashboard
- Monitor edge function logs for errors
- Set up alerts for rate limit warnings
- Review performance metrics for optimization opportunities

---

## Additional Resources

### Official Documentation
- **API Reference**: https://docs.tatum.io/reference
- **Guides**: https://docs.tatum.io/docs
- **SDK**: https://github.com/tatumio/tatum-js
- **Dashboard**: https://dashboard.tatum.io

### Support
- **Community**: Tatum Discord
- **Email**: support@tatum.io (Paid Plan)
- **Status Page**: Check API uptime and incidents

---

## Changelog

### Current Implementation
- **Endpoint**: `/v4/data/rate/symbol`
- **Frequency**: Every 5 seconds
- **Caching**: ❌ None
- **Status**: ⚠️ Exceeds Free Plan limits

### Recommended Changes
- **Priority 1**: Implement 30-second caching
- **Priority 2**: Adjust polling to 10-15 seconds
- **Priority 3**: Add error handling and fallbacks
- **Future**: Migrate to WebSocket for live updates

---

## Summary

**Current Status**: 
- ✅ Working implementation
- ⚠️ High API usage (518K credits/month)
- ❌ No caching implemented
- ❌ Exceeds Free Plan limits

**Immediate Actions Required**:
1. Implement caching (30-second duration)
2. Adjust polling interval (5s → 15s minimum)
3. Monitor usage via Tatum Dashboard
4. Consider upgrading to Paid Plan if needed

**Long-term Optimization**:
- Evaluate WebSocket implementation
- Implement batch requests for multiple symbols
- Add volume and OHLC data endpoints
- Set up automated usage monitoring and alerts
