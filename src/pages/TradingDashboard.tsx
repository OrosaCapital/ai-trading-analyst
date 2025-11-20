import { useMemo, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TradingNavigation } from "@/components/trading/TradingNavigation";
import { FilterBar } from "@/components/trading/FilterBar";
import { KPICard } from "@/components/trading/KPICard";
import { DayTraderChartContainer } from "@/components/charts/DayTraderChartContainer";
import { FundingRateChart } from "@/components/trading/FundingRateChart";
import { AlertStrip, type AlertBadge } from "@/components/trading/AlertStrip";
import { MicroTimeframePanel } from "@/components/trading/MicroTimeframePanel";
import { SessionStatsPanel, type SessionStats } from "@/components/trading/SessionStatsPanel";
import { useChartData } from "@/hooks/useChartData";
import { useFreshSymbolData } from "@/hooks/useFreshSymbolData";
import { formatPrice, formatVolume } from "@/lib/priceFormatter";
import { Card } from "@/components/ui/card";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useProfessionalChartData } from "@/hooks/useProfessionalChartData";
import { toast } from "@/hooks/use-toast";

export default function TradingDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h");
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
  const { isFetching: isFetchingFresh } = useFreshSymbolData(normalizedSymbol);
  
  const { candles, isLoading, isUsingFallback, error } = useChartData(normalizedSymbol, 50000, dateRange, timeframe, filters);
  const { chartData, isLoading: isChartLoading } = useProfessionalChartData(normalizedSymbol, dateRange, timeframe, filters);

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

  const currentPrice =
    candles.length > 0
      ? candles[candles.length - 1].close
      : null;

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
    chartData?.indicators || {}
  );
  
  console.log("TradingDashboard - AI state:", { 
    analysis, 
    isAnalyzing,
    aiSymbol,
    willAnalyze: !!aiSymbol 
  });

  const sessionStats = useMemo(() => buildSessionStats(candles), [candles]);
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
      <div className="flex min-h-screen w-full bg-background">
        <TradingNavigation />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with trigger and filters */}
          <header className="flex items-center border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="ml-4" />
            <div className="flex-1">
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
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Alert Strip */}
            <AlertStrip alerts={alerts} isLoading={isLoading || isAnalyzing} />

            {/* Top KPIs - 5 Second Rule: Most Important Info */}
            {kpis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Current Price"
                  value={currentPrice ? formatPrice(currentPrice) : "Loading..."}
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
            )}

            {/* Main Chart - Priority Widget */}
            <DayTraderChartContainer 
              symbol={normalizedSymbol}
              candles={candles}
              isLoading={isLoading}
              isUsingFallback={isUsingFallback}
              error={error}
            />

            {/* Secondary Metrics Grid - Max 5-6 widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <FundingRateChart symbol={normalizedSymbol} />
              <MicroTimeframePanel candles1m={candles} candles15m={candles} />
              
              {/* Session Summary Card */}
              {sessionStats && (
                <Card className="p-4 bg-gradient-to-br from-card via-card to-card/95 border border-border/40">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">
                    Session Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Direction</span>
                      <span className={`text-sm font-bold ${
                        sessionStats.direction === 'up' ? 'text-chart-green' :
                        sessionStats.direction === 'down' ? 'text-chart-red' :
                        'text-muted-foreground'
                      }`}>
                        {sessionStats.direction?.toUpperCase() || 'NEUTRAL'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Range</span>
                      <span className="text-sm font-bold">
                        {sessionStats.rangePct?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
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
