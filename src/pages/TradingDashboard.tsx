import { useMemo, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TradingNavigation } from "@/components/trading/TradingNavigation";
import { FilterBar } from "@/components/trading/FilterBar";
import { KPICard } from "@/components/trading/KPICard";
import { DayTraderChartContainer } from "@/components/charts/DayTraderChartContainer";
import { FundingRateChart } from "@/components/trading/FundingRateChart";
import { AlertStrip, type AlertBadge } from "@/components/trading/AlertStrip";
import { MicroTimeframePanel } from "@/components/trading/MicroTimeframePanel";
import { useChartData } from "@/hooks/useChartData";
import { useFreshSymbolData } from "@/hooks/useFreshSymbolData";
import { formatPrice, formatVolume } from "@/lib/priceFormatter";
import { Card } from "@/components/ui/card";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useProfessionalChartData } from "@/hooks/useProfessionalChartData";
import { useRealtimePriceStream } from "@/hooks/useRealtimePriceStream";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function TradingDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<"15m" | "1h" | "4h" | "1d" | "1w">("1h");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return { from: startOfDay, to: today };
  });
  const [filters, setFilters] = useState({
    minVolume: 0,
    maxVolume: Infinity,
    showOnlySignals: false,
  });

  const normalizeSymbol = (sym: string) => {
    const clean = sym.toUpperCase().replace(/\//g, "").trim();
    if (!clean || clean === "USDT" || clean === "USD") return "BTCUSDT";
    if (clean.endsWith("USDT")) return clean;
    if (clean.endsWith("USD")) return clean.replace("USD", "USDT");
    return `${clean}USDT`;
  };

  const normalizedSymbol = normalizeSymbol(symbol);
  
  // Automatically fetch fresh data when symbol changes
  useFreshSymbolData(normalizedSymbol);
  
  // Real-time price stream from WebSocket
  const { priceData, isConnected } = useRealtimePriceStream(normalizedSymbol, true);
  
  const { candles, isLoading, isUsingFallback, error } = useChartData(normalizedSymbol, 50000, dateRange, timeframe, filters);
  const { chartData } = useProfessionalChartData(normalizedSymbol, dateRange, timeframe, filters);

  console.log("=== CHART DATA DEBUG ===", {
    chartDataExists: !!chartData,
    chartDataKeys: chartData ? Object.keys(chartData) : [],
    candles1hExists: chartData?.candles1h !== undefined,
    candles1hLength: chartData?.candles1h?.length,
    candles15mLength: chartData?.candles15m?.length,
    fullChartData: chartData
  });

  // DEBUG: Show what data we have
  useEffect(() => {
    if (chartData) {
      console.log("TradingDashboard - chartData loaded:", {
        has1h: !!chartData.candles1h,
        count1h: chartData.candles1h?.length,
        has15m: !!chartData.candles15m,
        count15m: chartData.candles15m?.length,
        hasIndicators: !!chartData.indicators
      });
      toast({
        title: "📊 Chart Data Loaded",
        description: `1h: ${chartData.candles1h?.length || 0} candles, 15m: ${chartData.candles15m?.length || 0} candles`,
      });
    }
  }, [chartData]);

  // CRITICAL: Use ONLY WebSocket price for live display - no database fallback!
  // Candles are for charts/AI only, not live price display
  const currentPrice = priceData?.price ?? null;

  console.log("TradingDashboard - chartData:", {
    has1h: !!chartData?.candles1h?.length,
    count1h: chartData?.candles1h?.length,
    has15m: !!chartData?.candles15m?.length,
    count15m: chartData?.candles15m?.length,
    hasIndicators: !!chartData?.indicators,
    symbol: normalizedSymbol
  });

  // Only pass symbol to AI when we have sufficient candle data
  const aiSymbol = chartData?.candles1h && chartData.candles1h.length >= 10 ? normalizedSymbol : "";
  
  const { analysis, isAnalyzing } = useAIAnalysis(
    aiSymbol,
    chartData?.candles1h || [],
    chartData?.candles15m || [],
    chartData?.indicators || {},
    currentPrice || undefined // Pass live WebSocket price to AI
  );
  
  console.log("TradingDashboard - AI state:", { 
    analysis, 
    isAnalyzing,
    aiSymbol,
    willAnalyze: !!aiSymbol 
  });

  const sessionStats = useMemo(() => buildSessionStats(candles), [candles]);
  const systemDiagnostics = useMemo(() => {
    const candlesLoaded = chartData?.candles1h?.length ?? 0;
    const aiState = isAnalyzing ? "Synthesizing" : analysis ? "Synced" : "Idle";
    return [
      {
        id: "feed",
        label: "Market Feed",
        value: isConnected ? "Live" : "Link Lost",
        tone: isConnected ? "success" : "danger",
      },
      {
        id: "ai",
        label: "AI Analyst",
        value: aiState,
        tone: isAnalyzing ? "pulse" : analysis ? "success" : "neutral",
      },
      {
        id: "coverage",
        label: "Data Window",
        value: candlesLoaded ? `${candlesLoaded}x 1h bars` : "Awaiting sync",
        tone: candlesLoaded ? "info" : "neutral",
      },
    ] as const;
  }, [analysis, isAnalyzing, isConnected, chartData]);

  const alerts = useMemo(() => {
    const baseAlerts = buildAlerts(candles, candles, candles);
    
    console.log("TradingDashboard - Building alerts:", { 
      hasAnalysis: !!analysis, 
      analysisMessage: analysis?.message,
      baseAlertsCount: baseAlerts.length 
    });
    
    if (analysis) {
      const aiAlert = {
        id: "ai-signal",
        label: `🤖 AI: ${analysis.message}`,
        severity: "info" as const
      };
      console.log("TradingDashboard - Adding AI alert:", aiAlert);
      return [aiAlert, ...baseAlerts];
    }
    
    return baseAlerts;
  }, [candles, analysis]);

  // Calculate KPIs for top display
  const kpis = useMemo(() => {
    if (!candles.length) return null;
    
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;
    const dayChange = ((last.close - prev.close) / prev.close) * 100;
    
    const volume = candles.reduce((sum, c) => sum + (c.volume || 0), 0);
    const high24h = Math.max(...candles.map(c => c.high));
    const low24h = Math.min(...candles.map(c => c.low));
    
    return { dayChange, volume, high24h, low24h };
  }, [candles]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="relative flex min-h-screen w-full bg-background/95">
        <div className="holo-grid" />
        <div className="aurora aurora-top" />
        <div className="aurora aurora-bottom" />
        <TradingNavigation />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="relative border-b border-white/5 bg-gradient-to-r from-background/60 via-background/40 to-background/10 backdrop-blur-xl">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,hsla(var(--primary)/0.18),transparent_60%)]" />
            <div className="relative z-10 space-y-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
                    Mission Control
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold text-gradient">NeuroFlow Trading Deck</h1>
                    <SidebarTrigger className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground hover:border-primary/40" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Real-time liquidity, sentiment, and AI overlays stay intact — we’re amplifying the experience with a tighter layout, holographic surfacing, and status telemetry.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {systemDiagnostics.map((diag) => (
                    <div
                      key={diag.id}
                      className={cn(
                        "status-chip",
                        {
                          success: "status-chip--success",
                          danger: "status-chip--danger",
                          info: "status-chip--info",
                          pulse: "status-chip--pulse",
                          neutral: "status-chip--neutral",
                        }[diag.tone]
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {diag.label}
                      </span>
                      <span className="text-sm font-semibold">{diag.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-white/5 shadow-2xl shadow-black/40">
                <FilterBar 
                  symbol={symbol} 
                  onSymbolChange={setSymbol}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
                {kpis && (
                  <div className="glass-cluster rounded-2xl p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <KPICard
                        label="Current Price"
                        value={currentPrice ? formatPrice(currentPrice) : (isConnected ? "Connecting..." : "WebSocket Offline")}
                        change={kpis.dayChange}
                        trend={kpis.dayChange > 0 ? "up" : "down"}
                        subtitle={normalizedSymbol}
                      />
                      <KPICard
                        label="24h Volume"
                        value={formatVolume(kpis.volume)}
                        subtitle="Trading activity"
                      />
                      <KPICard
                        label="24h High"
                        value={formatPrice(kpis.high24h)}
                        subtitle="Peak price"
                      />
                      <KPICard
                        label="24h Low"
                        value={formatPrice(kpis.low24h)}
                        subtitle="Lowest price"
                      />
                    </div>
                  </div>
                )}
                <div className="glass-panel rounded-2xl border border-white/5 p-4">
                  <div className="flex items-center justify-between pb-3">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Signal Matrix</p>
                    <span className="text-[10px] font-semibold text-muted-foreground">Realtime</span>
                  </div>
                  <AlertStrip alerts={alerts} isLoading={isLoading || isAnalyzing} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
                <DayTraderChartContainer 
                  symbol={normalizedSymbol}
                  candles={candles}
                  isLoading={isLoading}
                  isUsingFallback={isUsingFallback}
                  error={error}
                />
                <div className="space-y-4">
                  <FundingRateChart symbol={normalizedSymbol} />
                  <MicroTimeframePanel candles1m={candles} candles15m={candles} />
                  {sessionStats && (
                    <Card className="p-4 holo-card">
                      <h3 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-4">
                        Session Vector
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Direction</span>
                          <span className={cn(
                            "text-sm font-semibold",
                            sessionStats.direction === "up" && "text-chart-green",
                            sessionStats.direction === "down" && "text-chart-red",
                            sessionStats.direction === "flat" && "text-muted-foreground"
                          )}>
                            {sessionStats.direction?.toUpperCase() || "NEUTRAL"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Range</span>
                          <span className="text-sm font-semibold">{sessionStats.rangePct?.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Session Change</span>
                          <span className="text-sm font-semibold">
                            {sessionStats.sessionChangePct?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

/* ---------- PURE HELPERS (NO REACT) ---------- */

function buildSessionStats(candles: { close: number; high: number; low: number }[]) {
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
