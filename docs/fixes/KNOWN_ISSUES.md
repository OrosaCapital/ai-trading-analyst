# Known Issues

This document tracks issues that are currently active or have been resolved, providing a clear view of system health and technical debt.

---

## Active Issues

*No active issues at this time.*

---

## Resolved Issues ✅

### 1. Auto-Refresh for Tracked Symbols ✅
**Resolved**: 2025-11-20  
**See**: `CHANGELOG.md` - "2025-11-20: Auto-Refresh Implementation for Tracked Symbols"

**Summary**: 
UI checkbox promised 5-minute auto-refresh but no backend scheduler existed. Implemented `pg_cron` job that calls `populate-market-data` edge function every 5 minutes. Edge function checks `tracked_symbols` table and refreshes only stale data (>5 minutes old).

---

### 2. Duplicate Hourly Candles ✅
**Resolved**: 2025-11-20  
**See**: `CHANGELOG.md` - "2025-11-20: Duplicate Hourly Candles Bug"

**Summary**: 
Multiple candles created per hour due to unrounded timestamps and timing inconsistencies. Fixed via SQL migration with deduplication logic.

---

### 3. Stale Data Displayed in Charts ✅
**Resolved**: 2025-11-20  
**See**: `CHANGELOG.md` - "2025-11-20: Query Ordering Fixes"

**Summary**: 
Charts showing oldest data instead of newest due to incorrect query ordering (`ASC` instead of `DESC`). Fixed by reversing query order and maintaining chronological display.

---

### 4. Excessive API Calls and Rate Limiting ✅
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

### Tracked Symbols Auto-Refresh (✅ Implemented)
Monitor the system health:
- **Cron job status**: `SELECT * FROM cron.job WHERE jobname = 'refresh-tracked-symbols-every-5min';`
- **Cron execution history**: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
- **Edge function logs**: Check `populate-market-data` logs for tracked symbol processing
- **Data freshness**: Tracked symbols should update every 5-10 minutes
- **User feedback**: Verify users see fresh data on tracked symbols

### General System Health
- Query for symbols with old data: `SELECT symbol, MAX(updated_at) FROM market_candles GROUP BY symbol HAVING MAX(updated_at) < NOW() - INTERVAL '1 hour'`
- Check tracked symbols: `SELECT symbol, active, added_at FROM tracked_symbols WHERE active = true;`
- Edge function health: Monitor invocation counts and error rates
