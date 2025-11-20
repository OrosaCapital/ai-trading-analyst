import { Card } from "@/components/ui/card";
import { DayTraderChart } from "./DayTraderChart";
import { MarketInsightsPanel } from "./MarketInsightsPanel";
import type { Candle } from "@/lib/indicators";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRealtimePriceStream } from "@/hooks/useRealtimePriceStream";

interface DayTraderChartContainerProps {
  symbol: string;
  candles: Candle[];
  isLoading?: boolean;
  isUsingFallback?: boolean;
  error?: string | null;
}

export function DayTraderChartContainer({ 
  symbol, 
  candles, 
  isLoading = false,
  isUsingFallback = false,
  error = null
}: DayTraderChartContainerProps) {
  // Real-time price stream from WebSocket
  const { priceData } = useRealtimePriceStream(symbol, true);
  
  // Use real-time price, fallback to most recent candle (candles are DESC, so [0] = newest)
  const currentPrice = priceData?.price ?? (candles[0]?.close || 0);
  
  if (isLoading) {
    return (
      <Card className="p-6 glass-panel">
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-[150px] flex-1" />
            <Skeleton className="h-[150px] flex-1" />
          </div>
        </div>
      </Card>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <Card className="p-6 glass-panel">
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          {error ? `Error: ${error}` : 'No candle data available. Select a symbol to begin.'}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass-panel">
      {isUsingFallback && (
        <Alert variant="default" className="mb-4 border-cyber-yellow/30 bg-cyber-yellow/10">
          <AlertCircle className="h-4 w-4 text-cyber-yellow" />
          <AlertDescription className="text-cyber-yellow">
            Limited data available for current timeframe. Some indicators may show partial information.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{symbol} Professional Chart</h3>
          <p className="text-xs text-muted-foreground">
            EMAs (9, 21, 50) • VWAP • PDH/PDL • MACD (3,10,16) • RSI (14)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-green" />
            <span>Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-red" />
            <span>Bearish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-chart-yellow" />
            <span>EMA 9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-chart-orange" />
            <span>EMA 21</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-chart-blue" />
            <span>EMA 50</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-cyber-purple" />
            <span>VWAP</span>
          </div>
        </div>
      </div>

      <div className="h-[600px]">
        <DayTraderChart 
          symbol={symbol} 
          candles={candles}
          containerId={`chart-${symbol}`}
        />
      </div>

      <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/40">
        <h4 className="text-sm font-semibold mb-3">Market Intelligence</h4>
        <MarketInsightsPanel 
          symbol={symbol} 
          currentPrice={currentPrice}
          candles={candles}
          isUsingFallback={isUsingFallback}
        />
      </div>
    </Card>
  );
}
