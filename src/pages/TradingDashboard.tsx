import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TradingCommandCenter } from "@/components/trading/TradingCommandCenter";
import { TradingViewChart } from "@/components/TradingViewChart";
import { AIDecisionPanel } from "@/components/trading/AIDecisionPanel";
import { AdvancedAnalyticsTabs } from "@/components/trading/AdvancedAnalyticsTabs";
import { useAITradingData } from "@/hooks/useAITradingData";
import { useProfessionalChartData } from "@/hooks/useProfessionalChartData";

export default function TradingDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("1h");
  const [dataStartTime, setDataStartTime] = useState<Date | null>(null);
  const [realtimeMinutes, setRealtimeMinutes] = useState(0);

  // Normalize symbol to ensure it has USDT suffix for API calls
  const normalizeSymbol = (sym: string) => {
    const clean = sym.toUpperCase().replace(/\//g, '').trim();
    // If it's empty or just "USDT", default to BTCUSDT
    if (!clean || clean === 'USDT' || clean === 'USD') return 'BTCUSDT';
    if (clean.endsWith('USDT')) return clean;
    if (clean.endsWith('USD')) return clean.replace('USD', 'USDT');
    return `${clean}USDT`;
  };

  const normalizedSymbol = normalizeSymbol(symbol);

  const { data: aiData, isLoading: aiLoading, error: aiError } = useAITradingData(normalizedSymbol);
  const { chartData, isLoading: chartLoading, error: chartError } = useProfessionalChartData(normalizedSymbol);

  // Safely get current price with fallback
  const currentPrice = chartData?.candles1h?.[chartData.candles1h.length - 1]?.close;

  // Check if we're in data accumulation phase - treat as normal state, not error
  const hasInsufficientData = (error: string | null | undefined): boolean => {
    if (!error) return false;
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
    return errorStr.includes("Found") && errorStr.includes("minutes");
  };

  const isAccumulating = aiData?.status === "accumulating" || 
    hasInsufficientData(aiError) ||
    hasInsufficientData(chartError);

  // Start tracking time when accumulation begins
  useEffect(() => {
    if (isAccumulating && !dataStartTime) {
      setDataStartTime(new Date());
    } else if (!isAccumulating && dataStartTime) {
      setDataStartTime(null);
      setRealtimeMinutes(0);
    }
  }, [isAccumulating, dataStartTime]);

  // Real-time minute counter
  useEffect(() => {
    if (!dataStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - dataStartTime.getTime()) / 60000);
      setRealtimeMinutes(elapsed);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [dataStartTime]);

  // Extract minutes collected from backend
  const extractMinutes = (error: string | null | undefined): number => {
    if (!error) return 0;
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
    const match = errorStr.match(/Found (\d+)\/(\d+) minutes/);
    return match ? parseInt(match[1]) : 0;
  };

  // Use backend data or real-time calculation, whichever is higher
  const backendMinutes = aiData?.progress 
    ? Math.floor((aiData.progress / 100) * 15) 
    : extractMinutes(aiError) || extractMinutes(chartError);
  
  const minutesCollected = Math.max(backendMinutes, realtimeMinutes);

  // Only show real errors, not accumulation status
  const hasRealError = (error: string | null | undefined): boolean => {
    if (!error) return false;
    return !hasInsufficientData(error);
  };

  const displayAiError = hasRealError(aiError) ? aiError : null;
  const displayChartError = hasRealError(chartError) ? chartError : null;

  return (
    <AppShell 
      showProgress={isAccumulating}
      minutesCollected={minutesCollected}
      minutesRequired={15}
      symbol={normalizedSymbol}
    >
      {/* Top Command Center */}
      <TradingCommandCenter 
        symbol={symbol}
        onSymbolChange={setSymbol}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        currentPrice={currentPrice}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 mb-2">
        {/* Left - Primary Chart (70%) */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="h-[450px]">
            <TradingViewChart symbol={normalizedSymbol} />
          </div>
        </div>

        {/* Right - AI Decision Panel (30%) */}
        <div className="lg:col-span-4 flex flex-col gap-2 overflow-y-auto">
          <AIDecisionPanel 
            aiData={aiData}
            isLoading={aiLoading || isAccumulating}
            error={displayAiError}
            currentPrice={currentPrice}
          />
        </div>
      </div>

      {/* Bottom - Advanced Analytics */}
      <div className="h-[300px]">
        <AdvancedAnalyticsTabs symbol={normalizedSymbol} />
      </div>
    </AppShell>
  );
}
