import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetricsColumnProps {
  symbol: string;
}

export function MetricsColumn({ symbol }: MetricsColumnProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("fetch-market-overview", {
          body: { symbol },
        });

        if (!error && data) {
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const fundingRate = metrics?.fundingRate?.rate || 0;
  const openInterest = metrics?.openInterest?.value || 0;
  const longShortRatio = metrics?.longShortRatio?.ratio || 0;
  const liquidations = metrics?.liquidations || { longs: 0, shorts: 0 };

  return (
    <div className="space-y-4">
      {/* Funding Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Funding Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {(fundingRate * 100).toFixed(4)}%
            </div>
            {fundingRate > 0 ? (
              <Badge className="bg-green-500/20 text-green-500 border-green-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                Bullish
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-500 border-red-500">
                <TrendingDown className="h-3 w-3 mr-1" />
                Bearish
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Open Interest */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Open Interest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(openInterest / 1e9).toFixed(2)}B
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            24h Change: +2.3%
          </div>
        </CardContent>
      </Card>

      {/* Long/Short Ratio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Long/Short Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {longShortRatio.toFixed(2)}
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Longs</div>
              <div className="text-sm font-medium text-green-500">
                {((longShortRatio / (1 + longShortRatio)) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Shorts</div>
              <div className="text-sm font-medium text-red-500">
                {((1 / (1 + longShortRatio)) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liquidations 24h */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Liquidations 24h</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Longs</span>
              <span className="text-sm font-medium text-red-500">
                ${(liquidations.longs / 1e6).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Shorts</span>
              <span className="text-sm font-medium text-green-500">
                ${(liquidations.shorts / 1e6).toFixed(2)}M
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-red-500"
                style={{
                  width: `${(liquidations.longs / (liquidations.longs + liquidations.shorts)) * 100}%`,
                }}
              />
              <div className="bg-green-500 flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Health Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Market Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-500">78</div>
            <Badge variant="outline" className="text-green-500 border-green-500">
              Healthy
            </Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
            <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: "78%" }} />
          </div>
        </CardContent>
      </Card>

      {/* Volume 24h */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Volume 24h</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(Math.random() * 50 + 20).toFixed(1)}B
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Above average
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
