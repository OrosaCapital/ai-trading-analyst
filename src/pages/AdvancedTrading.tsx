import { useState, useMemo } from "react";
import { KPICard } from "@/components/trading/KPICard";
import { OrderBook } from "@/components/trading/OrderBook";
import { TradeExecutionPanel } from "@/components/trading/TradeExecutionPanel";
import { MarketDataSidebar } from "@/components/trading/MarketDataSidebar";
import { AdvancedChartContainer } from "@/components/charts/AdvancedChartContainer";
import { useKrakenOHLC } from "@/hooks/useKrakenOHLC";
import { useRealtimePriceStream } from "@/hooks/useRealtimePriceStream";
import { use24hStats } from "@/hooks/use24hStats";
import { formatPrice, formatVolume } from "@/lib/priceFormatter";

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
  const currentPrice = priceData?.price ?? null;

  console.log("Adv Trading WS Status:", { isConnected, connectionStatus });

  const dayChange = useMemo(() => {
    if (candles.length < 2) return 0;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;
    return ((last.close - prev.close) / prev.close) * 100;
  }, [candles]);

  return (
    <div className="flex flex-col p-4 gap-4 h-[calc(100vh-60px)]">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Current Price"
          value={currentPrice ? formatPrice(currentPrice) : (isConnected ? "Connecting..." : "WebSocket Offline")}
          change={dayChange}
          trend={dayChange > 0 ? "up" : "down"}
          subtitle={symbol}
        />
        <KPICard
          label="24h Volume"
          value={volume24h ? formatVolume(volume24h) : "Loading..."}
          subtitle="Trading activity"
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

      {/* Middle Section: Chart */}
      <div className="flex-grow min-h-0">
        <AdvancedChartContainer 
          symbol={symbol}
          candles={candles}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Section: Panels */}
      <div className="h-1/4 grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <OrderBook />
        </div>
        <div className="col-span-1">
          <TradeExecutionPanel />
        </div>
        <div className="col-span-1">
          <MarketDataSidebar />
        </div>
      </div>
    </div>
  );
}
