import { Card } from "@/components/ui/card";
import { DayTraderChart } from "./DayTraderChart";
import type { Candle } from "@/lib/indicators";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
            Using simulated data. Live data temporarily unavailable.
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
        <h4 className="text-sm font-semibold mb-2">How to Use Live Data</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Charts auto-update with real-time data from CoinGlass/Tatum APIs</li>
          <li>• Automatic retry with exponential backoff on network errors</li>
          <li>• Falls back to simulated data if all retries fail</li>
          <li>• Scroll and zoom to analyze different timeframes</li>
          <li>• PDH/PDL (cyan/magenta dotted lines) mark previous day high/low</li>
          <li>• MACD histogram green = bullish momentum, red = bearish</li>
          <li>• RSI &gt;70 = overbought, &lt;30 = oversold</li>
        </ul>
      </div>
    </Card>
  );
}
