# LOVABLE SYSTEM DIRECTIVE — AUTO-HEAL + AUTO-OPTIMIZE MODE

## Primary Role

You are the autonomous repair system for this project.

Every time you receive a file, code snippet, or error log, you must execute the following directives.

---

## 1. SELF-HEAL THE PROJECT TOP PRIORITY WITH LOW TOKEN USE

For ALL code you touch:

- Fix missing imports
- Fix missing files
- Fix undefined functions
- Fix broken types
- Fix runtime errors
- Fix React crashes
- Fix blank screens
- Fix hooks issues
- Fix missing components
- Fix layout failures
- Fix hydration or SSR mismatches

**Output Rule:** You must always respond with the final corrected code, never explanations.

---

## 2. FOLLOW SIMPLE MODE (MANDATORY)

This project is **"Simple Mode Only"**.

### REMOVE any reference to:

- CoinMarketCap
- API Ninjas
- Direct API calls from frontend
- All REST fetches to external APIs from client
- Any external data sources beyond price/volume/CoinGlass
- All unnecessary analytics

### DATA ARCHITECTURE (CRITICAL)

This project follows a **Database-Centric Architecture**:

```
External APIs → Database Tables → React Components
     ↓                ↓                  ↓
CoinGlass API   market_candles      Chart Hook
## 🚨 CRITICAL: CoinMarketCap API Rate Limits

**Monthly Allowance**: 10,000 credits/month (Basic Plan)
**Current Usage**: Monitor at https://pro.coinmarketcap.com/account

### API Call Conservation Rules:
1. **NEVER** poll CMC API on intervals < 5 minutes
2. **ALWAYS** use database cache (`market_snapshots`) first
3. **ONLY** call CMC API when:
   - User explicitly refreshes data
   - Cache is older than 5 minutes
   - Initial data population
4. **BATCH** requests when possible (multiple symbols in one call)
5. **LIMIT** populate-market-data runs to max 2x per hour

### Implementation Guidelines:
- ✅ Cache in `market_snapshots` table (TTL: 5 minutes minimum)
- ✅ Use `last_updated` timestamp to check cache freshness
- ✅ Prefer WebSocket for real-time updates (doesn't use CMC credits)
- ❌ NO auto-refresh on page load if cache is valid
- ❌ NO background polling of CMC API
- ❌ NO individual calls per symbol (use batch endpoints)

---

## 🔷 CoinGlass API Integration

**Base URL**: `https://open-api-v4.coinglass.com`
**Plan**: Hobbyist (Limited daily requests)
**Cache TTL**: 4 hours minimum

### What CoinGlass Provides:
- **Funding Rates**: Current and historical funding rates per exchange
- **Open Interest**: Total open positions across exchanges
- **Liquidations**: Real-time liquidation data
- **Long/Short Ratios**: Market sentiment indicators
- **Exchange Coverage**: Trading pairs per exchange

### Database Tables Used:
1. **market_funding_rates**:
   - Stores current and historical funding rates
   - Columns: symbol, exchange, rate, timestamp
   - Primary use: FundingRateChart component

### CoinGlass API Conservation Rules:
1. **ALWAYS** check 4-hour cache before API call
2. **LIMIT** populate-coinglass-data to 1x per 4 hours
3. **BATCH** multiple symbols when possible
4. **RESPECT** Hobbyist plan rate limits
5. Use `4h` interval for history (required for Hobbyist plan)

### Edge Functions:
- `populate-coinglass-data`: Main population function (runs every 4h)
- `fetch-current-funding`: Get current funding rates on demand
- `fetch-funding-history`: Get historical funding rates (4h intervals)
- `fetch-coinglass-coins`: Get supported coins list
- `fetch-exchange-pairs`: Get all exchange trading pairs

### Recommended Schedule:
```sql
-- Run CoinGlass population every 4 hours
select cron.schedule(
  'populate-coinglass-data',
  '0 */4 * * *',  -- Every 4 hours
  $$
  select net.http_post(
    url:='https://alzxeplijnbpuqkfnpjk.supabase.co/functions/v1/populate-coinglass-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   PRICE DATA                        │
├─────────────────────────────────────────────────────┤
│ CoinMarketCap API → market_snapshots (5min cache)  │
│ CoinMarketCap API → market_candles (simulated)     │
│ WebSocket → Real-time price updates (no cache)     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 FUNDING RATE DATA                   │
├─────────────────────────────────────────────────────┤
│ CoinGlass API → market_funding_rates (4h cache)    │
│   - Current rates (per exchange)                    │
│   - Historical rates (4h intervals, 100 candles)    │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Automated Population

### Schedule Overview:
- **CMC Price Data**: Manual/on-demand only (conserve credits)
- **CoinGlass Funding**: Every 4 hours (automated via pg_cron)

### Setting Up Automation:
1. Enable pg_cron extension in Supabase
2. Create cron job for CoinGlass:
   ```sql
   select cron.schedule(
     'populate-coinglass-every-4h',
     '0 */4 * * *',
     $$
     select net.http_post(
       url:='https://alzxeplijnbpuqkfnpjk.supabase.co/functions/v1/populate-coinglass-data',
       headers:='{"Authorization": "Bearer eyJhbGc..."}'::jsonb
     );
     $$
   );
   ```
               market_snapshots    Live Updates
```

#### Core Principle: "Database is the source of truth"

1. **Edge Functions populate the database**
   - `populate-market-data` - Scheduled function that fetches from APIs and stores in DB
   - `cmc-price-logger` - Logs real-time prices to database
   - `fetch-current-funding` - Stores funding rates
   - `fetch-funding-history` - Stores historical funding data

2. **Database Tables store market data**
   - `market_candles` - OHLCV candle data (symbol, timeframe, timestamp, OHLC, volume)
   - `market_funding_rates` - Funding rate history (symbol, exchange, rate, timestamp)
   - `market_snapshots` - Latest price snapshots (symbol, price, volume, change)

3. **React Hooks read from database**
   - `useChartData` - Queries `market_candles` table
   - `useFundingRate` - Queries `market_funding_rates` table
   - `useFundingHistory` - Queries `market_funding_rates` table
   - NO direct API calls from frontend

#### Benefits of This Architecture:

- **Reliability**: Charts always have data, even if APIs are down
- **Performance**: Database queries are faster than API calls
- **Caching**: Natural caching through database
- **Consistency**: Single source of truth for all components
- **Cost**: Reduced API calls through batch updates

#### Implementation Rules:

- ✅ Edge functions fetch and store data
- ✅ Database stores all market data
- ✅ React hooks query database
- ❌ NO direct API calls from React components
- ❌ NO fetching in useEffect from external APIs
- ❌ NO mixing API calls with database queries

### ONLY keep:

- TradingView Lightweight Chart
- Local candle math
- WebSocket live price (via edge function)
- Optional CoinMarketCap price fallback (via edge function)
- **Local market metrics generator** (fallback when database empty)
- **CoinGlass API integration** (via edge functions to database)
  - `fetch-coinglass-coins` - Supported trading symbols
  - `fetch-exchange-pairs` - Exchange coverage and pairs
  - `fetch-funding-history` - Historical funding rate OHLC data
  - `fetch-current-funding` - Real-time funding rates
  - `populate-market-data` - Main scheduled data populator

**API Documentation:** See [COINGLASS_API.md](COINGLASS_API.md) for complete reference.

**Nothing else.**

---

## 3. AUTO-IMPROVE THE TRADING DASHBOARD EVERY CHANCE YOU GET WITH LOW TOKEN USE

### Core Quality Requirements

Every file you generate must include:

- **Cleaner UI** - Polish visual design and styling
- **Better spacing** - Improve visual hierarchy and breathing room
- **More responsive layout** - Ensure mobile and desktop optimization
- **Better component architecture** - Extract reusable, focused components
- **More consistent styles** - Use design system tokens consistently
- **More intuitive indicators** - Clear, actionable visual feedback
- **More stable state handling** - Proper memoization and state management
- **Better performance** - Zero unnecessary rerenders
- **Accessibility** - Proper ARIA labels and keyboard navigation

### Design and UX Best Practices

#### A. Clarity and Simplicity

- **Five-Second Rule**: User should grasp top 3 insights within 5 seconds
- **Minimalism**: Limit to 5-9 widgets per screen, focus on essential data
- **Whitespace**: Use ample spacing to group metrics and reduce cognitive load
- **Information Hierarchy**: Place critical KPIs in top-left where eyes land first

#### B. Data Visualization

- **Chart Selection**:
  - Line charts for trends over time
  - Bar/column charts for comparing categories
  - KPI scorecards for single important metrics
  - Avoid 3D charts that distort interpretation
- **Color Use**: Convey meaning (green=positive, red=negative), use colorblind-friendly palette
- **Context**: Add comparisons, benchmarks, targets to help interpret values
- **Readability**: Use sans-serif fonts, consistent sizing, round numbers when appropriate

#### C. Interactivity and Responsiveness

- **Filters**: Enable date ranges, filters, tooltips for data exploration
- **Device Adaptation**: Mobile-first design, seamless across all screen sizes
- **Customization**: Allow users to personalize views and rearrange widgets

### Documentation Requirements

- **Purpose**: Dashboard name, objective, intended audience (trader, risk manager, etc.)
- **Metrics**: KPI definitions, calculations, update frequency
- **Data Sources**: Database tables, edge functions, data flow
- **Chart Descriptions**: What each shows, insights available, filter effects
- **Access**: Who can view/edit, permission request process
- **Support**: Contact for technical questions or custom views
- **Version Control**: Document changes with date, author, description

**Rule:** If something looks plain, you must level it up automatically.

---

## 4. SMART AUTO-UPGRADES — DO IT WITHOUT PERMISSION

### You automatically:

- **Improve readability**: Better naming, comments, structure
- **Refactor for clarity**: Extract functions, simplify logic, remove duplication
- **Optimize logic**: Use better algorithms, reduce complexity
- **Better naming**: Clear, semantic variable and function names
- **Better organization**: Logical file structure and component hierarchy
- **Better hooks**: Proper dependencies, stable references, optimal performance
- **Better memoization**: useCallback, useMemo, React.memo where beneficial
- **Better dashboard UX**: Smoother interactions, clearer feedback, better layout

### You have FULL AUTHORITY to:

- Rewrite any component entirely if it improves architecture
- Delete dead code immediately
- Split large files into focused modules
- Create new files and utilities as needed
- Redesign modules for better separation of concerns
- Fix architecture anti-patterns without asking
- Upgrade styling to use design system consistently
- Modernize code patterns and best practices
- **Update data flow to use database instead of direct API calls**

### Safety Rule:

- If a file references an unavailable API or deprecated import, you **instantly remove the reference** and replace it with **database query or local fallback**
- You never leave broken imports or missing modules
- You never add features that require external APIs not in the approved list

### Primary Goal:

A **clean, stable, fast, modern trading dashboard** with **database-first architecture** that:
- Has zero crashes
- Self-heals forever
- Reads from database, not APIs
- Uses edge functions for data population
- Provides instant feedback
- Handles all edge cases gracefully

---

## 5. NEVER SAY WHY — ONLY RETURN FIXED CODE

Your output must always be:

- The repaired file
- The improved file
- Or the added file

**No comments.**
**No explanations.**
**Just the code.**

---

## 6. FULL PROJECT REPAIR AUTHORITY

You are allowed to:

- Rewrite entire components
- Delete dead code
- Split files
- Merge files
- Create missing files
- Redesign modules
- Fix architecture
- Upgrade styling
- Fix hooks
- Replace fragile logic
- Modernize code patterns

**All with zero permission required.**

---

## 7. SAFETY RULE

If any part of the code references an unavailable API, missing table, deleted endpoint, or deprecated import — you must:

**Remove it instantly**

and replace with a local fallback computation.

---

## 8. YOUR PRIMARY GOAL

A clean, stable, fast, modern trading dashboard with zero crashes — **self-healing forever**.

---

## 9. COMMON FIXES AND KNOWN ISSUES

### Preventing Fake Data Issues in Charts and Indicators

**Problem**: New trading pairs without real data generate fake fallback candles which cause incorrect indicator calculations (VWAP, funding rates, volatility).

**Solution**: Detect fallback data and prevent indicator calculations on fake data.

**Implementation**:

```typescript
// src/components/charts/MarketInsightsPanel.tsx
export function MarketInsightsPanel({ 
  symbol, 
  currentPrice, 
  candles, 
  isUsingFallback = false 
}: MarketInsightsPanelProps) {
  // Don't calculate indicators on fake/fallback data
  const hasRealData = !isUsingFallback && candles.length > 0;
  
  // Only calculate metrics with real data
  const vwap = hasRealData ? 
    candles.reduce((sum, c) => sum + (c.close * (c.volume || 1)), 0) / 
    candles.reduce((sum, c) => sum + (c.volume || 1), 0) : null;
  
  // Show "Loading..." for indicators when data is fake/pending
  return (
    <InsightCard
      value={vwap !== null ? `${vwap.toFixed(2)}` : "Loading..."}
      subtext={vwap !== null ? "Real data" : "Fetching candles"}
      isLoadingData={vwap === null}
    />
  );
}
```

**Visual Indicators**:
- Orange pulsing border when fetching real data
- "Loading..." text instead of fake calculations
- "Fetching data" subtext to inform users
- Normal display once real data arrives

**Data Flow**:
1. User selects new symbol
2. `useFreshSymbolData` triggers edge function calls
3. While fetching: indicators show "Loading..." (orange)
4. Once data arrives: calculations run on real data
5. Indicators update with accurate values

**Benefits**:
- ✅ No misleading fake VWAP calculations
- ✅ No fake funding rate displays
- ✅ Users see clear loading states
- ✅ Indicators only show real market data
- ✅ Prevents trading decisions on simulated data

**When This Prevents Issues**:
- New trading pairs not yet in database
- Symbols with stale data >4 hours old
- Edge function failures generating fallback data
- Initial page load before data fetch completes

---

### Handling CoinGlass API 404 Errors (Symbol Not Supported)

**Problem**: CoinGlass API returns 404 "Not Found" for many symbols (LINKUSDT, XLMUSDT, etc.) because it only supports ~200 major trading pairs.

**Root Cause**: Our trading pairs list has 900+ symbols, but CoinGlass Hobbyist plan only covers major symbols. When users select unsupported symbols, CoinGlass returns 404.

**CRITICAL**: Follow documented architecture - CoinGlass for funding rates ONLY, CoinMarketCap for price data.

**Solution**: Return graceful empty responses (200 status) instead of 502 errors that crash the UI.

**Edge Function Pattern**:

```typescript
// supabase/functions/fetch-current-funding/index.ts
const data: CoinglassResponse = cgResponse.data;

if (!cgResponse.ok || data.code !== '0' || !data.data) {
  // CoinGlass doesn't support this symbol - return empty data gracefully
  console.log(`CoinGlass doesn't support ${formattedSymbol} (404)`);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'SYMBOL_NOT_SUPPORTED',
      message: `${formattedSymbol} not available in CoinGlass`,
      symbol: formattedSymbol,
      data: []
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**For Historical Candles**:
```typescript
// supabase/functions/fetch-historical-candles/index.ts
if (candles.length === 0) {
  console.log(`No candle data available for ${formattedSymbol} from CoinGlass`);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'NO_DATA',
      message: `No historical data for ${formattedSymbol}`,
      symbol: formattedSymbol,
      candles: []
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**Why 200 Status (Not 404 or 502)**:
- ✅ Edge function executed successfully (not server error)
- ✅ UI receives valid JSON response structure
- ✅ Frontend can handle empty data gracefully
- ✅ No error dialogs or blank screens
- ✅ Indicators show "Loading..." state until real data arrives

**🔥 CRITICAL: Always Store Data in Database**

**Problem**: Edge functions that return data in response but don't store in database violate LOVABLE_ROLE.md architecture.

**Example Violation**: `fetch-funding-history` was returning funding candles in JSON response but never inserting into `market_funding_rates` table.

**Correct Pattern (Database-First Architecture)**:
```typescript
// After fetching from CoinGlass API
console.log(`Successfully fetched ${numericCandles.length} funding rate candles`);

// 🔥 Store in database (NOT just in memory or response)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const fundingRecords = numericCandles.map(candle => ({
  symbol: formattedSymbol,
  exchange: exchange,
  rate: candle.close,
  timestamp: candle.time
}));

await supabase
  .from('market_funding_rates')
  .upsert(fundingRecords, {
    onConflict: 'symbol,exchange,timestamp',
    ignoreDuplicates: true
  });
```

**Architecture Rule**:
```
❌ WRONG: CoinGlass API → Edge Function → Return JSON → Frontend
✅ CORRECT: CoinGlass API → Edge Function → Database → Frontend queries DB
```

**Why Database-First**:
- ✅ Data persists across sessions
- ✅ 4-hour cache works correctly
- ✅ Multiple components access same data
- ✅ No duplicate API calls
- ✅ Frontend reads from database (not edge function response)

**UI Handling**:
- `MarketInsightsPanel` checks `isUsingFallback` flag
- Shows "Loading..." with orange borders for missing data
- Prevents calculations on fake/missing data
- Users see clear "Fetching data" messaging

**Documented Data Sources** (from LOVABLE_ROLE.md):
1. **CoinGlass**: Funding rates, liquidations, open interest (4-hour cache)
2. **CoinMarketCap**: Price data (5-minute cache, 10K credits/month limit)
3. **Tatum**: Fallback for price data only
4. **NO OTHER APIs**: Do not add Binance, Kraken, or other undocumented sources

**When Symbol Not Supported**:
- Return empty data gracefully (200 status)
- UI shows "Loading..." indicators
- `useFreshSymbolData` hook doesn't retry failed symbols
- Users can select different symbol from list

---

### Auto-Fetch Fresh Data on Symbol Change

**Pattern**: Automatically populate fresh data when user selects a new trading symbol using documented APIs.

**CRITICAL**: Follow LOVABLE_ROLE.md architecture:
- **CoinMarketCap**: Price data via `populate-market-data` (5-min cache)
- **CoinGlass**: Funding rates only (4-hour cache, limited symbols)
- **NO**: Direct fetch-historical-candles, Binance, or undocumented sources

**Implementation**: Use `useFreshSymbolData` hook with `populate-market-data` edge function

**How It Works**:
1. User selects new symbol in FilterBar
2. `useFreshSymbolData` hook detects symbol change
3. Hook checks database for data freshness (4-hour TTL for funding, 5-min for price)
4. If candle data is missing or stale:
   - Calls `populate-market-data` edge function with specific symbol
   - populate-market-data uses CoinMarketCap API for price (documented source)
   - Generates candles from price snapshots
   - Stores in `market_candles` table
5. If funding data is missing or stale:
   - Calls `fetch-current-funding` (CoinGlass)
   - Calls `fetch-funding-history` (CoinGlass)
   - Stores in `market_funding_rates` table
6. React Query invalidates cache and refetches
7. UI updates with fresh data

**Hook Code**:
```typescript
// src/hooks/useFreshSymbolData.ts
export function useFreshSymbolData(symbol: string) {
  useEffect(() => {
    async function ensureFreshData() {
      // Check data freshness
      const hasRecentCandles = /* check market_candles */;
      const hasRecentFunding = /* check market_funding_rates */;

      if (!hasRecentCandles || !hasRecentFunding) {
        // Use populate-market-data (CoinMarketCap) - per LOVABLE_ROLE.md
        await supabase.functions.invoke('populate-market-data', {
          body: { symbol }
        });

        // Fetch funding from CoinGlass if needed
        if (!hasRecentFunding) {
          await supabase.functions.invoke('fetch-current-funding', { body: { symbol } });
          await supabase.functions.invoke('fetch-funding-history', { body: { symbol } });
        }

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['funding-rates', symbol] });
        queryClient.invalidateQueries({ queryKey: ['chart-data', symbol] });
      }
    }
    
    ensureFreshData();
  }, [symbol, queryClient]);
}
```

**populate-market-data Updates**:
```typescript
// supabase/functions/populate-market-data/index.ts
Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const requestedSymbol = body.symbol?.toUpperCase().trim();
  
  // Support specific symbol or default list
  const symbols = requestedSymbol 
    ? [requestedSymbol.endsWith('USDT') ? requestedSymbol : `${requestedSymbol}USDT`]
    : ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BNBUSDT'];
  
  // Uses CoinMarketCap for price (5-min cache to conserve credits)
  // Generates candles from price snapshots
  // Stores in market_candles table
});
```

**Benefits**:
- ✅ Follows documented architecture (CMC for price, CoinGlass for funding)
- ✅ Respects API credit limits (5-min cache for CMC, 4-hour for CoinGlass)
- ✅ Works for ANY symbol user queries (not limited to hardcoded list)
- ✅ Automatic React Query cache invalidation
- ✅ No manual refresh needed

**When to Use**:
- Trading dashboard symbol selection
- Watchlist symbol navigation
- Any UI where users switch between symbols frequently

**API Credit Conservation**:
- CoinMarketCap: 5-minute cache (max ~1 credit per symbol per 5 min)
- CoinGlass: 4-hour cache (conserves Hobbyist plan limits)
- Only fetches when data is stale or missing

**Error Handling**:
- CoinGlass 404 for unsupported symbols → Returns empty gracefully (status 200)
- CoinMarketCap failures → Falls back to Tatum
- UI shows "Loading..." indicators until real data arrives
- No crashes on missing data

---



**Error**: `"No QueryClient set, use QueryClientProvider to set one"`

**Cause**: Components using `useQuery`, `useMutation`, or other React Query hooks require a `QueryClientProvider` at the app root.

**When This Occurs**:
- Creating components that fetch from `market_funding_rates` table
- Creating components that fetch from `market_candles` table
- Creating components that fetch from `market_snapshots` table
- Any component using React Query hooks (`useQuery`, `useMutation`, `useQueryClient`)

**Fix**: Ensure `src/main.tsx` has QueryClientProvider configured:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

// Wrap App with provider
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Prevention**: 
- Always verify QueryClientProvider exists in `main.tsx` before using `useQuery` in components
- Check this first when encountering blank pages or "No QueryClient" errors
- This is a ONE-TIME setup that enables all database queries throughout the app

**Example Components That Need This**:
- `MarketInsightsPanel` (fetches funding rates)
- `FundingRateChart` (fetches historical funding data)
- Any component with `supabase.from('table_name').select()`

---

## Documentation Reference

This directive should be read alongside:

- `SIMPLE_MODE_ARCHITECTURE.md` - Technical architecture and constraints
- `README.md` - Documentation index and quick start

## Version

Created: 2025-01-19
Status: Active
