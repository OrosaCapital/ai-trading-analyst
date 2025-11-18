# CoinGlass API - Hobbyist Plan Documentation

## Plan Overview
- **Plan Name**: Hobbyist
- **Cost**: $29/month ($348/year - save $72)
- **Endpoints**: 70+ data endpoints
- **Rate Limit**: 30 requests/minute
- **Update Frequency**: ≤ 1 minute
- **Use Case**: Personal use
- **Support**: Priority email support

## Base URL
```
https://open-api-v4.coinglass.com
```

## Authentication
All requests require authentication using the API Key in headers:
```
CG-API-KEY: your_api_key_here
```

---

## Available Endpoints for Hobbyist Plan

### 1. MARKET DATA

#### ✅ Supported Coins
- **Endpoint**: `/futures/supported-coins`
- **Method**: GET
- **Description**: Get list of supported futures coins
- **Update Frequency**: Every 1 minute
- **Available**: Hobbyist ✅

#### ✅ Supported Exchange Pairs
- **Endpoint**: `/futures/supported-exchange-pairs`
- **Method**: GET
- **Description**: Get supported exchanges and trading pairs
- **Update Frequency**: Every 1 minute
- **Available**: Hobbyist ✅

#### ❌ Futures Pair Markets
- **Endpoint**: `/api/futures/pairs-markets`
- **Available**: Standard+ only (NOT Hobbyist)

#### ❌ Futures Coins Markets
- **Endpoint**: `/api/futures/coins-markets`
- **Available**: Standard+ only (NOT Hobbyist)

#### ✅ Price Change List
- **Endpoint**: `/futures/price-change-list`
- **Available**: Hobbyist ✅

#### ✅ Price OHLC History
- **Endpoint**: `/api/price/ohlc-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

---

### 2. OPEN INTEREST

#### ✅ Open Interest OHLC History
- **Endpoint**: `/api/futures/openInterest/ohlc-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Aggregated OI OHLC History
- **Endpoint**: `/api/futures/openInterest/ohlc-aggregated-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Aggregated Stablecoin OI OHLC
- **Endpoint**: `/api/futures/openInterest/ohlc-aggregated-stablecoin`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Aggregated Coin Margin OI OHLC
- **Endpoint**: `/api/futures/openInterest/ohlc-aggregated-coin-margin-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Open Interest by Exchange List
- **Endpoint**: `/api/futures/openInterest/exchange-list`
- **Available**: Hobbyist ✅

#### ✅ OI Chart by Exchange
- **Endpoint**: `/api/futures/openInterest/exchange-history-chart`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

---

### 3. FUNDING RATE

#### ✅ Funding Rate OHLC History
- **Endpoint**: `/api/futures/fundingRate/ohlc-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ OI-Weighted Funding Rate OHLC
- **Endpoint**: `/api/futures/fundingRate/oi-weight-ohlc-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Volume-Weighted Funding Rate OHLC
- **Endpoint**: `/api/futures/fundingRate/vol-weight-ohlc-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Funding Rate by Exchange List
- **Endpoint**: `/api/futures/fundingRate/exchange-list`
- **Available**: Hobbyist ✅

#### ✅ Cumulative Funding Rate List
- **Endpoint**: `/api/futures/fundingRate/accumulated-exchange-list`
- **Available**: Hobbyist ✅

#### ✅ Funding Arbitrage Opportunities
- **Endpoint**: `/api/futures/fundingRate/arbitrage`
- **Available**: Hobbyist ✅

---

### 4. LONG/SHORT RATIO

#### ✅ Global Long/Short Account Ratio History
- **Endpoint**: `/api/futures/global-long-short-account-ratio/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Top Trader Long/Short Ratio
- **Endpoint**: `/api/futures/top-long-short-account-ratio/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Top Trader Position Ratio
- **Endpoint**: `/api/futures/top-long-short-position-ratio/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Exchange Taker Buy/Sell Ratio
- **Endpoint**: `/api/futures/taker-buy-sell-volume/exchange-list`
- **Available**: Hobbyist ✅

---

### 5. LIQUIDATIONS

#### ✅ Pair Liquidation History
- **Endpoint**: `/api/futures/liquidation/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Coin Liquidation History
- **Endpoint**: `/api/futures/liquidation/aggregated-history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Liquidation Coin List
- **Endpoint**: `/api/futures/liquidation/coin-list`
- **Available**: Hobbyist ✅

#### ✅ Liquidation Exchange List
- **Endpoint**: `/api/futures/liquidation/exchange-list`
- **Available**: Hobbyist ✅

#### ✅ Liquidation Order
- **Endpoint**: `/api/futures/liquidation/order`
- **Available**: Hobbyist ✅

#### ❌ Liquidation Heatmaps (All Models)
- **Endpoints**: 
  - `/api/futures/liquidation/heatmap/model1`
  - `/api/futures/liquidation/heatmap/model2`
  - `/api/futures/liquidation/heatmap/model3`
  - `/api/futures/liquidation/aggregated-heatmap/model1`
  - `/api/futures/liquidation/aggregated-heatmap/model2`
  - `/api/futures/liquidation/aggregated-heatmap/model3`
- **Available**: Professional+ only (NOT Hobbyist)

#### ❌ Liquidation Maps
- **Endpoints**: 
  - `/api/futures/liquidation/map`
  - `/api/futures/liquidation/aggregated-map`
- **Available**: Standard+ only (NOT Hobbyist)

---

### 6. ORDER BOOK

#### ❌ Pair Orderbook Bid&Ask
- **Endpoint**: `/api/futures/orderbook/ask-bids-history`
- **Available**: Standard+ only (NOT Hobbyist)

#### ❌ Coin Orderbook Bid&Ask
- **Endpoint**: `/api/futures/orderbook/aggregated-ask-bids-history`
- **Available**: Standard+ only (NOT Hobbyist)

#### ❌ Orderbook Heatmap
- **Endpoint**: `/api/futures/orderbook/history`
- **Available**: Standard+ only (NOT Hobbyist)

#### ❌ Large Orderbook
- **Endpoint**: `/api/futures/orderbook/large-limit-order`
- **Available**: Standard+ only (NOT Hobbyist)

#### ❌ Large Orderbook History
- **Endpoint**: `/api/futures/orderbook/large-limit-order-history`
- **Available**: Standard+ only (NOT Hobbyist)

---

### 7. WHALE POSITIONS

#### ❌ Hyperliquid Whale Alert
- **Endpoint**: `/api/hyperliquid/whale-alert`
- **Available**: Professional+ only (NOT Hobbyist)

#### ❌ Hyperliquid Whale Position
- **Endpoint**: `/api/hyperliquid/whale-position`
- **Available**: Professional+ only (NOT Hobbyist)

---

### 8. TAKER BUY/SELL

#### ✅ Pair Taker Buy/Sell History
- **Endpoint**: `/api/futures/taker-buy-sell-volume/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Coin Taker Buy/Sell History
- **Endpoint**: `/api/futures/aggregated-taker-buy-sell-volume/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

---

### 9. SPOT MARKETS

#### ✅ Supported Spot Coins
- **Endpoint**: `/api/spot/supported-coins`
- **Available**: Hobbyist ✅

#### ✅ Supported Spot Exchange Pairs
- **Endpoint**: `/api/spot/supported-exchange-pairs`
- **Available**: Hobbyist ✅

#### ❌ Spot Coins Markets
- **Endpoint**: `/api/spot/coins-markets`
- **Available**: Standard+ only (NOT Hobbyist)

#### ❌ Spot Pairs Markets
- **Endpoint**: `/api/spot/pairs-markets`
- **Available**: Standard+ only (NOT Hobbyist)

#### ✅ Spot Price OHLC History
- **Endpoint**: `/api/spot/price/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ❌ Spot Orderbook Endpoints
- All spot orderbook endpoints are Standard+ only

#### ✅ Spot Taker Buy/Sell History
- **Endpoint**: `/api/spot/taker-buy-sell-volume/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

#### ✅ Spot Coin Taker Buy/Sell History
- **Endpoint**: `/api/spot/aggregated-taker-buy-sell-volume/history`
- **Available**: Hobbyist ✅
- **Interval Limit**: >= 4h for Hobbyist

---

### 10. OPTIONS

#### ✅ Option Max Pain
- **Endpoint**: `/api/option/max-pain`
- **Available**: Hobbyist ✅

#### ✅ Options Info
- **Endpoint**: `/api/option/info`
- **Available**: Hobbyist ✅

#### ✅ Exchange Open Interest History
- **Endpoint**: `/api/option/exchange-oi-history`
- **Available**: Hobbyist ✅

#### ✅ Exchange Volume History
- **Endpoint**: `/api/option/exchange-vol-history`
- **Available**: Hobbyist ✅

---

### 11. ON-CHAIN DATA

#### ✅ Exchange Assets
- **Endpoint**: `/api/exchange/assets`
- **Description**: Get wallet addresses and balances for major exchanges
- **Update Frequency**: Every 1 hour
- **Available**: Hobbyist ✅

#### ✅ Exchange Balance List
- **Endpoint**: `/api/exchange/balance/list`
- **Available**: Hobbyist ✅

#### ✅ Exchange Balance Chart
- **Endpoint**: `/api/exchange/balance/chart`
- **Available**: Hobbyist ✅

#### ✅ Exchange On-chain Transfers (ERC-20)
- **Endpoint**: `/api/exchange/chain/tx/list`
- **Available**: Hobbyist ✅

---

### 12. ETF DATA

#### ✅ Bitcoin ETF List
- **Endpoint**: `/api/etf/bitcoin/list`
- **Available**: Hobbyist ✅

#### ✅ Hong Kong ETF Flows History
- **Endpoint**: `/api/hk-etf/bitcoin/flow-history`
- **Available**: Hobbyist ✅

#### ✅ ETF NetAssets History
- **Endpoint**: `/api/etf/bitcoin/net-assets/history`
- **Available**: Hobbyist ✅

#### ✅ ETF Flows History
- **Endpoint**: `/api/etf/bitcoin/flow-history`
- **Available**: Hobbyist ✅

#### ✅ ETF Premium/Discount History
- **Endpoint**: `/api/etf/bitcoin/premium-discount/history`
- **Available**: Hobbyist ✅

#### ✅ ETF History
- **Endpoint**: `/api/etf/bitcoin/history`
- **Available**: Hobbyist ✅

#### ✅ ETF Price History
- **Endpoint**: `/api/etf/bitcoin/price/history`
- **Available**: Hobbyist ✅

#### ✅ ETF Detail
- **Endpoint**: `/api/etf/bitcoin/detail`
- **Available**: Hobbyist ✅

#### ✅ Ethereum ETF NetAssets History
- **Endpoint**: `/api/etf/ethereum/net-assets-history`
- **Available**: Hobbyist ✅

#### ✅ Ethereum ETF List
- **Endpoint**: `/api/etf/ethereum/list`
- **Available**: Hobbyist ✅

#### ✅ Ethereum ETF Flows History
- **Endpoint**: `/api/etf/ethereum/flow-history`
- **Available**: Hobbyist ✅

#### ✅ Grayscale Holdings List
- **Endpoint**: `/api/grayscale/holdings-list`
- **Available**: Hobbyist ✅

#### ✅ Grayscale Premium History
- **Endpoint**: `/api/grayscale/premium-history`
- **Available**: Hobbyist ✅

---

### 13. INDICATORS & INDEXES

#### ✅ RSI List
- **Endpoint**: `/api/futures/rsi/list`
- **Available**: Hobbyist ✅

#### ✅ Futures Basis
- **Endpoint**: `/api/futures/basis/history`
- **Available**: Hobbyist ✅

#### ✅ Coinbase Premium Index
- **Endpoint**: `/api/coinbase-premium-index`
- **Available**: Hobbyist ✅

#### ✅ Bitfinex Margin Long/Short
- **Endpoint**: `/api/bitfinex-margin-long-short`
- **Available**: Hobbyist ✅

#### ✅ AHR999 Index
- **Endpoint**: `/api/index/ahr999`
- **Available**: Hobbyist ✅

#### ✅ Puell Multiple
- **Endpoint**: `/api/index/puell-multiple`
- **Available**: Hobbyist ✅

#### ✅ Stock-to-Flow Model
- **Endpoint**: `/api/index/stock-flow`
- **Available**: Hobbyist ✅

#### ✅ Pi Cycle Top Indicator
- **Endpoint**: `/api/index/pi-cycle-indicator`
- **Available**: Hobbyist ✅

#### ✅ Golden Ratio Multiplier
- **Endpoint**: `/api/index/golden-ratio-multiplier`
- **Available**: Hobbyist ✅

#### ✅ Bitcoin Profitable Days
- **Endpoint**: `/api/index/bitcoin/profitable-days`
- **Available**: Hobbyist ✅

#### ✅ Bitcoin Rainbow Chart
- **Endpoint**: `/api/index/bitcoin/rainbow-chart`
- **Available**: Hobbyist ✅

#### ✅ Crypto Fear & Greed Index History
- **Endpoint**: `/api/index/fear-greed-history`
- **Available**: Hobbyist ✅

#### ✅ StableCoin MarketCap History
- **Endpoint**: `/api/index/stableCoin-marketCap-history`
- **Available**: Hobbyist ✅

#### ✅ Bitcoin Bubble Index
- **Endpoint**: `/api/index/bitcoin/bubble-index`
- **Available**: Hobbyist ✅

#### ✅ Bull Market Peak Indicators
- **Endpoint**: `/api/bull-market-peak-indicator`
- **Available**: Hobbyist ✅

#### ✅ Two Year MA Multiplier
- **Endpoint**: `/api/index/2-year-ma-multiplier`
- **Available**: Hobbyist ✅

#### ✅ 200-Week Moving Average Heatmap
- **Endpoint**: `/api/index/200-week-moving-average-heatmap`
- **Available**: Hobbyist ✅

#### ✅ Borrow Interest Rate History
- **Endpoint**: `/api/borrow-interest-rate/history`
- **Available**: Hobbyist ✅

---

## Interval Limits for Hobbyist Plan

For historical data endpoints, the Hobbyist plan has interval restrictions:
- **Minimum Interval**: >= 4 hours
- **Startup Plan**: >= 30 minutes
- **Standard+**: No limit

Affected endpoints include:
- Price OHLC History
- Open Interest histories
- Funding Rate histories
- Long/Short Ratio histories
- Liquidation histories
- Taker Buy/Sell histories
- Spot price histories

---

## Summary

### Total Available Endpoints for Hobbyist: ~70+

### ✅ Available Categories:
- Market Data (limited)
- Open Interest (all)
- Funding Rate (all)
- Long/Short Ratio (all)
- Liquidations (basic, no heatmaps/maps)
- Taker Buy/Sell (all)
- Spot Markets (limited)
- Options (all)
- On-Chain Data (all)
- ETF Data (all)
- Indicators & Indexes (all)

### ❌ NOT Available for Hobbyist:
- Futures/Spot Coins Markets & Pairs Markets
- All Liquidation Heatmaps (Models 1, 2, 3)
- All Liquidation Maps
- All Order Book endpoints
- All Whale Position endpoints

---

## Rate Limiting
- **Limit**: 30 requests per minute
- **Recommended**: Implement exponential backoff for rate limit errors (429)
- **Header**: Check `X-RateLimit-Remaining` in response headers

---

## Best Practices

1. **Cache responses** when possible (use `Cache-Control` headers)
2. **Batch requests** to stay within rate limits
3. **Use longer intervals** (>= 4h) for historical data to maximize data points
4. **Implement retry logic** with exponential backoff
5. **Monitor rate limits** via response headers

---

## Next Steps to Implement

Based on available endpoints, you can add:
1. ✅ **Fear & Greed Index History** - Show 7-30 day trends
2. ✅ **RSI Indicators** - Technical analysis metrics
3. ✅ **Futures Basis** - Spot vs Futures price spread
4. ✅ **ETF Flow Data** - Bitcoin/Ethereum ETF institutional flows
5. ✅ **On-Chain Exchange Balances** - Track exchange reserves
6. ✅ **Options Max Pain** - Options market analysis
7. ✅ **Bitcoin Indicators** - Rainbow Chart, Pi Cycle, Stock-to-Flow, etc.
8. ✅ **Coinbase Premium Index** - Premium tracking
9. ✅ **StableCoin Market Cap** - USDT, USDC, DAI trends

---

## Documentation Links
- **Official Docs**: https://docs.coinglass.com
- **Pricing**: https://www.coinglass.com/pricing
- **API Key Dashboard**: https://www.coinglass.com/account
