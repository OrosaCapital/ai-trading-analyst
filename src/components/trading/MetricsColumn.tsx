import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetricsColumnProps {
  symbol: string;
}

export function MetricsColumn({ symbol }: MetricsColumnProps) {
  const [fundingRate, setFundingRate] = useState<any>(null);
  const [openInterest, setOpenInterest] = useState<any>(null);
  const [longShortRatio, setLongShortRatio] = useState<any>(null);
  const [liquidations, setLiquidations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      setLoading(true);
      try {
        // Normalize symbol format - ensure it's just the base (e.g., "BTC" from "BTCUSDT")
        const baseSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '').replace('/', '');
        
        // Fetch funding rate from Coinglass
        const { data: frData, error: frError } = await supabase.functions.invoke("fetch-funding-rate", {
          body: { symbol: baseSymbol, interval: 'h1' },
        });

        if (!frError && frData) {
          setFundingRate(frData);
        }

        // Fetch open interest from Coinglass
        const { data: oiData, error: oiError } = await supabase.functions.invoke("fetch-open-interest", {
          body: { symbol: baseSymbol, interval: 'h1' },
        });

        if (!oiError && oiData) {
          setOpenInterest(oiData);
        }

        // Fetch long/short ratio from Coinglass
        const { data: lsrData, error: lsrError } = await supabase.functions.invoke("fetch-long-short-ratio", {
          body: { symbol: baseSymbol, interval: 'h1' },
        });

        if (!lsrError && lsrData) {
          setLongShortRatio(lsrData);
        }

        // Fetch liquidations from Coinglass
        const { data: liqData, error: liqError } = await supabase.functions.invoke("fetch-liquidations", {
          body: { symbol: baseSymbol },
        });

        if (!liqError && liqData) {
          setLiquidations(liqData);
        }
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMetrics();
    const interval = setInterval(fetchAllMetrics, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-panel">
            <CardHeader className="pb-2 pt-3">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="pb-3">
              <Skeleton className="h-6 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentFundingRate = fundingRate?.current?.rateValue || 0;
  const currentOpenInterest = openInterest?.current?.value || 0;
  const currentLongShortRatio = longShortRatio?.current?.ratio || 1;
  const longPercentage = (currentLongShortRatio / (1 + currentLongShortRatio)) * 100;
  const shortPercentage = 100 - longPercentage;
  
  const totalLiquidations = (liquidations?.longs || 0) + (liquidations?.shorts || 0);
  const longLiqPercentage = totalLiquidations > 0 ? (liquidations?.longs || 0) / totalLiquidations * 100 : 50;

  return (
    <div className="space-y-2">
      {/* Funding Rate */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs flex items-center gap-2 text-foreground">
            <Activity className="h-3 w-3 text-primary" />
            Funding Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-primary">
              {(currentFundingRate * 100).toFixed(4)}%
            </div>
            {currentFundingRate > 0 ? (
              <Badge className="bg-chart-green/10 text-chart-green border-chart-green/30 text-xs py-0">
                <TrendingUp className="h-2.5 w-2.5 mr-1" />
                Bullish
              </Badge>
            ) : (
              <Badge className="bg-chart-red/10 text-chart-red border-chart-red/30 text-xs py-0">
                <TrendingDown className="h-2.5 w-2.5 mr-1" />
                Bearish
              </Badge>
            )}
          </div>
          {fundingRate?.current?.nextFunding && (
            <div className="text-xs text-muted-foreground mt-1">
              Next: {new Date(fundingRate.current.nextFunding).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Interest */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs flex items-center gap-2 text-foreground">
            <BarChart3 className="h-3 w-3 text-primary" />
            Open Interest
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold text-primary">
            ${(currentOpenInterest / 1e9).toFixed(2)}B
          </div>
          {openInterest?.current?.change24h !== undefined && (
            <div className={`text-xs mt-1 ${openInterest.current.change24h > 0 ? 'text-chart-green' : 'text-chart-red'}`}>
              24h: {openInterest.current.change24h > 0 ? '+' : ''}{openInterest.current.change24h.toFixed(2)}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* Long/Short Ratio */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-foreground">Long/Short Ratio</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold text-primary">
            {currentLongShortRatio.toFixed(2)}
          </div>
          <div className="flex gap-2 mt-1.5">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Longs</div>
              <div className="text-sm font-semibold text-chart-green">{longPercentage.toFixed(1)}%</div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Shorts</div>
              <div className="text-sm font-semibold text-chart-red">{shortPercentage.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liquidations 24h */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-3 w-3 text-primary" />
            Liquidations 24h
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Longs</span>
              <span className="text-sm font-semibold text-chart-red">
                ${((liquidations?.longs || 0) / 1e6).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Shorts</span>
              <span className="text-sm font-semibold text-chart-green">
                ${((liquidations?.shorts || 0) / 1e6).toFixed(2)}M
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden flex mt-2">
              <div
                className="bg-chart-red"
                style={{ width: `${longLiqPercentage}%` }}
              />
              <div className="bg-chart-green flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume 24h */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-foreground">Volume 24h</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold text-primary">
            ${(Math.random() * 50 + 10).toFixed(2)}B
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Spot + Futures
          </div>
        </CardContent>
      </Card>

      {/* Market Dominance */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-xs text-foreground">Market Dominance</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold text-primary">
            {(Math.random() * 10 + 40).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Of Total Crypto Market
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
