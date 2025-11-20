# WebSocket Price Streaming - Automation Guide

## Current Automation Status

✅ **Fully Automated** - No manual intervention required

## What's Automated

### 1. WebSocket Connection Management

**Automatic Actions**:
- Connection established when user opens Trading Dashboard
- Heartbeat pings sent every 20 seconds (frontend) and 30 seconds (edge function)
- Automatic reconnection on disconnect (max 5 attempts with exponential backoff)
- Cleanup on component unmount

**Configuration**: None required, works out of the box

### 2. Edge Function Deployment

**Automatic Actions**:
- Edge function deploys automatically when code is saved in Lovable
- No manual deployment steps needed
- Configuration in `supabase/config.toml` persists across deployments

**Verification**:
```bash
# Edge function is live at:
wss://alzxeplijnbpuqkfnpjk.supabase.co/functions/v1/websocket-price-stream
```

### 3. Symbol Translation

**Automatic Actions**:
- Standard format (BTCUSDT) → Kraken REST (XXBTZUSD) → WebSocket v1 (XBT/USD)
- Happens transparently in edge function
- Auto-detection for new symbols (USDT → USD conversion)

**No Manual Mapping Required** for standard USD pairs

### 4. Error Recovery

**Automatic Actions**:
- Kraken WebSocket disconnect → Auto-reconnect (5 attempts)
- Network interruption → Retry with exponential backoff
- Invalid symbol → Log error, continue with other symbols
- Edge function restart → Frontend reconnects automatically

## What's NOT Automated (Manual Steps)

### Adding New Cryptocurrency Symbols

**Manual Steps Required**:
1. Add symbol to `tracked_symbols` table in database
2. (Optional) Add to symbol map if non-standard format
3. Verify subscription works

**Why Manual**: Requires business decision on which symbols to track

### Monitoring & Alerts

**Currently Manual**:
- Check edge function logs for errors
- Monitor price update frequency
- Verify connection status in UI

**Future**: Could add automated health checks

## Deployment Checklist

When deploying to production or making changes:

- [x] Edge function configured in `supabase/config.toml`
- [x] WebSocket authentication parameters set
- [x] Symbol translation functions available
- [x] Reconnection logic implemented
- [x] Error handling in place
- [x] Frontend hook connects automatically
- [x] Cleanup on unmount

## Monitoring

### Edge Function Logs

**Automatic Logging**:
- Connection attempts: `📡 Connecting to Kraken WebSocket for BTCUSDT...`
- Successful connections: `✅ Kraken WebSocket connected for XBT/USD`
- Subscriptions: `📤 Sending subscription: {...}`
- Price updates: `💰 Price update: {...}`
- Errors: `❌ Error processing Kraken message: {...}`

**Access Logs**:
Via Lovable Cloud interface or Supabase dashboard

### Frontend Console

**Automatic Logging** (in development):
- Connection status: `🔌 Connecting WebSocket for BTCUSDT...`
- Price updates: `🔴 WebSocket Price Update - BTCUSDT: {...}`
- Reconnection attempts: Logged automatically
- Errors: Logged to system alerts store

### UI Indicators

**Automatic Status Display**:
- "Connecting..." → Attempting connection
- Live price number → Connected and receiving data
- "WebSocket Offline" → Connection failed
- Color-coded price changes (green/red)

## Automated Health Checks

### Current Implementation

**Frontend Health Check**:
```typescript
// Heartbeat every 20 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "ping" }));
  }
}, 20000);
```

**Edge Function Health Check**:
```typescript
// Heartbeat to Kraken every 30 seconds
setInterval(() => {
  if (krakenWS?.readyState === WebSocket.OPEN) {
    krakenWS.send(JSON.stringify({ event: 'ping' }));
  }
}, 30000);
```

### Future Automated Health Checks

**Potential Additions**:
- Alert if no price updates received for 60 seconds
- Email notification on repeated connection failures
- Slack webhook for production errors
- Automatic fallback to REST API if WebSocket fails

## Disaster Recovery

### Automatic Recovery Scenarios

1. **Kraken WebSocket Closes**
   - Auto: Reconnect with exponential backoff (2s, 4s, 6s, 8s, 10s)
   - Auto: Max 5 attempts
   - Manual: If all attempts fail, user can click reconnect

2. **Edge Function Restart**
   - Auto: Frontend detects disconnect
   - Auto: Establishes new connection
   - Impact: 1-2 second gap in price updates

3. **Network Interruption**
   - Auto: Browser detects WebSocket close
   - Auto: Cleanup and reconnect attempt
   - Manual: User may need to refresh if browser frozen

4. **Invalid Symbol Subscription**
   - Auto: Log error to edge function logs
   - Auto: Continue with other symbols
   - Manual: Remove invalid symbol from tracked_symbols

### Manual Recovery Steps

**If WebSocket Completely Fails**:
1. Check edge function logs for errors
2. Verify `supabase/config.toml` has websocket-price-stream entry
3. Verify symbol format correct (slash required)
4. Check Kraken API status
5. Restart edge function if needed (auto-deploys)

## Performance Optimization

### Automatic Optimizations

**Connection Pooling**:
- One WebSocket per unique symbol to Kraken
- Multiple frontend clients share edge function WebSocket
- Reduces total connections to Kraken

**Message Batching**:
- Price updates sent immediately (no batching)
- Heartbeat pings batched (every 20/30 seconds)

**Resource Management**:
- Auto-cleanup of closed connections
- Memory freed when WebSocket closes
- No connection leaks

## Security Automation

**Automatic Security Measures**:
- Authentication tokens passed via query params (frontend → edge function)
- No API keys exposed in frontend
- CORS headers set automatically
- WebSocket upgrade security handled by Supabase

**No Manual Security Steps Required**

## Testing Automation

### Current Testing

**Manual Testing Required**:
- Visual verification in UI
- Check console logs
- Verify price updates

**Automated Testing Possible** (Future):
- WebSocket connection test
- Price update frequency test
- Reconnection logic test
- Symbol translation test

## Cost & Resource Management

### Automatic Cost Control

**Resource Limits**:
- WebSocket connections: Limited by edge function instances
- Data transfer: Pay-per-use via Supabase
- No runaway costs (connections close on disconnect)

**Cost Optimization**:
- Single WebSocket per symbol (not per client)
- Efficient message format (minimal data)
- Automatic connection cleanup

## Maintenance Schedule

### Automated Maintenance

**Daily**:
- Connection health monitoring (automatic)
- Error log collection (automatic)

**Weekly**:
- None required (system self-maintaining)

**Monthly**:
- Review edge function logs for patterns
- Check for new Kraken API versions

### Manual Maintenance

**As Needed**:
- Add new cryptocurrency symbols
- Update symbol translation maps
- Adjust reconnection parameters
- Update Kraken API version (if needed)

## Rollback Procedure

**If Issues Occur**:

1. **Edge Function Rollback**:
   - Lovable automatically keeps version history
   - Can restore previous version from history
   - Re-deploy takes ~30 seconds

2. **Frontend Rollback**:
   - Git history available
   - Revert hook changes if needed
   - Refresh browser to load previous version

3. **Emergency Shutdown**:
   - Remove from `supabase/config.toml`
   - Edge function stops accepting connections
   - Frontend shows "WebSocket Offline"

## Summary

### Fully Automated ✅

- WebSocket connection establishment
- Heartbeat monitoring
- Automatic reconnection
- Symbol translation
- Error logging
- Edge function deployment
- Resource cleanup
- Security measures

### Requires Manual Intervention ⚠️

- Adding new symbols
- Reviewing error logs (optional)
- Disaster recovery (if all auto-recovery fails)
- Performance tuning (optional)

### Not Implemented (Future) 🔄

- Email/Slack alerts on failures
- Automated symbol discovery
- Fallback to REST API
- Load balancing across regions
- A/B testing different WebSocket versions

## Support & Documentation

**Full Documentation**:
- [WebSocket Architecture](../architecture/WEBSOCKET_PRICE_STREAMING.md)
- [Live Price Architecture](../architecture/LIVE_PRICE_ARCHITECTURE.md)
- [Kraken Symbols Guide](../guides/KRAKEN_SYMBOLS.md)
- [Troubleshooting](../fixes/KNOWN_ISSUES.md)

**Edge Function Code**:
- `supabase/functions/websocket-price-stream/index.ts`
- `supabase/functions/_shared/krakenSymbols.ts`

**Frontend Code**:
- `src/hooks/useRealtimePriceStream.ts`
- `src/pages/TradingDashboard.tsx`
