import { useState } from "react";
import { TradingCommandCenter } from "@/components/trading/TradingCommandCenter";
import { ProfessionalTradingChart } from "@/components/ProfessionalTradingChart";
import { MetricsColumn } from "@/components/trading/MetricsColumn";
import { AIDecisionPanel } from "@/components/trading/AIDecisionPanel";
import { AdvancedAnalyticsTabs } from "@/components/trading/AdvancedAnalyticsTabs";
import { DataAccumulationBanner } from "@/components/trading/DataAccumulationBanner";
import { useAITradingData } from "@/hooks/useAITradingData";
import { useProfessionalChartData } from "@/hooks/useProfessionalChartData";

export default function TradingDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("1h");

  const { data: aiData, isLoading: aiLoading, error: aiError } = useAITradingData(symbol);
  const { chartData, isLoading: chartLoading, error: chartError } = useProfessionalChartData(symbol);

  // Safely get current price
  const currentPrice = chartData?.candles1h?.[chartData.candles1h.length - 1]?.close;

  // Check if we're in data accumulation phase
  const isAccumulating = aiData?.status === "accumulating" || 
    (aiError?.includes("Found") && aiError?.includes("minutes")) ||
    (chartError?.includes("Found") && chartError?.includes("minutes"));

  // Extract minutes collected from error message
  const extractMinutes = (error: string | null) => {
    if (!error) return 0;
    const match = error.match(/Found (\d+)\/(\d+) minutes/);
    return match ? parseInt(match[1]) : 0;
  };

  const minutesCollected = aiData?.progress 
    ? Math.floor((aiData.progress / 100) * 15) 
    : extractMinutes(aiError) || extractMinutes(chartError);

  return (
    <div className="flex h-full flex-col gap-4 pb-8">
      {/* Top Command Center */}
      <TradingCommandCenter 
        symbol={symbol}
        onSymbolChange={setSymbol}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        currentPrice={currentPrice}
      />

      {/* Show accumulation banner if needed */}
      {isAccumulating && (
        <DataAccumulationBanner 
          symbol={symbol}
          minutesCollected={minutesCollected}
          minutesRequired={15}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left - Primary Chart (60%) */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <ProfessionalTradingChart
            symbol={symbol}
          />
        </div>

        {/* Center - Market Metrics (20%) */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
          <MetricsColumn symbol={symbol} />
        </div>

        {/* Right - AI Decision Panel (20%) */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
          <AIDecisionPanel 
            aiData={aiData}
            isLoading={aiLoading}
            error={aiError}
            currentPrice={currentPrice}
          />
        </div>
      </div>

      {/* Bottom - Advanced Analytics */}
      <div className="h-[400px]">
        <AdvancedAnalyticsTabs symbol={symbol} />
      </div>
    </div>
  );
}
