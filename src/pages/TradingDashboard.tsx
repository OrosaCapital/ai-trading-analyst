import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TradingCommandCenter } from "@/components/trading/TradingCommandCenter";
import { TradingViewChart } from "@/components/TradingViewChart";
import { SimpleIndicatorPanel } from "@/components/trading/LocalIndicatorsPanel";
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

  const { chartData } = useProfessionalChartData(normalizedSymbol);

  const currentPrice = chartData?.candles1h?.[chartData.candles1h.length - 1]?.close ?? null;

  return (
    <AppShell showProgress={false} minutesCollected={0} minutesRequired={0} symbol={normalizedSymbol}>
      <TradingCommandCenter
        symbol={symbol}
        onSymbolChange={setSymbol}
        currentPrice={currentPrice}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 mb-2">
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="h-[450px]">
            <TradingViewChart symbol={normalizedSymbol} />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-2 overflow-y-auto">
          <SimpleIndicatorPanel candles={chartData?.candles1h || []} />
        </div>
      </div>

      <div className="h-[300px] flex items-center justify-center text-gray-400">
        Simple Mode Active — No external analytics
      </div>
    </AppShell>
  );
}
