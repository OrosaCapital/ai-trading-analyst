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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="h-[500px] rounded-xl overflow-hidden border border-border/50 bg-card shadow-lg">
            <TradingViewChart symbol={normalizedSymbol} />
          </div>

          <SessionStatsPanel stats={sessionStats} symbol={normalizedSymbol} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[700px] overflow-y-auto">
          <LocalIndicatorsPanel candles={candles1m} />
          <MicroTimeframePanel candles1m={candles1m} candles15m={candles15m} />
        </div>
      </div>

      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border-t border-border/50 mt-3 bg-card/30 rounded-lg">
        <div className="text-center">
          <p className="font-medium">Simple Data Mode</p>
          <p className="text-xs mt-1">All analytics are local from your chart stream • No external APIs</p>
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
        <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-medium">
          Syncing candles…
        </span>
      )}
      {alerts.length === 0 && !isLoading && (
        <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
          No active alerts • Market neutral
        </span>
      )}
      {alerts.map((a) => (
        <span
          key={a.id}
          className={`px-3 py-1.5 rounded-full border font-medium ${
            a.severity === "danger"
              ? "bg-red-500/10 text-red-400 border-red-500/30"
              : a.severity === "warn"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-sky-500/10 text-sky-300 border-sky-500/30"
          }`}
        >
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
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-card border border-border/50 rounded-xl p-4 shadow-sm">
      <StatItem label="Symbol" value={symbol} accent="text-sky-400" />
      <StatItem
        label="Session Change"
        value={stats.sessionChangePct !== null ? `${stats.sessionChangePct.toFixed(2)}%` : "--"}
        accent={
          stats.sessionChangePct !== null && stats.sessionChangePct > 0
            ? "text-emerald-400"
            : stats.sessionChangePct !== null && stats.sessionChangePct < 0
              ? "text-red-400"
              : "text-muted-foreground"
        }
      />
      <StatItem label="Session High" value={stats.high !== null ? stats.high.toFixed(2) : "--"} />
      <StatItem label="Session Low" value={stats.low !== null ? stats.low.toFixed(2) : "--"} />
    </div>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <span className={`text-sm font-semibold ${accent ?? "text-foreground"}`}>{value}</span>
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
    return <div className="p-4 rounded-xl bg-card border border-border/50 text-sm text-muted-foreground">Waiting for intraday price stream…</div>;
  }

  const last1m = candles1m[candles1m.length - 1];
  const prev1m = candles1m[candles1m.length - 2] ?? last1m;
  const microChange = ((last1m.close - prev1m.close) / prev1m.close) * 100;

  const last15m = candles15m[candles15m.length - 1] ?? last1m;
  const body = last15m.close - last15m.open;
  const wick = last15m.high - last15m.low;
  const bodyRatio = wick ? Math.abs(body / wick) : 0;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border/50 text-xs shadow-sm">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Intraday Tape</span>
        <span className="text-[10px] text-muted-foreground">1m / 15m micro-view</span>
      </div>

      <MiniRow
        label="1m Pulse"
        value={`${microChange.toFixed(2)}%`}
        hint={microChange > 0 ? "Bid lifting" : microChange < 0 ? "Selling pressure" : "Flat"}
        positive={microChange > 0}
        negative={microChange < 0}
      />
      <MiniRow
        label="15m Candle Shape"
        value={bodyRatio.toFixed(2)}
        hint={bodyRatio > 0.7 ? "Strong conviction candle" : bodyRatio > 0.3 ? "Balanced" : "Indecision / wick-heavy"}
      />
      <MiniRow label="1m Volume" value={last1m.volume.toFixed(0)} hint="Raw last candle volume" />
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
    <div className="flex flex-col border-b border-border/50 pb-2 last:border-b-0 last:pb-0">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
        <span
          className={`text-[11px] font-semibold ${
            positive ? "text-emerald-400" : negative ? "text-red-400" : "text-foreground"
          }`}
        >
          {value}
        </span>
      </div>
      {hint && <span className="text-[10px] text-muted-foreground mt-1">{hint}</span>}
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
