# CoinGlass API Integration

## Overview

This project integrates with the CoinGlass API v4 to fetch real-time cryptocurrency futures market data. CoinGlass provides comprehensive derivatives market data including funding rates, exchange pairs, and market coverage statistics.

**Base URL:** `https://open-api-v4.coinglass.com`

**Authentication:** All requests require the `CG-API-KEY` header with a valid API key stored in Supabase secrets as `COINGLASS_API_KEY`.

---

## Implemented Edge Functions

### 1. Supported Coins

**Function:** `fetch-coinglass-coins`

**Endpoint:** `GET /api/futures/supported-coins`

**Description:** Retrieves a list of all cryptocurrency symbols supported for futures trading across exchanges.

**Request:**
```typescript
const { data } = await supabase.functions.invoke('fetch-coinglass-coins');
```

**Response:**
```typescript
{
  success: true,
  coins: ["BTC", "ETH", "BNB", "SOL", ...],
  count: 150
}
```

**Use Case:** Populating symbol selectors, validating user input, displaying available trading pairs.

---

### 2. Exchange Pairs

**Function:** `fetch-exchange-pairs`

**Endpoint:** `GET /api/futures/supported-exchange-pairs`

**Description:** Fetches all trading pairs across all supported exchanges with detailed exchange statistics.

**Request:**
```typescript
const { data } = await supabase.functions.invoke('fetch-exchange-pairs');
```

**Response:**
```typescript
{
  success: true,
  pairs: [
    {
      exchangeName: "Binance",
      symbol: "BTCUSDT",
      symbolLogo?: "https://..."
    },
    ...
  ],
  totalPairs: 5420,
  exchanges: [
    {
      name: "Binance",
      pairCount: 245,
      symbols: ["BTCUSDT", "ETHUSDT", ...]
    },
    ...
  ],
  exchangeCount: 12
}
```

**Use Case:** Displaying exchange coverage, showing market depth, comparing exchange offerings.

**UI Component:** `ExchangeCoverage.tsx`

---

### 3. Funding Rate History (OHLC)

**Function:** `fetch-funding-history`

**Endpoint:** `GET /api/futures/funding-rate/history`

**Operation ID:** `fr-ohlc-histroy`

**Description:** Retrieves historical funding rate data in OHLC (Open, High, Low, Close) candlestick format for specified futures trading pairs.

**Request Parameters:**

| Parameter | Type | Required | Description |
|----------|------|----------|-------------|
| `exchange` | string | Yes | Name of futures exchange (e.g., "Binance", "OKX"). |
| `symbol` | string | Yes | Trading pair symbol (e.g., "BTCUSDT"). Supported pairs come from `supported-exchange-pair`. |
| `interval` | string | Yes | OHLC interval. Supported: `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `4h`, `6h`, `8h`, `12h`, `1d`, `1w`. |
| `limit` | integer | No | Number of results. Default 1000, max 1000. |
| `start_time` | integer | No | Start timestamp in milliseconds. |
| `end_time` | integer | No | End timestamp in milliseconds. |

**Request Example:**
```typescript
const { data } = await supabase.functions.invoke('fetch-funding-history', {
  body: {
    symbol: "BTC",           // Required: Trading pair symbol
    exchange: "Binance",     // Required: Exchange name
    interval: "8h",          // Required: OHLC interval
    limit: 100,              // Optional: Max 1000, defaults to 1000
    start_time: 1658880000000, // Optional: Start timestamp
    end_time: 1658966400000    // Optional: End timestamp
  }
});
```

**Response Example:**
```json
{
  "code": "0",
  "msg": "success",
  "data": [
    {
      "time": 1658880000000,
      "open": "0.004603",
      "high": "0.009388",
      "low": "-0.005063",
      "close": "0.009229"
    },
    {
      "time": 1658966400000,
      "open": "0.009229",
      "high": "0.01",
      "low": "0.007794",
      "close": "0.01"
    }
  ]
}
```

**Internal Response Format:**
```typescript
{
  success: true,
  symbol: "BTC",
  exchange: "Binance",
  interval: "8h",
  candles: [
    {
      time: 1658880000000,    // Timestamp in milliseconds
      open: 0.004603,         // Opening funding rate
      high: 0.009388,         // Highest funding rate
      low: -0.005063,         // Lowest funding rate
      close: 0.009229         // Closing funding rate
    },
    ...
  ],
  stats: {
    count: 100,
    average: 0.0045,
    min: -0.005063,
    max: 0.009388
  }
}
```

**Plan Limitations:**
- Available in all plans.
- **Hobbyist:** interval must be **≥ 4h**
- **Startup:** interval must be **≥ 30m**
- **Standard / Professional / Enterprise:** no interval limitation

**Important Notes:**
- Ideal for funding-rate candlestick visualization.
- Ensure the pair is supported via `supported-exchange-pair` endpoint.
- Funding rate values may be positive or negative.
- You may omit `start_time`/`end_time` and rely on `limit` for recent data.

**Use Case:** Charting funding rate trends, analyzing market sentiment, identifying leverage imbalances.

**UI Component:** `FundingRateChart.tsx` - Displays line chart with avg/min/max statistics.

---

### 4. Current Funding Rate

**Function:** `fetch-current-funding`

**Endpoint:** `GET /api/futures/funding-rate/current`

**Description:** Fetches the current funding rate for a trading pair across all exchanges.

**Request:**
```typescript
const { data } = await supabase.functions.invoke('fetch-current-funding', {
  body: {
    symbol: "BTC",           // Required: Trading pair symbol
    exchange: "Binance"      // Optional: Defaults to "Binance"
  }
});
```

**Response:**
```typescript
{
  success: true,
  symbol: "BTC",
  exchange: "Binance:BTCUSDT",
  rate: 0.0045,              // Current funding rate (percentage)
  timestamp: 1658880000000   // When this rate was recorded
}
```

**Use Case:** Real-time funding rate display in sidebar, alerts on extreme funding rates.

**UI Component:** `Sidebar.tsx` - Shows current funding rate with color-coded indicators.

**Auto-refresh:** Every 8 hours (standard funding rate interval).

---

## Implementation Patterns

### Edge Function Structure

All CoinGlass edge functions follow this pattern:

```typescript
// 1. CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 2. Handle OPTIONS preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// 3. Extract and validate parameters
const { symbol, exchange = 'Binance' } = await req.json();
if (!symbol) throw new Error('Symbol is required');

// 4. Get API key from secrets
const apiKey = Deno.env.get('COINGLASS_API_KEY');

// 5. Build request URL with params
const url = new URL('https://open-api-v4.coinglass.com/api/...');
url.searchParams.append('symbol', symbol);

// 6. Make authenticated request
const response = await fetch(url.toString(), {
  headers: {
    'CG-API-KEY': apiKey,
    'accept': 'application/json',
  },
});

// 7. Parse and validate response
const data = await response.json();
if (data.code !== '0') throw new Error(data.msg);

// 8. Return formatted response
return new Response(JSON.stringify({
  success: true,
  ...processedData
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

### Client-Side Usage

#### React Hook Pattern

```typescript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'function-name',
        { body: { symbol: 'BTC' } }
      );
      if (error) throw error;
      if (result?.success) setData(result);
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, [symbol]);
```

#### Custom Hook Example

See `src/hooks/useFundingRate.ts` for a complete implementation with auto-refresh.

---

## Error Handling

### Common Errors

1. **Symbol is required**
   - Cause: Missing or empty `symbol` parameter
   - Fix: Always pass a valid symbol (e.g., "BTC", not "BTCUSDT")

2. **CoinGlass API returned 402**
   - Cause: API key limit exceeded or invalid
   - Fix: Check API key validity, upgrade plan, or implement rate limiting

3. **CoinGlass API error**
   - Cause: Invalid parameters or API issue
   - Fix: Check `msg` field in error response, validate input parameters

### Error Response Format

```typescript
{
  success: false,
  error: "Error message",
  // Additional fallback fields with safe defaults
}
```

---

## Rate Limiting

CoinGlass API has rate limits (exact limits depend on your plan). Best practices:

1. **Cache responses** - Store frequently accessed data in state/store
2. **Batch requests** - Combine multiple operations when possible
3. **Debounce user input** - Wait for typing to finish before fetching
4. **Use polling intervals** - Don't fetch more often than data updates (e.g., 8h for funding rates)

---

## Symbol Formatting

**Important:** CoinGlass expects base symbols without the quote currency:

```typescript
✅ Correct: "BTC", "ETH", "SOL"
❌ Wrong: "BTCUSDT", "ETHUSDT", "SOLUSDT"

// Always clean symbols before sending:
const cleanSymbol = symbol.replace("USDT", "").replace("USD", "");
```

---

## Testing

Test CoinGlass integration using:

```bash
# Test current funding rate
curl --request POST \
  --url https://[project-id].supabase.co/functions/v1/fetch-current-funding \
  --header 'apikey: [anon-key]' \
  --header 'content-type: application/json' \
  --data '{"symbol": "BTC", "exchange": "Binance"}'

# Test funding history
curl --request POST \
  --url https://[project-id].supabase.co/functions/v1/fetch-funding-history \
  --header 'apikey: [anon-key]' \
  --header 'content-type: application/json' \
  --data '{"symbol": "BTC", "interval": "8h", "limit": 10}'
```

---

## UI Components Using CoinGlass Data

| Component | Function | Purpose |
|-----------|----------|---------|
| `ExchangeCoverage.tsx` | `fetch-exchange-pairs` | Shows exchange coverage stats |
| `FundingRateChart.tsx` | `fetch-funding-history` | Charts funding rate trends |
| `Sidebar.tsx` | `fetch-current-funding` | Real-time funding rate display |
| `TickerRibbon.tsx` | `fetch-coinglass-coins` | Symbol rotation (planned) |

---

## Configuration

### Secrets Setup

1. Navigate to Lovable Cloud → Secrets
2. Add secret: `COINGLASS_API_KEY`
3. Enter your CoinGlass API key
4. Edge functions automatically access via `Deno.env.get('COINGLASS_API_KEY')`

### Edge Function Configuration

All functions are public (no JWT verification) in `supabase/config.toml`:

```toml
[functions.fetch-coinglass-coins]
verify_jwt = false

[functions.fetch-exchange-pairs]
verify_jwt = false

[functions.fetch-funding-history]
verify_jwt = false

[functions.fetch-current-funding]
verify_jwt = false
```

---

## Roadmap

Potential future integrations:

- [ ] Open Interest history
- [ ] Long/Short ratio data
- [ ] Liquidations map
- [ ] Exchange-specific metrics
- [ ] Real-time funding rate updates via WebSocket
- [ ] Historical comparison across exchanges

---

## Resources

- **CoinGlass API Docs:** https://coinglass.com/api
- **Supported Exchanges:** Via `fetch-exchange-pairs` endpoint
- **Rate Limits:** Check your CoinGlass plan details

---

## Version History

- **v1.0** - Initial integration with 4 core endpoints
- Symbol validation and cleaning
- OHLC chart support for funding rates
- Exchange coverage statistics
