import { useEffect } from "react";
import { SentimentGauge } from "../SentimentGauge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useMarketStore } from "@/store/useMarketStore";

interface SidebarProps {
  symbol: string;
}

export function Sidebar({ symbol }: SidebarProps) {
  const { metrics, loading, fetchMetrics, initialize, cleanup } = useMarketStore();
  
  // Initialize store and fetch metrics
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  // Fetch metrics when symbol changes
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
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-gradient-to-b from-background to-background/95 overflow-y-auto">
      <div className="px-6 py-6 border-b border-border/50">
        <h2 className="text-lg font-bold tracking-tight text-foreground">OCAPX AI</h2>
        <p className="text-xs text-muted-foreground mt-1">Market Intelligence</p>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Market Sentiment */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
              Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentGauge />
          </CardContent>
        </Card>

        {/* Funding Rate */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Funding Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="flex items-center justify-between">
                <p className={`text-lg font-bold ${
                  currentMetrics.fundingRate > 0 
                    ? 'text-chart-green' 
                    : 'text-chart-red'
                }`}>
                  {(currentMetrics.fundingRate * 100).toFixed(3)}%
                </p>
                {currentMetrics.fundingRate > 0 ? (
                  <TrendingUp className="w-4 h-4 text-chart-green" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-chart-red" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Interest */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Open Interest
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-lg font-bold text-foreground">
                {formatLargeNumber(currentMetrics.openInterest)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Long/Short Ratio */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Long/Short Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-chart-green font-semibold">Long</span>
                  <span className="text-chart-red font-semibold">Short</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  <div 
                    className="bg-chart-green transition-all" 
                    style={{ width: `${(currentMetrics.longShortRatio / (currentMetrics.longShortRatio + 1)) * 100}%` }}
                  />
                  <div 
                    className="bg-chart-red transition-all" 
                    style={{ width: `${(1 / (currentMetrics.longShortRatio + 1)) * 100}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-center text-foreground">
                  {currentMetrics.longShortRatio.toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liquidations 24h */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Liquidations 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                {currentMetrics.liquidations24h > 0 ? (
                  <p className="text-lg font-bold text-destructive">
                    {formatLargeNumber(currentMetrics.liquidations24h)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">N/A</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volume 24h */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <BarChart3 className="w-3 h-3" />
              Volume 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-lg font-bold text-foreground">
                {formatLargeNumber(currentMetrics.volume24h)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
