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
  
  // CRITICAL: Use ONLY WebSocket price for live display - no database fallback!
  const currentPrice = priceData?.price ?? null;
  
  if (isLoading) {
    return (
      <Card className="p-6 glass-panel h-full">
        <div className="space-y-4 h-full">
          <Skeleton className="h-full w-full" />
        </div>
      </Card>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <Card className="p-6 glass-panel h-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {error ? `Error: ${error}` : 'No candle data available. Select a symbol to begin.'}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 glass-panel h-full flex flex-col">
      {isUsingFallback && (
        <Alert variant="default" className="mb-4 border-cyber-yellow/30 bg-cyber-yellow/10">
          <AlertCircle className="h-4 w-4 text-cyber-yellow" />
          <AlertDescription className="text-cyber-yellow">
            Limited data available for current timeframe. Some indicators may show partial information.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold">{symbol} Professional Chart</h3>
          <p className="text-xs text-muted-foreground">
            EMAs (9, 21, 50) • VWAP • PDH/PDL • MACD • RSI
          </p>
        </div>
        {/* Legend can be added back if needed */}
      </div>

      <div className="flex-grow min-h-0">
        <DayTraderChart 
          symbol={symbol} 
          candles={candles}
          containerId={`chart-${symbol}`}
        />
      </div>

      <div className="mt-2 p-2 bg-card/50 rounded-lg border border-border/40">
        <h4 className="text-xs font-semibold mb-2">Market Intelligence</h4>
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
