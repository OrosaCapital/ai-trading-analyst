# API Ninjas - Crypto Price API Documentation

**Base URL:** `https://api.api-ninjas.com`

**Authentication:** All requests require the `X-Api-Key` header with your API key.

**Monthly Limit:** 3,000 API calls per month on standard plan

## Available Endpoints

### 1. Current Price - `/v1/cryptoprice`

Get the current price for any cryptocurrency symbol.

**Method:** GET  
**Endpoint:** `https://api.api-ninjas.com/v1/cryptoprice`

#### Parameters
- `symbol` (required) - Cryptocurrency symbol (e.g., `BTCUSD`, `ETHUSD`, `XRPUSD`)

#### Headers
- `X-Api-Key` (required) - Your API key

#### Response Fields
- `symbol` - The cryptocurrency trading pair symbol
- `price` - The current price of the cryptocurrency pair
- `timestamp` - Unix timestamp in seconds

#### Example Request
```bash
curl -X GET "https://api.api-ninjas.com/v1/cryptoprice?symbol=BTCUSD" \
  -H "X-Api-Key: YOUR_API_KEY"
```

#### Example Response
```json
{
  "symbol": "BTCUSD",
  "price": "43250.50",
  "timestamp": 1637895596
}
```

---

### 2. Historical Price Data - `/v1/cryptopricehistorical`

Get historical price data in OHLCV format (Open, High, Low, Close, Volume). Data is returned in descending order (most recent first).

**Method:** GET  
**Endpoint:** `https://api.api-ninjas.com/v1/cryptopricehistorical`

#### Parameters
- `symbol` (required) - Cryptocurrency symbol (e.g., `BTCUSD`, `ETHUSD`, `XRPUSD`)
- `interval` (optional) - Time interval between data points
  - Valid values: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`
  - Default: `5m`
- `start` (optional) - Start timestamp in Unix format (seconds)
  - If not provided, defaults to 24 hours ago
- `end` (optional) - End timestamp in Unix format (seconds)
  - If not provided, defaults to current time
- `limit` (optional) - Maximum number of data points to return
  - Default: 100
  - Maximum: 1000

#### Headers
- `X-Api-Key` (required) - Your API key

#### Response Fields (Array of Objects)
Each object contains:
- `open` - Opening price of the cryptocurrency
- `high` - Highest price during the interval
- `low` - Lowest price during the interval
- `close` - Closing price of the cryptocurrency
- `volume` - Volume traded during the interval
- `close_time` - Timestamp of closing price in Unix format (milliseconds)
- `timestamp` - Timestamp in Unix format (seconds)
- `price` - Current price (same as `close`)

#### Example Request
```bash
curl -X GET "https://api.api-ninjas.com/v1/cryptopricehistorical?symbol=BTCUSD&interval=1h&limit=10" \
  -H "X-Api-Key: YOUR_API_KEY"
```

#### Example Response
```json
[
  {
    "open": "43250.50",
    "high": "43500.00",
    "low": "43100.00",
    "close": "43450.00",
    "volume": "125.50000000",
    "close_time": 1637812799999,
    "timestamp": 1637812799,
    "price": "43450.00"
  },
  {
    "open": "43450.00",
    "high": "43600.00",
    "low": "43300.00",
    "close": "43550.00",
    "volume": "98.75000000",
    "close_time": 1637816399999,
    "timestamp": 1637816399,
    "price": "43550.00"
  }
]
```

---

### 3. Crypto Symbols - `/v1/cryptosymbols` (Premium Only)

Get a list of all available cryptocurrency ticker symbols.

**Method:** GET  
**Endpoint:** `https://api.api-ninjas.com/v1/cryptosymbols`

**Note:** This endpoint requires a premium subscription.

---

## Usage Best Practices

### 1. Symbol Format
- Always use the format: `{CRYPTO}{FIAT}` (e.g., `BTCUSD`, `ETHUSD`, `XRPUSD`)
- Ensure the symbol is valid before making API calls

### 2. Historical Data Strategy
For optimal API usage when backfilling data:

**Option A: Minimal (1 call per symbol)**
- Fetch 24 hours of 5m data (288 records)
- Derive 15m and 1h candles from 5m data

**Option B: Comprehensive (3 calls per symbol)**
- Fetch 1 hour of 1m data (60 records)
- Fetch 3 hours of 5m data (36 records)
- Fetch 24 hours of 15m data (96 records)

**Option C: Hybrid (2 calls per symbol) - RECOMMENDED**
- Fetch 2 hours of 1m data (120 records) for recent precision
- Fetch 24 hours of 5m data (288 records) for historical analysis

### 3. Rate Limiting
- Monthly limit: 3,000 API calls
- Track usage in `api_ninjas_usage` table
- Implement fallback to accumulation method when limit is reached
- Cache results to avoid duplicate calls

### 4. Error Handling
Common error responses:
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Invalid or missing API key
- `429 Too Many Requests` - Rate limit exceeded
- `404 Not Found` - Symbol not found

Always check `response.ok` before parsing JSON data.

### 5. Data Quality
- Historical data may not be available for all symbols
- Some intervals may have gaps in data
- Always validate response data before insertion
- Consider implementing retry logic with exponential backoff

---

## Implementation Example

```typescript
const API_NINJAS_KEY = Deno.env.get('API_NINJAS_KEY');

async function fetchHistoricalData(symbol: string, interval: string) {
  const url = `https://api.api-ninjas.com/v1/cryptopricehistorical?symbol=${symbol}&interval=${interval}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Api-Key': API_NINJAS_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`API Ninjas error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
```

---

## Cost Optimization Tips

1. **Check existing data first** - Query your database before making API calls
2. **Batch operations** - Insert all historical records in a single transaction
3. **Smart caching** - Cache results to avoid duplicate fetches
4. **Usage tracking** - Log every API call to monitor monthly consumption
5. **Graceful degradation** - Fall back to accumulation method when limit is reached

---

## Integration with Tatum Price Logs

When inserting API Ninjas historical data into `tatum_price_logs`:

```typescript
const logsToInsert = data.map(point => ({
  symbol,
  interval,
  price: parseFloat(point.close), // Use close price
  volume: parseFloat(point.volume) || 0,
  timestamp: new Date(point.timestamp * 1000).toISOString()
}));

await supabase.from('tatum_price_logs').insert(logsToInsert);
```

**Important Notes:**
- API Ninjas returns timestamp in seconds, convert to ISO string
- Use `close` price as the primary price value
- Handle missing volume data (default to 0)
- Ensure symbol format matches between APIs (XRP vs XRPUSD)
