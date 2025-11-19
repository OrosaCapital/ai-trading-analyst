import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createChart, IChartApi, LineData, ISeriesApi, AreaSeries } from "lightweight-charts";

interface FundingCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface FundingHistoryResponse {
  success: boolean;
  symbol: string;
  exchange: string;
  interval: string;
  candles: FundingCandle[];
  stats: {
    count: number;
    average: number;
    min: number;
    max: number;
  };
  error?: string;
}

interface FundingRateChartProps {
  symbol: string;
}

export const FundingRateChart = ({ symbol }: FundingRateChartProps) => {
  const [data, setData] = useState<FundingHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const fetchFundingHistory = async () => {
      // Validate symbol before making API call
      if (!symbol || symbol.trim() === "") {
        setIsLoading(false);
        return;
      }

      // Extract base symbol and validate minimum length
      const baseSymbol = symbol
        .toUpperCase()
        .trim()
        .replace(/USDT$/i, '')
        .replace(/USD$/i, '');
      
      // Must have at least 2 characters for base currency
      if (baseSymbol.length < 2) {
        console.error(`Invalid symbol: ${symbol}. Base currency must be at least 2 characters.`);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("Fetching funding history for:", symbol);
        
        const { data: result, error } = await supabase.functions.invoke<FundingHistoryResponse>(
          "fetch-funding-history",
          {
            body: { 
              symbol: symbol, 
              exchange: "Binance",
              interval: "4h",
              limit: 100 
            },
          }
        );

        if (error) {
          console.error("Supabase function error:", error);
          throw error;
        }
        
        if (result?.success) {
          console.log("Funding history loaded:", result.candles.length, "candles");
          setData(result);
        } else {
          console.error("API returned error:", result?.error);
        }
      } catch (err) {
        console.error("Failed to fetch funding history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFundingHistory();
  }, [symbol]);

  useEffect(() => {
    if (!chartContainerRef.current || !data?.candles.length) return;

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

    const lineSeries = chart.addSeries(AreaSeries, {
      topColor: "rgba(139, 92, 246, 0.4)",
      bottomColor: "rgba(139, 92, 246, 0.0)",
      lineColor: "#8b5cf6",
      lineWidth: 2,
    });

    const chartData: LineData[] = data.candles.map((candle) => ({
      time: (candle.time / 1000) as any, // Convert ms to seconds
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
  }, [data]);

  if (isLoading) {
    return (
      <Card className="p-4 glass">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-muted-foreground">Loading funding rates...</span>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const latestRate = data.candles[data.candles.length - 1]?.close || 0;
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
            {latestRate.toFixed(4)}%
          </Badge>
        </div>

        <div ref={chartContainerRef} className="w-full h-[200px] rounded-lg overflow-hidden" />

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Avg</div>
            <div className="text-xs font-semibold text-foreground">{data.stats.average.toFixed(4)}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Min</div>
            <div className="text-xs font-semibold text-chart-red">{data.stats.min.toFixed(4)}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Max</div>
            <div className="text-xs font-semibold text-chart-green">{data.stats.max.toFixed(4)}%</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
