import { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";
import { useFundingHistory } from "@/hooks/useFundingHistory";
import { createChart, IChartApi, ISeriesApi, LineData, HistogramSeries } from "lightweight-charts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface FundingRateChartProps {
  symbol: string;
}

export const FundingRateChart = ({ symbol }: FundingRateChartProps) => {
  const { candles, stats, isLoading, error } = useFundingHistory(symbol);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !candles.length) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 200,
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
    });

    const lineSeries = chart.addSeries(HistogramSeries, {
      color: "#8b5cf6",
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `${(price * 100).toFixed(4)}%`,
      },
    });

    const chartData: LineData[] = candles.map((candle) => ({
      time: (candle.time / 1000) as any,
      value: candle.close,
    }));

    lineSeries.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles]);

  if (isLoading) {
    return (
      <Card className="p-4 glass">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-muted-foreground">Loading funding rates...</span>
          </div>
          <Skeleton className="h-[200px] w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 glass border-destructive/30">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!candles.length || !stats) {
    return (
      <Card className="p-4 glass">
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          No funding rate data available
        </div>
      </Card>
    );
  }

  const latestRate = candles[candles.length - 1]?.close || 0;
  const isPositive = latestRate >= 0;

  return (
    <Card className="p-4 glass border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-chart-green" />
            ) : (
              <TrendingDown className="h-4 w-4 text-chart-red" />
            )}
            <span className="text-sm font-semibold text-foreground">Funding Rate History</span>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${isPositive ? "text-chart-green border-chart-green/30" : "text-chart-red border-chart-red/30"}`}
          >
            {latestRate >= 0 ? "+" : ""}{(latestRate * 100).toFixed(4)}%
          </Badge>
        </div>

        <div ref={chartContainerRef} className="w-full" />

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Average</span>
            <span className="font-semibold text-foreground">
              {(stats.average * 100).toFixed(4)}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Min</span>
            <span className="font-semibold text-chart-red">
              {(stats.min * 100).toFixed(4)}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Max</span>
            <span className="font-semibold text-chart-green">
              {(stats.max * 100).toFixed(4)}%
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {stats.count} data points • 4h interval • Binance
        </p>
      </div>
    </Card>
  );
};
