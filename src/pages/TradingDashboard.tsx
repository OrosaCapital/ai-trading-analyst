import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TradingCommandCenter } from "@/components/trading/TradingCommandCenter";
import { TradingViewChart } from "@/components/TradingViewChart";
import { LocalIndicatorsPanel } from "@/components/trading/LocalIndicatorsPanel";
import { ExchangeCoverage } from "@/components/trading/ExchangeCoverage";
import { FundingRateChart } from "@/components/trading/FundingRateChart";
import { AlertStrip, type AlertBadge } from "@/components/trading/AlertStrip";
import { SessionStatsPanel, type SessionStats } from "@/components/trading/SessionStatsPanel";
import { MicroTimeframePanel } from "@/components/trading/MicroTimeframePanel";
import { useProfessionalChartData } from "@/hooks/useProfessionalChartData";

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
    <AppShell showProgress={false} minutesCollected={0} minutesRequired={0}>
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

        <div className="lg:col-span-4 flex flex-col gap-4">
          <ExchangeCoverage />
          <FundingRateChart symbol={normalizedSymbol} />
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
            <div className="text-lg font-bold text-primary tracking-tight">Real-Time Market Analysis</div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Live price streaming • Technical indicators • Multi-timeframe analysis • Exchange coverage
          </p>
        </div>
      </div>
    </AppShell>
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
  candles1h: { close: number; open: number }[]
): AlertBadge[] {
  const alerts: AlertBadge[] = [];

  if (!candles1m.length || !candles15m.length || !candles1h.length) {
    return alerts;
  }

  const last1m = candles1m[candles1m.length - 1];
  const last15m = candles15m[candles15m.length - 1];
  const last1h = candles1h[candles1h.length - 1];

  // 1m spike
  const last1mChange = ((last1m.close - last1m.open) / last1m.open) * 100;
  if (Math.abs(last1mChange) > 0.5) {
    alerts.push({
      id: "1m-spike",
      label: last1mChange > 0 ? "1m rally" : "1m dump",
      severity: "warn",
    });
  }

  // 15m reversal
  const last15mChange = ((last15m.close - last15m.open) / last15m.open) * 100;
  const prev15m = candles15m[candles15m.length - 2] || last15m;
  const prev15mChange = ((prev15m.close - prev15m.open) / prev15m.open) * 100;
  if (last15mChange * prev15mChange < 0 && Math.abs(last15mChange) > 0.3) {
    alerts.push({
      id: "15m-reversal",
      label: "15m reversal forming",
      severity: "info",
    });
  }

  // 1h trend shift
  if (candles1h.length >= 3) {
    const h1 = candles1h[candles1h.length - 3];
    const h2 = candles1h[candles1h.length - 2];
    const h3 = candles1h[candles1h.length - 1];
    if ((h1.close < h2.close && h2.close > h3.close) || (h1.close > h2.close && h2.close < h3.close)) {
      alerts.push({
        id: "1h-trend",
        label: "1h momentum shift",
        severity: "info",
      });
    }
  }

  return alerts;
}
