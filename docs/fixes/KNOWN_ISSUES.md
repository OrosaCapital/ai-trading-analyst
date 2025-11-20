# Known Issues

This document tracks issues that are currently active or have been resolved, providing a clear view of system health and technical debt.

---

## Active Issues

### 1. Auto-Refresh for Tracked Symbols Not Implemented

**Status**: 🔴 Not Implemented (Identified: 2025-11-20)

**Description**: 
The UI checkbox "Auto refresh this symbol every 5 minutes" exists in the trading view, successfully updates the `tracked_symbols` database table, but there is no backend mechanism to actually perform the automatic refreshes.

**Current Behavior**:
- User checks the box ✅
- `tracked_symbols.active` set to `true` ✅
- Toast notification promises "Data will update every 5 minutes" ✅
- **Nothing happens** ❌

**Root Cause**:
- No cron job or scheduled task configured
- No backend process reading from `tracked_symbols` table
- Edge functions only execute on-demand via HTTP requests

**Impact**:
- Users expect automatic data updates but don't receive them
- Manual navigation to symbol page required to trigger refresh
- Misleading UI promise creates poor user experience

**Proposed Solution**:
Implement PostgreSQL `pg_cron` scheduled job:

1. **Enable pg_cron extension**
2. **Create `refresh_tracked_symbols()` function** that:
   - Queries `tracked_symbols` WHERE `active = true`
   - For each symbol, checks if data is >5 minutes old
   - Calls `populate-market-data` edge function via HTTP
   - Logs results for monitoring

3. **Schedule cron job** to run every 5 minutes:
   ```sql
   SELECT cron.schedule(
     'refresh-tracked-symbols',
     '*/5 * * * *',
     'SELECT refresh_tracked_symbols();'
   );
   ```

**Related Files**:
- `src/hooks/useTrackedSymbol.ts` - UI checkbox logic
- `src/hooks/useFreshSymbolData.ts` - Manual refresh debouncing (30 min)
- `supabase/functions/populate-market-data/index.ts` - Data fetching logic
- Pending: Migration file for pg_cron setup

**Technical Considerations**:
- Requires `pg_net` extension for HTTP calls from database
- Must respect rate limits (5-minute intervals with freshness checks)
- Separate from manual refresh (30-minute debouncing)
- Needs monitoring and error handling

**Priority**: High (user-facing feature with misleading promise)

---

## Resolved Issues ✅

### 1. Duplicate Hourly Candles
**Resolved**: 2025-11-20  
**See**: `CHANGELOG.md` - "2025-11-20: Duplicate Hourly Candles Bug"

**Summary**: 
Multiple candles created per hour due to unrounded timestamps and timing inconsistencies. Fixed via SQL migration with deduplication logic.

---

### 2. Stale Data Displayed in Charts
**Resolved**: 2025-11-20  
**See**: `CHANGELOG.md` - "2025-11-20: Query Ordering Fixes"

**Summary**: 
Charts showing oldest data instead of newest due to incorrect query ordering (`ASC` instead of `DESC`). Fixed by reversing query order and maintaining chronological display.

---

### 3. Excessive API Calls and Rate Limiting
**Resolved**: 2025-11-20  
**See**: `CHANGELOG.md` - "2025-11-20: Rate Limiting in populate-market-data"

**Summary**: 
Edge function called too frequently without cooldown checks. Fixed by implementing 30-minute cooldown at both edge function and hook levels, with localStorage persistence.

---

## How to Use This Document

### For Developers
- Check **Active Issues** before starting new features
- Reference **Resolved Issues** to avoid reintroducing bugs
- Update this document when discovering new issues

### For AI Assistants
- Read this file before making changes to related systems
- Don't reimplement solved problems
- Reference existing solutions when fixing similar issues

### Issue Lifecycle
1. **Discovered** → Add to "Active Issues" with detailed analysis
2. **Solution Planned** → Update with proposed approach
3. **Implemented** → Move to "Resolved Issues" with link to CHANGELOG
4. **Documented** → Ensure CHANGELOG has full technical details

---

## Issue Template

When adding new issues, use this format:

```markdown
### [Issue Number]. [Brief Title]

**Status**: 🔴 Active / 🟡 In Progress / 🟢 Testing / ✅ Resolved

**Description**: 
[What's broken or missing]

**Current Behavior**:
[What happens now]

**Expected Behavior**:
[What should happen]

**Root Cause**:
[Why it's happening]

**Impact**:
[Who/what is affected]

**Proposed Solution**:
[How to fix it]

**Related Files**:
[List of files involved]

**Priority**: High / Medium / Low
```

---

## Monitoring Recommendations

### For Tracked Symbols Issue
Once implemented, monitor:
- Cron job execution logs
- Edge function invocation counts
- Database write patterns
- User feedback on data freshness

### General System Health
- Query for symbols with old data: `SELECT symbol, MAX(updated_at) FROM market_candles GROUP BY symbol HAVING MAX(updated_at) < NOW() - INTERVAL '1 hour'`
- Check cron job status: `SELECT * FROM cron.job;`
- Edge function logs: Filter by function name and timestamp
