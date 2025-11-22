echo "🚀 Starting Orosa Capital Universal Dev Environment..."
#!/usr/bin/env bash
set -euo pipefail

# Universal dev starter for this workspace
# Starts/Stops: Redis, relay, live_xrp_relay, frontend projects and a simple dashboard

# --- Configuration ---
BASE_DIR="/Users/franciscoorosa/Desktop/Rumble & Local Dev Project"
AI_TRADING_ANALYST_DIR="$BASE_DIR/ai-trading-analyst"
CANNACARDZ_DIR="$BASE_DIR/cannacardz"
CC_COM_DIR="$BASE_DIR/Dev Environment/websites/cc.com"
DEV_DASHBOARD_DIR="$BASE_DIR/Dev Environment/websites/Dev DashBoard"
PIDS_DIR="$BASE_DIR/.dev/pids"

LOG_FILE="$BASE_DIR/dev-master.log"
mkdir -p "$PIDS_DIR"
> "$LOG_FILE"

REDIS_URL_DEFAULT="redis://127.0.0.1:6379"

log() { printf "[%s] %s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

usage() {
    cat <<EOF
Usage: $0 [start|stop|status] [--no-frontend]
Commands:
    start        Start all services (default)
    stop         Stop services started by this script
    status       Show running status of managed services
Flags:
    --no-frontend  Do not start frontend dev servers
EOF
}

ensure_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        log "missing command: $1"
        return 1
    fi
    return 0
}

start_redis() {
    if redis-cli ping >/dev/null 2>&1; then
        log "Redis already running"
        return 0
    fi
    if command -v brew >/dev/null 2>&1; then
        log "Starting Redis via Homebrew services"
        brew services start redis || true
        sleep 1
        if redis-cli ping >/dev/null 2>&1; then
            log "Redis started (brew)"
            return 0
        fi
    fi
    if command -v redis-server >/dev/null 2>&1; then
        log "Starting redis-server (background)"
        nohup redis-server --daemonize yes >/dev/null 2>&1 || true
        sleep 1
        redis-cli ping >/dev/null 2>&1 && log "Redis started" || log "Redis failed to start"
    else
        log "redis-server not found; please install Redis"
        return 1
    fi
}

record_pid() { echo "$2" > "$PIDS_DIR/$1.pid"; }
read_pid() { [ -f "$PIDS_DIR/$1.pid" ] && cat "$PIDS_DIR/$1.pid" || echo ""; }

start_service() {
    local name="$1"; shift
    local cmd="$*"
    local pidfile="$PIDS_DIR/$name.pid"
    local logfile="$BASE_DIR/$name.log"
    if [ -n "$(read_pid "$name")" ] && kill -0 "$(read_pid "$name")" >/dev/null 2>&1; then
        log "$name already running (pid $(read_pid "$name"))"
        return 0
    fi
    log "Starting $name"
    nohup sh -c "$cmd" > "$logfile" 2>&1 &
    record_pid "$name" "$!"
    sleep 0.5
    log "$name started pid $(read_pid "$name") logfile=$logfile"
}

stop_service() {
    local name="$1"
    local pid
    pid=$(read_pid "$name") || true
    if [ -n "$pid" ]; then
        log "Stopping $name (pid $pid)"
        kill "$pid" >/dev/null 2>&1 || true
        rm -f "$PIDS_DIR/$name.pid"
    else
        log "No pid for $name"
    fi
}

status_service() {
    local name="$1"
    local pid
    pid=$(read_pid "$name") || true
    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
        echo "$name running pid $pid"
    else
        echo "$name stopped"
    fi
}

start_project() {
    local name="$1" dir="$2" run_cmd="$3"
    if [ ! -d "$dir" ]; then
        log "Directory not found: $dir — skipping $name"
        return
    fi
    pushd "$dir" >/dev/null
    if [ -f package.json ]; then
        if command -v pnpm >/dev/null 2>&1; then
            if [ ! -d node_modules ]; then
                log "Installing deps for $name"
                pnpm install --silent >> "$LOG_FILE" 2>&1 || true
            fi
            start_service "$name" "$run_cmd"
        else
            log "pnpm not found; attempting npm for $name"
            npm install --silent >> "$LOG_FILE" 2>&1 || true
            start_service "$name" "$run_cmd"
        fi
    else
        log "No package.json in $dir; skipping $name"
    fi
    popd >/dev/null
}

# --- CLI ---
CMD="start"
NO_FRONTEND=0
if [ $# -ge 1 ]; then
    case "$1" in
        start|stop|status) CMD="$1"; shift ;;
        --help|-h) usage; exit 0 ;;
        *) CMD="start" ;;
    esac
fi
while [ $# -gt 0 ]; do
    case "$1" in
        --no-frontend) NO_FRONTEND=1; shift ;;
        --dry-run) DRY_RUN=1; shift ;;
        --tail-logs) TAIL_LOGS=1; shift ;;
        *) shift ;;
    esac
done

case "$CMD" in
    start)
        log "Starting dev environment"
        start_redis || log "Warning: Redis may not be running"

        # Start relay (uses REDIS_URL)
        export REDIS_URL="${REDIS_URL:-$REDIS_URL_DEFAULT}"
        start_service "relay" "cd '$AI_TRADING_ANALYST_DIR' && REDIS_URL='$REDIS_URL' node server/relay.js"

        # Start live publisher
        start_service "live_xrp_relay" "cd '$AI_TRADING_ANALYST_DIR' && node scripts/live_xrp_relay.cjs"

        if [ "$NO_FRONTEND" -eq 0 ]; then
            start_project "AI-Trading-Analyst-Frontend" "$AI_TRADING_ANALYST_DIR" "pnpm run dev"
            start_project "Cannacardz" "$CANNACARDZ_DIR" "pnpm run dev"
            start_project "CC.com" "$CC_COM_DIR" "pnpm run dev"
            # Start simple dev dashboard server
            if [ -d "$DEV_DASHBOARD_DIR" ]; then
                start_service "Dev-Dashboard" "cd '$DEV_DASHBOARD_DIR' && python3 -m http.server 8000"
            fi
        else
            log "--no-frontend specified; skipping frontend servers"
        fi
            if [ "${TAIL_LOGS:-0}" -eq 1 ]; then
                log "Starting log tailer"
                start_service "log_tailer" "tail -n +1 -f '$BASE_DIR/relay.log' '$BASE_DIR/live_xrp_relay.log'"
            fi
        ;;

    stop)
        log "Stopping managed services"
        stop_service "Dev-Dashboard"
        stop_service "CC.com"
        stop_service "Cannacardz"
        stop_service "AI-Trading-Analyst-Frontend"
        stop_service "live_xrp_relay"
        stop_service "relay"
        ;;

    status)
        status_service "relay"
        status_service "live_xrp_relay"
        status_service "Dev-Dashboard"
        status_service "CC.com"
        status_service "Cannacardz"
        status_service "AI-Trading-Analyst-Frontend"
        ;;
    *) usage; exit 1 ;;
esac

log "done"
