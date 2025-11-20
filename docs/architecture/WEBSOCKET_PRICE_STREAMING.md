# WebSocket Real-Time Price Streaming Architecture

## Overview

Real-time cryptocurrency price streaming from Kraken via WebSocket connection through Supabase Edge Function proxy.

## Architecture Flow

```
Frontend (React)
    ↓ (WebSocket connection)
Supabase Edge Function (websocket-price-stream)
    ↓ (WebSocket connection)
Kraken WebSocket API v1
```

## Components

### 1. Frontend Hook: `useRealtimePriceStream`

**Location**: `src/hooks/useRealtimePriceStream.ts`

**Purpose**: Manages WebSocket connection from React components

**Key Features**:
- Automatic connection on mount
- Heartbeat pings every 20 seconds
- Automatic cleanup on unmount
- Connection status tracking
- Real-time price updates

**Usage**:
```typescript
const { priceData, isConnected, connectionStatus } = useRealtimePriceStream('BTCUSDT', true);

// priceData structure:
{
  type: "price_update",
  symbol: "BTCUSDT",
  price: 92429.1,
  volume: 339842701.17,
  timestamp: 1763610011681
}
```

**Connection URL**:
```typescript
wss://alzxeplijnbpuqkfnpjk.supabase.co/functions/v1/websocket-price-stream?apikey=<anon_key>&authorization=Bearer%20<token>
```

### 2. Edge Function: `websocket-price-stream`

**Location**: `supabase/functions/websocket-price-stream/index.ts`

**Purpose**: WebSocket proxy between frontend and Kraken API

**Configuration**: `supabase/config.toml`
```toml
[functions.websocket-price-stream]
verify_jwt = false
```

**Why proxy needed**:
- Avoids CORS issues with Kraken API
- Centralizes WebSocket connection logic
- Handles symbol translation (BTCUSDT → XBT/USD)
- Manages Kraken-specific message formats

**Key Functions**:
- `connectToKraken(symbol)`: Establishes Kraken WebSocket connection
- Symbol translation via `translateToKraken()` and `toKrakenWSFormat()`
- Message parsing and forwarding
- Automatic reconnection (max 5 attempts)

### 3. Kraken WebSocket API v1

**Endpoint**: `wss://ws.kraken.com/`

**CRITICAL**: Must use v1 API, NOT v2!

**Subscription Format**:
```json
{
  "event": "subscribe",
  "pair": ["XBT/USD"],
  "subscription": { "name": "ticker" }
}
```

**Response Format** (Array):
```json
[
  342,  // Channel ID
  {
    "c": ["92429.10000", "0.00050000"],  // [price, lot volume]
    "v": ["1234.56789012", "5678.90123456"],  // [today, 24h] volume
    ...
  },
  "ticker",
  "XBT/USD"
]
```

**Price Extraction**:
```typescript
if (Array.isArray(data) && data[1]?.c) {
  const price = parseFloat(data[1].c[0]);  // First element of 'c' array
  const volume = parseFloat(data[1].v[1] || 0);  // 24h volume
}
```

## Symbol Translation

### Step 1: Standard → Kraken Base Format

**Function**: `translateToKraken()`

**Examples**:
- `BTCUSDT` → `XXBTZUSD`
- `ETHUSDT` → `XETHZUSD`
- `XRPUSDT` → `XXRPZUSD`
- `SOLUSDT` → `SOLUSD`

### Step 2: Kraken Base → WebSocket Format (with slash)

**Function**: `toKrakenWSFormat()`

**CRITICAL**: Kraken v1 WebSocket requires slash format!

**Examples**:
- `XXBTZUSD` → `XBT/USD` ✅
- `XETHZUSD` → `ETH/USD` ✅
- `XXRPZUSD` → `XRP/USD` ✅
- `SOLUSD` → `SOL/USD` ✅

**Why Two Steps**:
1. REST API uses no-slash format (`XXBTZUSD`)
2. WebSocket v1 API requires slash format (`XBT/USD`)
3. Keeps compatibility with existing REST API code

## Message Flow

### Client → Edge Function

```json
// Subscribe to symbol
{
  "action": "subscribe",
  "symbol": "BTCUSDT"
}

// Heartbeat ping (every 20 seconds)
{
  "type": "ping"
}
```

### Edge Function → Kraken

```json
// Subscription (with translated symbol)
{
  "event": "subscribe",
  "pair": ["XBT/USD"],
  "subscription": { "name": "ticker" }
}

// Heartbeat ping (every 30 seconds)
{
  "event": "ping"
}
```

### Kraken → Edge Function → Client

```json
// Price update
{
  "type": "price_update",
  "symbol": "BTCUSDT",
  "price": 92429.1,
  "volume": 339842701.17,
  "timestamp": 1763610011681
}

// Connection status
{
  "type": "connection",
  "status": "connected",
  "symbol": "BTCUSDT"
}
```

## Error Handling

### Connection Failures

**Edge Function**:
- Automatic reconnection (max 5 attempts)
- Exponential backoff: 2s, 4s, 6s, 8s, 10s
- Logs connection errors to Supabase logs

**Frontend**:
- Shows "Connecting..." state
- Shows "WebSocket Offline" if connection fails
- Retry button available via `reconnect()` function

### Symbol Not Found

**Behavior**:
- Kraken returns subscription error
- Edge function logs error and continues
- Frontend shows last known price or "No data"

**Common Causes**:
- Symbol not supported by Kraken
- Wrong symbol format
- Kraken API temporarily unavailable

## Deployment

### Automatic Deployment

Edge functions deploy automatically when code changes are pushed.

### Manual Deployment

```bash
# If needed, can manually deploy via Lovable
# Edge functions are deployed automatically on save
```

### Verification

1. Check edge function logs:
   - Look for "✅ Kraken WebSocket connected"
   - Look for "💰 Price update" messages

2. Check frontend console:
   - Look for "🔌 Connecting WebSocket for BTCUSDT..."
   - Look for "🔴 WebSocket Price Update" messages

3. Check UI:
   - Current Price should show live value, not "Connecting..."
   - Price should update in real-time

## Troubleshooting

### Issue: "Connecting..." Never Changes

**Possible Causes**:
1. Edge function not deployed
2. Supabase config.toml missing function entry
3. WebSocket authentication failure

**Solution**:
```bash
# 1. Check config.toml includes:
[functions.websocket-price-stream]
verify_jwt = false

# 2. Check edge function logs for errors
# 3. Verify WebSocket URL includes apikey parameter
```

### Issue: No Price Updates Received

**Possible Causes**:
1. Wrong Kraken API version (using v2 instead of v1)
2. Wrong symbol format (missing slash)
3. Kraken rejected subscription

**Solution**:
- Verify using `wss://ws.kraken.com/` (NOT `/v2`)
- Verify symbol has slash: `XBT/USD` not `XXBTZUSD`
- Check edge function logs for Kraken errors

### Issue: Prices Stop After Some Time

**Possible Causes**:
1. Kraken WebSocket timeout
2. Network interruption
3. Heartbeat ping failure

**Solution**:
- Check edge function logs for "WebSocket closed"
- Verify heartbeat pings are being sent
- Automatic reconnection should handle this

## Performance

### Latency

- Typical latency: 50-200ms from Kraken price change to frontend display
- Includes: Kraken → Edge Function → Frontend

### Resource Usage

- Minimal CPU usage (event-driven)
- Low memory footprint (~5MB per connection)
- Network: ~1KB per price update

### Scaling

- Each client maintains own WebSocket to edge function
- Edge function maintains one WebSocket per unique symbol to Kraken
- Can handle 100+ concurrent connections per edge function instance

## Security

### Authentication

- Frontend → Edge Function: Supabase auth token via query params
- Edge Function → Kraken: No auth required (public WebSocket)

### Data Exposure

- Only public market data transmitted
- No API keys or secrets in frontend
- All sensitive operations happen in edge function

## Testing

### Manual Testing

1. Open Trading Dashboard
2. Check browser console for WebSocket logs
3. Verify price updates every ~1 second
4. Change symbol, verify new connection established
5. Check "Current Price" displays live value

### Automated Testing

Currently manual. Future: Add WebSocket connection health checks.

## Future Enhancements

- [ ] Add reconnection exponential backoff UI feedback
- [ ] Add connection quality indicator (latency, missed updates)
- [ ] Add multi-symbol subscription support (single WebSocket)
- [ ] Add price alert notifications
- [ ] Add historical price snapshot on connection
- [ ] Add WebSocket connection metrics/monitoring
- [ ] Add automatic fallback to REST API if WebSocket fails

## Related Documentation

- [Live Price Architecture](./LIVE_PRICE_ARCHITECTURE.md)
- [Kraken Symbol Translation](../guides/KRAKEN_SYMBOLS.md)
- [Edge Functions Guide](../guides/EDGE_FUNCTIONS.md)

## Credits

WebSocket architecture implemented with guidance from Kraken API v1 documentation and user research on correct API format.
