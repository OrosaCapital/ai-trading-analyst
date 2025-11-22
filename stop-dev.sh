#!/usr/bin/env bash
set -euo pipefail

# Companion script to stop services managed by start-dev.sh
# Usage: ./stop-dev.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="$ROOT_DIR/start-dev.sh"

if [ ! -x "$START_SCRIPT" ]; then
  if [ -f "$START_SCRIPT" ]; then
    echo "Making start-dev.sh executable"
    chmod +x "$START_SCRIPT" || true
  else
    echo "Error: start-dev.sh not found in $ROOT_DIR"
    exit 1
  fi
fi

echo "Stopping managed services via start-dev.sh"
"$START_SCRIPT" stop

echo "Showing managed services status"
"$START_SCRIPT" status || true

echo "Stopped. PID files (if any) are in .dev/pids under the workspace root."
#!/bin/bash

BASE_DIR="/Users/franciscoorosa/Desktop/Rumble & Local Dev Project"
PIDS_DIR="$BASE_DIR/.dev/pids"

echo "🛑 Stopping managed development services..."

if [ ! -d "$PIDS_DIR" ]; then
    echo "⚠️  No PID directory found. If services were started manually, you may need to stop them separately."
    exit 0
fi

shopt -s nullglob
stopped_any=false
for pid_file in "$PIDS_DIR"/*.pid; do
    [ -e "$pid_file" ] || continue
    pid="$(cat "$pid_file")"
    service_name="$(basename "$pid_file" .pid)"
    if kill -0 "$pid" >/dev/null 2>&1; then
        echo "   • Stopping $service_name (PID: $pid)..."
        kill "$pid" >/dev/null 2>&1 || true
        stopped_any=true
    fi
    rm -f "$pid_file"
done
shopt -u nullglob

if [ "$stopped_any" = false ]; then
    echo "No managed services were running."
else
    echo "✅ All managed services have been stopped."
fi
