import { useEffect, useMemo } from "react";
import { SentimentGauge } from "../SentimentGauge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Zap } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useMarketStore } from "@/store/useMarketStore";
import { useFundingRate } from "@/hooks/useFundingRate";

interface SidebarProps {
  symbol: string;
}

export function Sidebar({ symbol }: SidebarProps) {
  const { metrics, loading, fetchMetrics, initialize, cleanup } = useMarketStore();
  const { data: fundingData, isLoading: fundingLoading } = useFundingRate(symbol);
  
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  useEffect(() => {
    if (symbol) {
      fetchMetrics(symbol);
    }
  }, [symbol, fetchMetrics]);

  const currentMetrics = metrics[symbol];
  const isLoading = loading.metrics || !currentMetrics;

  const formatLargeNumber = (num: number | null | undefined) => {
    if (!num || num === 0) return '$0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const fundingRateColor = useMemo(() => {
    if (!fundingData) return 'text-muted-foreground';
    if (fundingData.rate > 0.01) return 'text-chart-green';
    if (fundingData.rate < -0.01) return 'text-chart-red';
    return 'text-muted-foreground';
  }, [fundingData]);

  const longShortColor = useMemo(() => {
    if (!currentMetrics) return 'text-muted-foreground';
    if (currentMetrics.longShortRatio > 1.2) return 'text-chart-green';
    if (currentMetrics.longShortRatio < 0.8) return 'text-chart-red';
    return 'text-muted-foreground';
  }, [currentMetrics]);

  return (
    <aside className="flex w-64 flex-col border-r border-border/50 bg-gradient-to-b from-background via-background/98 to-background/95 overflow-y-auto backdrop-blur-sm">
      <div className="px-6 py-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          OCAPX AI
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium">Market Intelligence</p>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-3">
        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentGauge />
          </CardContent>
        </Card>

        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3 h-3 transition-transform group-hover:scale-110" />
              Funding Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fundingLoading ? (
              <Skeleton className="h-8 w-24 rounded-md" />
            ) : fundingData ? (
              <div className="flex items-center justify-between">
                <p className={`text-xl font-bold transition-colors ${fundingRateColor}`}>
                  {fundingData.rate.toFixed(4)}%
                </p>
                {fundingData.rate > 0 ? (
                  <TrendingUp className="w-5 h-5 text-chart-green animate-pulse" />
                ) : fundingData.rate < 0 ? (
                  <TrendingDown className="w-5 h-5 text-chart-red animate-pulse" />
                ) : (
                  <Activity className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-3 h-3 transition-transform group-hover:scale-110" />
              Open Interest
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-md" />
            ) : (
              <p className="text-xl font-bold text-foreground">
                {formatLargeNumber(currentMetrics.openInterest)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Long/Short Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 rounded-md" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-chart-green">Long</span>
                  <span className="text-chart-red">Short</span>
                </div>
                <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-chart-green to-chart-green/80 transition-all duration-500 ease-out" 
                    style={{ width: `${(currentMetrics.longShortRatio / (currentMetrics.longShortRatio + 1)) * 100}%` }}
                  />
                  <div 
                    className="bg-gradient-to-l from-chart-red to-chart-red/80 transition-all duration-500 ease-out" 
                    style={{ width: `${(1 / (currentMetrics.longShortRatio + 1)) * 100}%` }}
                  />
                </div>
                <p className={`text-base font-bold text-center transition-colors ${longShortColor}`}>
                  {currentMetrics.longShortRatio.toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3 transition-transform group-hover:scale-110" />
              Liquidations 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-md" />
            ) : (
              <div>
                {currentMetrics.liquidations24h > 0 ? (
                  <p className="text-xl font-bold text-destructive">
                    {formatLargeNumber(currentMetrics.liquidations24h)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground font-medium">No Data</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3 h-3 transition-transform group-hover:scale-110" />
              Volume 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-md" />
            ) : (
              <p className="text-xl font-bold text-foreground">
                {formatLargeNumber(currentMetrics.volume24h)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
