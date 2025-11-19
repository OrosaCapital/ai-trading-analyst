import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TradingCommandCenter } from "@/components/trading/TradingCommandCenter";
import { TradingViewChart } from "@/components/TradingViewChart";
import { LocalIndicatorsPanel } from "@/components/trading/LocalIndicatorsPanel";
import { useProfessionalChartData } from "@/hooks/useProfessionalChartData";

type Severity = "info" | "warn" | "danger";

interface AlertBadge {
  id: string;
  label: string;
  severity: Severity;
}

export default function TradingDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");

  const normalizeSymbol = (sym: string) => {
    const clean = sym.toUpperCase().replace(/\//g, "").trim();
    if (!clean || clean === "USDT" || clean === "USD") return "BTCUSDT";
    if (clean.endsWith("USDT")) return clean;
    if (clean.endsWith("USD")) return clean.replace("USD", "USDT");
    return `${clean}USDT`;
  };

  const normalizedSymbol = normalizeSymbol(symbol);
  const { chartData, isLoading } = useProfessionalChartData(normalizedSymbol);

  const candles1m = chartData?.candles1m || [];
  const candles15m = chartData?.candles15m || [];
  const candles1h = chartData?.candles1h || [];

  const currentPrice =
    candles1m.length > 0
      ? candles1m[candles1m.length - 1].close
      : candles1h.length > 0
        ? candles1h[candles1h.length - 1].close
        : null;

  const sessionStats = useMemo(() => buildSessionStats(candles1h), [candles1h]);
  const alerts = useMemo(() => buildAlerts(candles1m, candles15m, candles1h), [candles1m, candles15m, candles1h]);

  return (
    <AppShell showProgress={false} minutesCollected={0} minutesRequired={0} symbol={normalizedSymbol}>
      <TradingCommandCenter symbol={symbol} onSymbolChange={setSymbol} currentPrice={currentPrice} />

      <AlertStrip alerts={alerts} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Enhanced chart container with glow effect */}
          <div className="group relative h-[500px] rounded-xl overflow-hidden border border-border/40 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-2xl hover:shadow-primary/10 transition-all duration-500">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative h-full">
              <TradingViewChart symbol={normalizedSymbol} />
            </div>
          </div>

          <SessionStatsPanel stats={sessionStats} symbol={normalizedSymbol} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent hover:scrollbar-thumb-border/60">
          <LocalIndicatorsPanel candles={candles1m} />
          <MicroTimeframePanel candles1m={candles1m} candles15m={candles15m} />
        </div>
      </div>

      {/* Enhanced footer with animation */}
      <div className="relative h-[200px] flex items-center justify-center border-t border-border/20 mt-4 rounded-xl overflow-hidden backdrop-blur-sm">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-card/30 to-primary/5 animate-pulse opacity-40" />
        
        <div className="relative text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-lg shadow-primary/50" />
            </div>
            <p className="font-black text-base text-foreground tracking-tight">Simple Mode Active</p>
          </div>
          <p className="text-xs text-muted-foreground font-semibold tracking-wide">
            All analytics computed locally • Zero external dependencies
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-green animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-chart-green animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-chart-green animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- ALERT STRIP ---------- */

function AlertStrip({ alerts, isLoading }: { alerts: AlertBadge[]; isLoading: boolean }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2 items-center text-xs">
      {isLoading && (
        <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/30 font-semibold flex items-center gap-2 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          Synchronizing live data
        </span>
      )}
      {alerts.length === 0 && !isLoading && (
        <span className="px-3 py-1.5 rounded-full bg-chart-green/10 text-chart-green border border-chart-green/30 font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-chart-green" />
          Market neutral • No alerts
        </span>
      )}
      {alerts.map((a) => (
        <span
          key={a.id}
          className={`px-3 py-1.5 rounded-full border font-semibold flex items-center gap-2 transition-all hover:scale-105 ${
            a.severity === "danger"
              ? "bg-chart-red/10 text-chart-red border-chart-red/30"
              : a.severity === "warn"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${
            a.severity === "danger"
              ? "bg-chart-red animate-pulse"
              : a.severity === "warn"
                ? "bg-amber-400"
                : "bg-sky-400"
          }`} />
          {a.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- SESSION STATS ---------- */

interface SessionStats {
  sessionChangePct: number | null;
  high: number | null;
  low: number | null;
  rangePct: number | null;
  direction: "up" | "down" | "flat" | null;
}

function SessionStatsPanel({ stats, symbol }: { stats: SessionStats; symbol: string }) {
  const changeIsPositive = stats.sessionChangePct !== null && stats.sessionChangePct > 0.01;
  const changeIsNegative = stats.sessionChangePct !== null && stats.sessionChangePct < -0.01;
  const hasRange = stats.high !== null && stats.low !== null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/95 via-card to-card/90 backdrop-blur-sm shadow-xl">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-pulse opacity-50" />
      
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {/* Symbol with icon */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">Symbol</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-primary tracking-tight">{symbol}</span>
          </div>
        </div>

        {/* Session Move with trend indicator */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            {changeIsPositive && (
              <div className="w-2 h-2 rounded-full bg-chart-green animate-pulse shadow-lg shadow-chart-green/50" />
            )}
            {changeIsNegative && (
              <div className="w-2 h-2 rounded-full bg-chart-red animate-pulse shadow-lg shadow-chart-red/50" />
            )}
            {!changeIsPositive && !changeIsNegative && (
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            )}
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">Session</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight transition-colors ${
              changeIsPositive 
                ? "text-chart-green" 
                : changeIsNegative 
                  ? "text-chart-red" 
                  : "text-muted-foreground"
            }`}>
              {stats.sessionChangePct !== null 
                ? `${stats.sessionChangePct >= 0 ? '+' : ''}${stats.sessionChangePct.toFixed(2)}%` 
                : "—"}
            </span>
          </div>
          {/* Mini trend indicator bar */}
          {stats.sessionChangePct !== null && Math.abs(stats.sessionChangePct) > 0.01 && (
            <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  changeIsPositive ? "bg-gradient-to-r from-chart-green to-chart-green/50" : "bg-gradient-to-r from-chart-red to-chart-red/50"
                }`}
                style={{ 
                  width: `${Math.min(Math.abs(stats.sessionChangePct) * 10, 100)}%` 
                }}
              />
            </div>
          )}
        </div>

        {/* Session High */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-green/60" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">High</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            {stats.high !== null ? `$${stats.high.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </span>
        </div>

        {/* Session Low */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-red/60" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">Low</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            {stats.low !== null ? `$${stats.low.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </span>
        </div>
      </div>

      {/* Price Range Visualization Bar */}
      {hasRange && (
        <div className="relative px-6 pb-4">
          <div className="h-2 w-full bg-gradient-to-r from-chart-red/20 via-muted/20 to-chart-green/20 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-3 bg-primary rounded-full shadow-lg shadow-primary/50 animate-pulse" 
                   style={{ 
                     marginLeft: `${stats.sessionChangePct !== null ? (50 + (stats.sessionChangePct * 2)) : 50}%` 
                   }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- MICRO TIMEFRAME PANEL ---------- */

function MicroTimeframePanel({
  candles1m,
  candles15m,
}: {
  candles1m: { open: number; high: number; low: number; close: number; volume: number }[];
  candles15m: { open: number; high: number; low: number; close: number; volume: number }[];
}) {
  if (!candles1m.length) {
    return (
      <div className="flex flex-col gap-3 p-6 rounded-xl bg-gradient-to-br from-card via-card to-card/95 border border-border/40 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Initializing price stream
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const last1m = candles1m[candles1m.length - 1];
  const prev1m = candles1m[candles1m.length - 2] ?? last1m;
  const microChange = ((last1m.close - prev1m.close) / prev1m.close) * 100;

  const last15m = candles15m[candles15m.length - 1] ?? last1m;
  const body = last15m.close - last15m.open;
  const wick = last15m.high - last15m.low;
  const bodyRatio = wick ? Math.abs(body / wick) : 0;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br from-card via-card to-card/95 border border-border/40 hover:border-border/60 transition-all duration-300 shadow-lg hover:shadow-xl">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Intraday Tape</span>
        <span className="text-[10px] text-muted-foreground/70 font-medium">1m / 15m</span>
      </div>

      <MiniRow
        label="1m Pulse"
        value={`${microChange >= 0 ? '+' : ''}${microChange.toFixed(2)}%`}
        hint={microChange > 0.1 ? "Bid lifting" : microChange < -0.1 ? "Selling pressure" : "Consolidating"}
        positive={microChange > 0.1}
        negative={microChange < -0.1}
      />
      <MiniRow
        label="15m Body Ratio"
        value={`${(bodyRatio * 100).toFixed(0)}%`}
        hint={bodyRatio > 0.7 ? "Strong conviction" : bodyRatio > 0.3 ? "Balanced" : "Indecision"}
        positive={bodyRatio > 0.7}
      />
      <MiniRow 
        label="1m Volume" 
        value={last1m.volume >= 1000 ? `${(last1m.volume / 1000).toFixed(1)}K` : last1m.volume.toFixed(0)} 
        hint="Last candle" 
      />
    </div>
  );
}

function MiniRow({
  label,
  value,
  hint,
  positive,
  negative,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex flex-col border-b border-border/30 pb-2.5 last:border-b-0 last:pb-0 transition-colors hover:border-border/50">
      <div className="flex justify-between items-center mb-1">
        <span className="text-muted-foreground text-[11px] font-semibold">{label}</span>
        <span
          className={`text-sm font-bold transition-colors ${
            positive ? "text-chart-green" : negative ? "text-chart-red" : "text-foreground"
          }`}
        >
          {value}
        </span>
      </div>
      {hint && <span className="text-[10px] text-muted-foreground/80 font-medium">{hint}</span>}
    </div>
  );
}

/* ---------- PURE HELPERS (NO REACT) ---------- */

function buildSessionStats(candles: { close: number; high: number; low: number }[]): SessionStats {
  if (!candles || candles.length < 2) {
    return {
      sessionChangePct: null,
      high: null,
      low: null,
      rangePct: null,
      direction: null,
    };
  }

  const first = candles[0];
  const last = candles[candles.length - 1];

  const sessionChangePct = ((last.close - first.close) / first.close) * 100;
  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  const rangePct = ((high - low) / first.close) * 100;

  const direction = sessionChangePct > 0.3 ? "up" : sessionChangePct < -0.3 ? "down" : "flat";

  return {
    sessionChangePct,
    high,
    low,
    rangePct,
    direction,
  };
}

function buildAlerts(
  candles1m: { close: number; open: number }[],
  candles15m: { close: number; open: number }[],
  candles1h: { close: number; open: number }[],
): AlertBadge[] {
  const alerts: AlertBadge[] = [];

  if (!candles1h.length) return alerts;

  const last1h = candles1h[candles1h.length - 1];
  const first1h = candles1h[0];
  const sessionMovePct = ((last1h.close - first1h.close) / first1h.close) * 100;

  if (Math.abs(sessionMovePct) > 2) {
    alerts.push({
      id: "trend-move",
      label: sessionMovePct > 0 ? `📈 1H up ${sessionMovePct.toFixed(1)}%` : `📉 1H down ${sessionMovePct.toFixed(1)}%`,
      severity: "warn",
    });
  }

  if (candles15m.length >= 4) {
    const last = candles15m[candles15m.length - 1].close;
    const prev = candles15m[candles15m.length - 4].close;
    const move15m = ((last - prev) / prev) * 100;

    if (Math.abs(move15m) > 1) {
      alerts.push({
        id: "momentum-15m",
        label: move15m > 0 ? `⚡ 15m impulse +${move15m.toFixed(1)}%` : `⚡ 15m dump ${move15m.toFixed(1)}%`,
        severity: "danger",
      });
    }
  }

  if (candles1m.length >= 3) {
    const last = candles1m[candles1m.length - 1];
    const prev = candles1m[candles1m.length - 2];
    const body = Math.abs(last.close - last.open);
    const prevBody = Math.abs(prev.close - prev.open);

    if (body > prevBody * 2) {
      alerts.push({
        id: "big-candle-1m",
        label: "🕯️ Large 1m candle detected",
        severity: "info",
      });
    }
  }

  return alerts;
}
