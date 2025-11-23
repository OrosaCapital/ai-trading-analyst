import { useState, useMemo, useEffect } from "react";
import { KPICard } from "@/components/trading/KPICard";
import { TradingNavigation } from "@/components/trading/TradingNavigation";
import { MarketDataSidebar } from "@/components/trading/MarketDataSidebar";
import { AdvancedChartContainer } from "@/components/charts/AdvancedChartContainer";
import { useKrakenOHLC } from "@/hooks/useKrakenOHLC";
import { useRealtimePriceStream } from "@/hooks/useRealtimePriceStream";
import { use24hStats } from "@/hooks/use24hStats";
import { formatPrice, formatVolume } from "@/lib/priceFormatter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useMarketStore } from "@/store/useMarketStore";
import { safeNumber, safeVolumeFormat } from "@/utils/safeNumber";

export default function AdvancedTrading() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d">("1h");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return { from: startOfDay, to: today };
  });

  const { candles, isLoading } = useKrakenOHLC(symbol, 60); // 60 = 1h interval
  const { priceData, isConnected, connectionStatus } = useRealtimePriceStream(symbol, true);
  const { high: high24h, low: low24h, volume: volume24h } = use24hStats(symbol);
  const { cmcQuotes, initialize } = useMarketStore();
  const currentPrice = priceData?.price ?? null;

  // Get global volume from CMC data
  const baseSymbol = symbol.replace(/USDT$/, '');
  const globalVolume = cmcQuotes?.[baseSymbol]?.volume24h || null;
  const totalValue = cmcQuotes?.[baseSymbol]?.marketCap || null;

  // Initialize market store on component mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  console.log("Adv Trading WS Status:", { isConnected, connectionStatus });

  const dayChange = useMemo(() => {
    if (candles.length < 2) return 0;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;
    if (!last?.close || !prev?.close) return 0;
    return ((last.close - prev.close) / prev.close) * 100;
  }, [candles]);

  const dateRangeLabel = dateRange
    ? `${dateRange.from.toLocaleDateString()} – ${dateRange.to.toLocaleDateString()}`
    : "Auto Sync";

  const statusPills = [
    {
      label: "Market Feed",
      value: isConnected ? "Live" : "Link Lost",
      tone: isConnected ? "text-emerald-300" : "text-amber-300",
    },
    {
      label: "Channel",
      value: (connectionStatus || "Idle").toUpperCase(),
      tone: "text-cyan-300",
    },
    {
      label: "Window",
      value: dateRangeLabel,
      tone: "text-slate-200",
    },
  ];

  const timeframeOptions: Array<{ label: string; value: typeof timeframe }> = [
    { label: "1H", value: "1h" },
    { label: "4H", value: "4h" },
    { label: "1D", value: "1d" },
  ];

  const directionalBias = dayChange > 0 ? "Bullish Pulse" : dayChange < 0 ? "Bearish Drift" : "Neutral Range";
  const rangeLabel =
    high24h != null && low24h != null
      ? `${formatPrice(low24h)} – ${formatPrice(high24h)}`
      : "Syncing";

  const diagnostics = [
    {
      label: "Trend Bias",
      value: directionalBias,
      hint: `${safeNumber(dayChange, 2)}%`,
      accent: dayChange > 0 ? "text-emerald-300" : dayChange < 0 ? "text-rose-300" : "text-slate-200",
    },
    {
      label: "Range Span",
      value: rangeLabel,
      hint: "24h window",
      accent: "text-sky-300",
    },
    {
      label: "Value Sync",
      value: totalValue ? safeVolumeFormat(totalValue) : "Scanning...",
      hint: "Market capitalization",
      accent: "text-purple-300",
    },
  ];

  const signalBands = [
    {
      label: "Impulse Ratio",
      value: `${safeNumber(dayChange, 2)}%`,
      hint: "24h delta",
      accent: dayChange > 0 ? "text-emerald-300" : dayChange < 0 ? "text-rose-300" : "text-slate-200",
      gradient: "from-emerald-500/40 via-transparent to-black/30",
    },
    {
      label: "Liquidity Span",
      value: rangeLabel,
      hint: "High ↔ Low window",
      accent: "text-sky-300",
      gradient: "from-sky-500/30 via-transparent to-black/30",
    },
    {
      label: "Value Flux",
      value: totalValue ? safeVolumeFormat(totalValue) : "Scanning...",
      hint: "Market capitalization",
      accent: "text-purple-300",
      gradient: "from-purple-500/30 via-transparent to-black/30",
    },
    {
      label: "Signal Channel",
      value: connectionStatus ? connectionStatus.toUpperCase() : "IDLE",
      hint: isConnected ? "WebSocket synchronized" : "Awaiting stream",
      accent: "text-cyan-300",
      gradient: "from-cyan-500/30 via-transparent to-black/30",
    },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background/95">
        <TradingNavigation />
        <div className="relative flex-1 overflow-hidden">
          <div className="holo-grid" />
          <div className="aurora aurora-top" />
          <div className="aurora aurora-bottom" />
          <div className="relative z-10 flex flex-col gap-6 px-4 py-6 lg:px-12">
            <header className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.6em] text-muted-foreground">
                    Advanced Operations Deck
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold text-gradient">Hyperion Advanced Trader</h1>
                    <SidebarTrigger className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] uppercase tracking-[0.45em] text-muted-foreground hover:border-primary/40" />
                  </div>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Precision-grade order flow, execution, and telemetry fused into a dark-matter control surface.
                    Maintain alignment, monitor liquidity vectors, and deploy with confidence.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {statusPills.map((pill) => (
                    <div
                      key={pill.label}
                      className="min-w-[150px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-lg shadow-black/40"
                    >
                      <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{pill.label}</p>
                      <p className={`text-sm font-semibold ${pill.tone}`}>{pill.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </header>

        <section className="glass-panel rounded-3xl border border-white/5 p-6 shadow-2xl shadow-black/50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Current Price"
              value={currentPrice ? formatPrice(currentPrice) : (isConnected ? "Connecting..." : "WebSocket Offline")}
              change={dayChange}
              trend={dayChange > 0 ? "up" : "down"}
              subtitle={symbol}
            />
            <KPICard
              label="Total Value"
              value={totalValue ? safeVolumeFormat(totalValue) : "Loading..."}
              subtitle="Market capitalization"
            />
            <KPICard
              label="24h High"
              value={high24h ? formatPrice(high24h) : "Loading..."}
              subtitle="Peak price"
            />
            <KPICard
              label="24h Low"
              value={low24h ? formatPrice(low24h) : "Loading..."}
              subtitle="Lowest price"
            />
          </div>
        </section>

        <section className="glass-panel rounded-3xl border border-white/5 p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">Symbol Matrix</p>
              <h2 className="text-2xl font-semibold text-white">{symbol}</h2>
              <p className="text-xs text-muted-foreground">Kraken OHLC feed • Smart stacking</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.3em] transition ${
                    timeframe === option.value
                      ? "border-primary/60 bg-primary/20 text-primary"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/5 bg-black/40 p-3 backdrop-blur">
            <div className="h-[460px] w-full rounded-xl border border-white/5 bg-background/60">
              <AdvancedChartContainer symbol={symbol} candles={candles} isLoading={isLoading} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diagnostics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/10 via-transparent to-black/40 px-4 py-5 shadow-lg shadow-black/30"
            >
              <p className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">{metric.label}</p>
              <p className={`text-xl font-semibold ${metric.accent}`}>{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/5 bg-black/40 p-6 shadow-xl shadow-cyan-500/10">
            <div className="flex items-center justify-between pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">Signal Lattice</p>
                <p className="text-xs text-muted-foreground">Adaptive indicators derived from live feed</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Analyst View
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {signalBands.map((band) => (
                <div
                  key={band.label}
                  className={`rounded-2xl border border-white/5 bg-gradient-to-br ${band.gradient} p-4 backdrop-blur`}
                >
                  <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{band.label}</p>
                  <p className={`text-lg font-semibold ${band.accent}`}>{band.value}</p>
                  <p className="text-xs text-muted-foreground">{band.hint}</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-transparent"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/40 p-4 shadow-xl shadow-purple-500/10">
            <div className="flex items-center justify-between pb-3">
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Market Data Uplink</p>
              <span className="text-[10px] font-semibold text-purple-300/80">Signals</span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
              <MarketDataSidebar />
            </div>
          </div>
        </section>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
