# Kraken Symbol Translation Guide

## Overview

Kraken uses different symbol formats for different APIs. This guide explains the translation logic.

## Symbol Formats

### 1. Standard Format (Our App)
```
BTCUSDT, ETHUSDT, XRPUSDT
```
Used throughout the application for consistency.

### 2. Kraken REST API Format (No Slash)
```
XXBTZUSD, XETHZUSD, XXRPZUSD
```
Used for Kraken REST API endpoints.

### 3. Kraken WebSocket v1 Format (With Slash)
```
XBT/USD, ETH/USD, XRP/USD
```
**REQUIRED** for Kraken WebSocket v1 API subscriptions.

## Translation Functions

### `translateToKraken(symbol: string)`

**Purpose**: Convert standard format to Kraken REST API format

**Location**: `supabase/functions/_shared/krakenSymbols.ts`

**Examples**:
```typescript
translateToKraken('BTCUSDT')  // → 'XXBTZUSD'
translateToKraken('ETHUSDT')  // → 'XETHZUSD'
translateToKraken('SOLUSDT')  // → 'SOLUSD'
translateToKraken('BNBUSDT')  // → 'BNBUSD'
```

**Auto-Detection**:
If symbol not in map, automatically removes 'T' from USDT:
```typescript
translateToKraken('PAXGUSDT')  // → 'PAXGUSD' (auto-detected)
```

### `toKrakenWSFormat(krakenSymbol: string)`

**Purpose**: Convert Kraken REST format to WebSocket v1 format (adds slash)

**Location**: `supabase/functions/_shared/krakenSymbols.ts`

**Examples**:
```typescript
toKrakenWSFormat('XXBTZUSD')  // → 'XBT/USD'
toKrakenWSFormat('XETHZUSD')  // → 'ETH/USD'
toKrakenWSFormat('SOLUSD')    // → 'SOL/USD'
```

**Fallback Logic**:
If symbol not in map, adds slash before last 3 characters (USD):
```typescript
toKrakenWSFormat('PAXGUSD')  // → 'PAXG/USD' (fallback)
```

### `translateFromKraken(krakenSymbol: string)`

**Purpose**: Convert Kraken format back to standard format

**Examples**:
```typescript
translateFromKraken('XXBTZUSD')  // → 'BTCUSDT'
translateFromKraken('XETHZUSD')  // → 'ETHUSDT'
```

## Complete Symbol Map

| Standard | Kraken REST | WebSocket v1 | Notes |
|----------|-------------|--------------|-------|
| BTCUSDT | XXBTZUSD | XBT/USD | Bitcoin |
| ETHUSDT | XETHZUSD | ETH/USD | Ethereum |
| XRPUSDT | XXRPZUSD | XRP/USD | Ripple |
| SOLUSDT | SOLUSD | SOL/USD | Solana |
| BNBUSDT | BNBUSD | BNB/USD | Binance Coin |
| ADAUSDT | ADAUSD | ADA/USD | Cardano |
| DOGEUSDT | XDGUSD | DOGE/USD | Dogecoin |
| MATICUSDT | MATICUSD | MATIC/USD | Polygon |
| DOTUSDT | DOTUSD | DOT/USD | Polkadot |
| AVAXUSDT | AVAXUSD | AVAX/USD | Avalanche |
| LINKUSDT | LINKUSD | LINK/USD | Chainlink |
| UNIUSDT | UNIUSD | UNI/USD | Uniswap |
| ATOMUSDT | ATOMUSD | ATOM/USD | Cosmos |
| LTCUSDT | XLTCZUSD | LTC/USD | Litecoin |
| ETCUSDT | XETCZUSD | ETC/USD | Ethereum Classic |
| XLMUSDT | XXLMZUSD | XLM/USD | Stellar |
| PAXGUSDT | PAXGUSD | PAXG/USD | Paxos Gold |

## Adding New Symbols

### Step 1: Add to Map

Edit `supabase/functions/_shared/krakenSymbols.ts`:

```typescript
export const KRAKEN_SYMBOL_MAP: Record<string, string> = {
  // ... existing entries ...
  'NEWCOINUSDT': 'NEWCOINUSD',  // Add here
};
```

### Step 2: Add WebSocket Format

```typescript
// In toKrakenWSFormat() function
const wsFormatMap: Record<string, string> = {
  // ... existing entries ...
  'NEWCOINUSD': 'NEWCOIN/USD',  // Add here
};
```

### Step 3: Test

1. Add symbol to `tracked_symbols` table
2. Check WebSocket connects successfully
3. Verify price updates received

## Common Issues

### Issue: Symbol Not Found

**Error**: "Currency pair not supported"

**Cause**: Symbol not in Kraken's supported pairs

**Solution**: Check [Kraken's supported pairs](https://api.kraken.com/0/public/AssetPairs)

### Issue: WebSocket Subscription Fails

**Error**: "Currency pair not in ISO 4217-A3 format"

**Cause**: Missing slash in WebSocket format

**Solution**: Ensure `toKrakenWSFormat()` returns format with slash (e.g., `XBT/USD`)

### Issue: REST API 404

**Cause**: Using WebSocket format for REST API

**Solution**: Use `translateToKraken()` (no slash) for REST APIs

## API Version Differences

### Kraken REST API v0

- Format: `XXBTZUSD` (no slash)
- Endpoint: `https://api.kraken.com/0/public/...`
- Used by: `populate-market-data` edge function

### Kraken WebSocket v1

- Format: `XBT/USD` (with slash)
- Endpoint: `wss://ws.kraken.com/`
- Used by: `websocket-price-stream` edge function

### Kraken WebSocket v2 (NOT USED)

- Format: Different from v1
- Endpoint: `wss://ws.kraken.com/v2`
- **Deprecated in our implementation** - v1 is more reliable

## Testing Symbol Translation

```typescript
// Test complete flow
const standard = 'BTCUSDT';
const kraken = translateToKraken(standard);     // → XXBTZUSD
const ws = toKrakenWSFormat(kraken);            // → XBT/USD
const back = translateFromKraken(kraken);       // → BTCUSDT

console.assert(back === standard, 'Round-trip failed!');
```

## References

- [Kraken REST API Docs](https://docs.kraken.com/rest/)
- [Kraken WebSocket v1 Docs](https://docs.kraken.com/websockets/)
- [Supported Trading Pairs](https://api.kraken.com/0/public/AssetPairs)
