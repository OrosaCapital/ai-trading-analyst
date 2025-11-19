import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TradingCommandCenter } from "@/components/trading/TradingCommandCenter";
import { TradingViewChart } from "@/components/TradingViewChart";
import { AIDecisionPanel } from "@/components/trading/AIDecisionPanel";
import { useProfessionalChartData } from "@/hooks/useProfessionalChartData";
import { calculateTradeSignal } from "@/lib/signalEngine";

export default function TradingDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("1h");

  const normalizeSymbol = (sym: string) => {
    const clean = sym.toUpperCase().replace(/\//g, "").trim();
    if (!clean || clean === "USDT" || clean === "USD") return "BTCUSDT";
    if (clean.endsWith("USDT")) return clean;
    if (clean.endsWith("USD")) return clean.replace("USD", "USDT");
    return `${clean}USDT`;
  };

  const normalizedSymbol = normalizeSymbol(symbol);

  const { chartData, isLoading: chartLoading } = useProfessionalChartData(normalizedSymbol);

  const currentPrice = chartData?.candles1h?.[chartData.candles1h.length - 1]?.close ?? null;

  let aiSignal = null;

  if (chartData && chartData.candles1h.length > 10 && chartData.indicators) {
    aiSignal = calculateTradeSignal({
      price1h: chartData.candles1h[chartData.candles1h.length - 1]?.close ?? 0,
      ema501h: chartData.indicators["1h"].ema50,
      rsi1h: chartData.indicators["1h"].rsi,
      price15m: chartData.candles15m[chartData.candles15m.length - 1]?.close ?? 0,
      ema5015m: chartData.indicators["15m"].ema50,
      rsi15m: chartData.indicators["15m"].rsi,
      currentVolume: chartData.candles1h[chartData.candles1h.length - 1]?.volume ?? 0,
      volumeSMA: chartData.indicators["1h"].volumeSMA,
    });
  }

  return (
    <AppShell showProgress={false} minutesCollected={0} minutesRequired={0} symbol={normalizedSymbol}>
      <TradingCommandCenter
        symbol={symbol}
        onSymbolChange={setSymbol}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        currentPrice={currentPrice}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 mb-2">
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="h-[450px]">
            <TradingViewChart symbol={normalizedSymbol} />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-2 overflow-y-auto">
          <AIDecisionPanel aiData={aiSignal} isLoading={chartLoading} error={null} currentPrice={currentPrice} />
        </div>
      </div>

      <div className="h-[300px] flex items-center justify-center text-gray-400">
        Simple Mode Active — No external analytics
      </div>
    </AppShell>
  );
}
