import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketMetricsProps {
  symbol: string;
}

interface MarketData {
  fundingRate: {
    current: string;
    trend: string;
    sentiment: string;
  };
  openInterest: {
    total: string;
    change24h: string;
    trend: string;
  };
  liquidations: {
    total: string;
    ratio: string;
  };
  marketHealth: {
    score: number;
    status: string;
    signals: string[];
  };
  isMockData?: boolean;
}

export const MarketMetrics = ({ symbol }: MarketMetricsProps) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const { data: overviewData, error } = await supabase.functions.invoke('fetch-market-overview', {
        body: { symbol }
      });

      if (error) throw error;

      // Transform the data structure to match component expectations
      const transformedData = {
        fundingRate: {
          ...overviewData.metrics.fundingRate,
          sentiment: overviewData.metrics.fundingRate.trend === 'RISING' ? 'BULLISH' : 'BEARISH'
        },
        openInterest: overviewData.metrics.openInterest,
        liquidations: {
          total: overviewData.metrics.liquidations24h.total,
          ratio: overviewData.metrics.liquidations24h.longShortRatio
        },
        marketHealth: overviewData.marketHealth,
        isMockData: overviewData.isMockData
      };

      setData(transformedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Removed auto-refresh polling - data refreshed via WebSocket only
  }, [symbol]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'RISING' || trend === 'INCREASING' ? (
      <TrendingUp className="h-4 w-4 text-success" />
    ) : (
      <TrendingDown className="h-4 w-4 text-destructive" />
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Live Market Metrics</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            Updated {Math.round((new Date().getTime() - lastUpdate.getTime()) / 60000)} min ago
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Funding Rate */}
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Funding Rate</span>
              {getTrendIcon(data.fundingRate.trend)}
            </div>
            <div className="text-2xl font-bold">{data.fundingRate.current}</div>
            <Badge 
              variant={data.fundingRate.sentiment === 'BULLISH' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {data.fundingRate.sentiment}
            </Badge>
          </Card>

          {/* Open Interest */}
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Open Interest</span>
              {getTrendIcon(data.openInterest.trend)}
            </div>
            <div className="text-2xl font-bold">{data.openInterest.total}</div>
            <div className="text-sm mt-2">
              <span className={data.openInterest.change24h.startsWith('+') ? 'text-success' : 'text-destructive'}>
                {data.openInterest.change24h}
              </span>
              <span className="text-muted-foreground ml-1">24h</span>
            </div>
          </Card>

          {/* Liquidations */}
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Liquidations 24h</span>
              <Activity className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{data.liquidations.total}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {data.liquidations.ratio}
            </div>
          </Card>
        </div>

        {/* Market Health */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Market Health Score</span>
            <Badge variant={data.marketHealth.status === 'HEALTHY' ? 'default' : 'secondary'}>
              {data.marketHealth.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-3xl font-bold ${getHealthColor(data.marketHealth.score)}`}>
              {data.marketHealth.score}/100
            </div>
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  data.marketHealth.score >= 70 ? 'bg-success' :
                  data.marketHealth.score >= 50 ? 'bg-warning' :
                  'bg-destructive'
                }`}
                style={{ width: `${data.marketHealth.score}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {data.marketHealth.signals.map((signal, idx) => (
              <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </Card>
      </Card>
    </div>
  );
};
