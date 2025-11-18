# API Reliability & Data Quality Solution

## Overview

This document outlines the comprehensive solution implemented to ensure 99.9% uptime and reliable data flow from external APIs (CoinMarketCap, Coinglass, Tatum, API Ninjas).

## Problem Statement

### Original Issues
1. **Missing Data**: Funding Rate, Open Interest, and Liquidations showing "N/A"
2. **No Validation**: API responses processed without schema validation
3. **Poor Error Handling**: Errors thrown without user-friendly fallbacks
4. **Rate Limit Risks**: Potential API throttling from excessive calls
5. **Symbol Inconsistency**: BTCUSD vs BTCUSDT format confusion

## Implemented Solutions

### 1. API Response Validation (`apiValidation.ts`)

**Location**: `supabase/functions/_shared/apiValidation.ts`

**Features**:
- Schema validation for all external API responses
- Structured error and warning reporting
- Type-safe validation functions
- User-friendly error messages

**Key Functions**:
```typescript
// Validate Coinglass API responses
validateCoinglassResponse<T>(response: any, dataValidator?: (data: T) => string[]): ValidationResult<T>

// Validate array data structure
validateArrayData(data: any, minLength: number): string[]

// Validate OHLC (candlestick) data
validateOHLCData(data: any[]): string[]

// Validate liquidation data
validateLiquidationData(data: any[]): string[]

// Create standardized error responses
createErrorResponse(type, symbol, errors, warnings): any
```

**Example Usage**:
```typescript
const validation = validateCoinglassResponse(data, (responseData) => {
  const errors = validateArrayData(responseData, 1);
  if (errors.length === 0 && Array.isArray(responseData)) {
    errors.push(...validateOHLCData(responseData));
  }
  return errors;
});

if (!validation.isValid) {
  return createErrorResponse('funding_rate', symbol, validation.errors, validation.warnings);
}
```

### 2. API Monitoring & Health Tracking (`apiMonitoring.ts`)

**Location**: `supabase/functions/_shared/apiMonitoring.ts`

**Features**:
- Real-time API call tracking
- Success/failure rate monitoring
- Response time tracking
- Health statistics per endpoint
- Automatic logging of failures and slow responses

**Key Functions**:
```typescript
// Track individual API calls
trackAPICall(metrics: APICallMetrics): void

// Get health statistics for an endpoint
getEndpointHealth(endpoint: string): APIHealthStats | null

// Wrap API calls with automatic monitoring
monitoredAPICall<T>(endpoint: string, symbol: string, apiCall: () => Promise<T>): Promise<T>

// Generate health reports
generateHealthReport(): string
```

**Health Report Example**:
```
=== API Health Report ===
✅ funding_rate: 95.2% success (20/21) avg: 342ms
⚠️  open_interest: 71.4% success (15/21) avg: 1205ms
   Last error (45s ago): Invalid Coinglass response
❌ liquidations: 52.4% success (11/21) avg: 2103ms
   Last error (12s ago): Rate limit exceeded
========================
```

### 3. Rate Limiting (Existing + Enhanced)

**Location**: `supabase/functions/_shared/rateLimiter.ts`

**Features**:
- Token bucket algorithm (60 requests/minute)
- Automatic request queuing
- Statistics tracking

**Enhanced in**: `supabase/functions/_shared/coinglassClient.ts`
- Exponential backoff for 429 errors (1s, 2s, 4s)
- Retry logic with 3 attempts
- Endpoint caching to reduce DB queries

### 4. Symbol Normalization

**Current Implementation**:
```typescript
// Converts any symbol format to USDT pair
const cleanSymbol = symbol.toUpperCase()
  .replace('USDT', '')
  .replace('USD', '') + 'USDT';

// Example transformations:
// BTC → BTCUSDT
// BTCUSD → BTCUSDT  
// BTCUSDT → BTCUSDT
```

**Why USDT?**
- Most Coinglass endpoints require USDT pairs
- Binance perpetual futures use USDT as quote currency
- More consistent data availability

### 5. Graceful Degradation

**Error Response Structure**:
```typescript
{
  message: "Derivatives data not available for this symbol",
  unavailable: true,
  isMockData: false,
  errors: ["API error code 400: Upgrade plan required"],
  warnings: ["API plan upgrade required for this endpoint"],
  // Type-specific fallback data
  current: {
    rate: "N/A",
    rateValue: 0,
    sentiment: "UNAVAILABLE"
  }
}
```

**Benefits**:
- UI never crashes
- Clear error communication
- Debugging information preserved
- User-friendly messages

## File Changes Summary

### New Files Created
1. `supabase/functions/_shared/apiValidation.ts` - Validation schemas
2. `supabase/functions/_shared/apiMonitoring.ts` - Health tracking
3. `docs/API_RELIABILITY_SOLUTION.md` - This documentation

### Modified Files
1. `supabase/functions/fetch-funding-rate/index.ts`
   - Added validation before processing
   - Wrapped API calls with monitoring
   - Structured error responses

2. `supabase/functions/fetch-open-interest/index.ts`
   - Dual validation (history + exchange data)
   - Enhanced error handling
   - Monitoring integration

3. `supabase/functions/fetch-liquidations/index.ts`
   - Liquidation-specific validation
   - Response structure checks
   - Error response formatting

## Monitoring & Debugging

### View API Health
Check the edge function logs for health reports:

```bash
# View funding rate logs
supabase functions logs fetch-funding-rate

# View all API health
# Health reports auto-generate every 5 minutes
```

### Log Format Examples

**Success Log**:
```
✅ Validation passed [funding_rate] BTCUSDT
📊 Funding rate request for BTC (h1)
✅ Cache hit for funding rate
```

**Validation Failure**:
```
❌ Validation FAILED [open_interest] BTCUSDT:
  errors: ["Missing required OHLC field 'close' in data item 0"]
  warnings: ["Symbol not supported by this endpoint"]
```

**API Failure**:
```
🔴 API call failed [liquidations] BTCUSDT: CoinGlass API error: 429 Too Many Requests
Rate limited (429), waiting 2000ms (attempt 2/3)
```

**Slow Response**:
```
🐌 Slow API response [open_interest] BTCUSDT: 5234ms
```

## Best Practices

### 1. Always Validate Before Processing
```typescript
// ❌ Bad - No validation
const rate = data.data[0].close;

// ✅ Good - Validate first
const validation = validateCoinglassResponse(data);
if (!validation.isValid) {
  return createErrorResponse('funding_rate', symbol, validation.errors);
}
const rate = validation.data[0].close;
```

### 2. Use Monitored API Calls
```typescript
// ❌ Bad - No monitoring
const data = await fetchFromCoinglassV2(...);

// ✅ Good - Automatic monitoring
const data = await monitoredAPICall(
  'funding_rate',
  symbol,
  async () => await fetchFromCoinglassV2(...)
);
```

### 3. Return Structured Errors
```typescript
// ❌ Bad - Throws and crashes
throw new Error('API failed');

// ✅ Good - Returns structured response
return createErrorResponse(
  'funding_rate',
  symbol,
  ['API connection timeout'],
  ['Check network connectivity']
);
```

### 4. Log Validation Results
```typescript
// Always log validation for debugging
const validation = validateCoinglassResponse(data);
logValidationResult('funding_rate', symbol, validation);
```

## Testing Validation

### Test Invalid Response
```typescript
// Simulate API error
const invalidResponse = {
  code: '400',
  msg: 'Upgrade plan required',
  data: null
};

const validation = validateCoinglassResponse(invalidResponse);
console.log(validation);
// Output:
// {
//   isValid: false,
//   errors: ['API error code 400: Upgrade plan required', 'Data field is null'],
//   warnings: ['API plan upgrade required for this endpoint']
// }
```

### Test Missing Fields
```typescript
const incompleteData = {
  code: '0',
  data: [{ time: 123456, open: 0.0001 }] // Missing high, low, close
};

const validation = validateCoinglassResponse(incompleteData, validateOHLCData);
// Will catch missing OHLC fields
```

## Symbol Format Reference

| Input Symbol | Coinglass Endpoint | Normalized Symbol |
|--------------|-------------------|-------------------|
| BTC          | funding_rate      | BTCUSDT          |
| BTCUSD       | funding_rate      | BTCUSDT          |
| BTCUSDT      | funding_rate      | BTCUSDT          |
| ETH          | open_interest     | ETHUSDT          |
| ETHUSD       | liquidations      | ETHUSDT          |

## Rate Limit Guidelines

### Coinglass API Limits
- **Free Tier**: 60 requests/minute
- **Hobbyist**: 120 requests/minute  
- **Professional**: 600 requests/minute

### Current Protection
- Token bucket: 60 req/min (safe for free tier)
- Exponential backoff: Auto-retry on 429
- Cache: 5-minute TTL reduces API calls by ~83%

### Recommended Actions
1. Monitor `generateHealthReport()` for rate limit patterns
2. Increase cache TTL if consistent rate limits
3. Upgrade API plan if success rate < 90%

## Future Improvements

### Short-term (1-2 weeks)
1. ✅ Add validation schemas *(Done)*
2. ✅ Implement monitoring *(Done)*
3. ✅ Improve error handling *(Done)*
4. [ ] Add Sentry integration for error tracking
5. [ ] Create dashboard for API health visualization

### Medium-term (1 month)
1. [ ] Implement circuit breaker pattern
2. [ ] Add fallback data sources
3. [ ] Create automated health checks
4. [ ] Set up alerting for <90% success rates

### Long-term (3+ months)
1. [ ] Build data quality metrics dashboard
2. [ ] Implement predictive rate limit management
3. [ ] Create multi-tier caching strategy
4. [ ] Add A/B testing for different symbols

## Troubleshooting Guide

### Issue: All APIs Returning "N/A"
**Diagnosis**: Check COINGLASS_API_KEY configuration

```bash
# Verify secret exists
supabase secrets list

# Check edge function logs
supabase functions logs fetch-funding-rate --limit 50
```

### Issue: "Derivatives data not available"
**Diagnosis**: Symbol not supported or wrong format

1. Check validation logs for symbol format
2. Verify symbol exists on Coinglass
3. Try alternative symbol format (USD vs USDT)

### Issue: Rate Limit Exceeded
**Diagnosis**: Too many API calls

```typescript
// Check rate limit stats
console.log(rateLimiter.getStats());
// Output: { requestsInWindow: 58, maxRequests: 60, slotsAvailable: 2 }
```

**Solution**:
1. Increase cache TTL
2. Reduce polling frequency
3. Upgrade API tier

### Issue: Slow API Responses (>5s)
**Diagnosis**: Network or API performance issues

1. Check `averageResponseTime` in health stats
2. Review edge function logs for `🐌 Slow API response`
3. Consider timeout adjustments

## Contact & Support

For issues related to this solution:
1. Check edge function logs first
2. Review validation error messages
3. Consult health report statistics
4. Reference this documentation

**Last Updated**: 2025-11-18  
**Version**: 1.0.0  
**Maintainer**: System Architecture Team
