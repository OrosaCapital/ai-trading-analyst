#!/usr/bin/env bash
# Convenience script to verify Redis, start the relay, run smoke tests, and tail logs.
# Usage: ./scripts/run_smoke.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[run_smoke] Checking Redis availability..."
if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli ping >/dev/null 2>&1; then
    echo "[run_smoke] Redis reachable (PONG)."
  else
    echo "[run_smoke] Redis not responding. Please start Redis (e.g. 'brew services start redis') and re-run this script." >&2
    exit 2
  fi
else
  echo "[run_smoke] redis-cli not found. Please install Redis or ensure redis-cli is on PATH." >&2
  exit 2
fi

# ensure deps installed
echo "[run_smoke] Ensuring node deps are installed..."
npm install --no-audit --no-fund >/dev/null 2>&1 || true

RELAY_LOG="$ROOT_DIR/relay.log"
RELAY_PID="$ROOT_DIR/relay.pid"

cleanup_stale_pid() {
  if [ -f "$RELAY_PID" ]; then
    local existing_pid
    existing_pid="$(cat "$RELAY_PID" 2>/dev/null || true)"
    if [ -n "$existing_pid" ] && ps -p "$existing_pid" >/dev/null 2>&1; then
      echo "[run_smoke] Relay already appears to be running (pid $existing_pid)."
      return 0
    fi
    echo "[run_smoke] Removing stale relay pid file."
    rm -f "$RELAY_PID"
  fi
  return 1
}

if cleanup_stale_pid; then
  : # already running
else
  echo "[run_smoke] Starting relay in background..."
  nohup node server/relay.js > "$RELAY_LOG" 2>&1 &
  relay_pid=$!
  echo "$relay_pid" > "$RELAY_PID"
  echo "[run_smoke] Started relay pid $relay_pid. Waiting for port 4000..."
  # wait for port
  for i in {1..30}; do
    if lsof -i :4000 -sTCP:LISTEN -Pn >/dev/null 2>&1; then
      echo "[run_smoke] Relay listening on port 4000"
      break
    fi
    sleep 1
  done
fi

echo "[run_smoke] Sleeping 2s to allow relay warmup..."
sleep 2

echo "[run_smoke] Running WS smoke test..."
node test/ws_subscribe_test.js || echo "[run_smoke] ws_subscribe_test failed"

echo "[run_smoke] Running compute endpoint test..."
node test/test_compute_endpoint.js || echo "[run_smoke] test_compute_endpoint failed"

echo "[run_smoke] Tail last 200 lines of relay.log"
tail -n 200 "$RELAY_LOG" || true

if [ -f "$RELAY_PID" ]; then
  echo "[run_smoke] To stop relay: kill $(cat "$RELAY_PID") && rm -f \"$RELAY_PID\""
else
  echo "[run_smoke] Relay pid file not found; ensure background process is managed manually."
fi
