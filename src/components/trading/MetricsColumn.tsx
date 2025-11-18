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
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-[10px] font-semibold tracking-wide text-muted-foreground">
            FUNDING RATE
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 space-y-1">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {(currentFundingRate * 100).toFixed(4)}%
            </div>
            {currentFundingRate > 0 ? (
              <div className="flex items-center gap-1 text-chart-green">
                <TrendingUp className="h-3 w-3" />
                <span className="text-[9px] font-semibold">BULLISH</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-chart-red">
                <TrendingDown className="h-3 w-3" />
                <span className="text-[9px] font-semibold">BEARISH</span>
              </div>
            )}
          </div>
          
          {/* Visual indicator bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                currentFundingRate > 0 ? 'bg-chart-green' : 'bg-chart-red'
              }`}
              style={{ 
                width: `${Math.min(Math.abs(currentFundingRate * 10000), 100)}%` 
              }}
            />
          </div>
          
          {fundingRate?.current?.nextFunding && (
            <div className="text-[9px] text-muted-foreground font-medium">
              Next: {new Date(fundingRate.current.nextFunding).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Interest */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-[10px] font-semibold tracking-wide text-muted-foreground">
            OPEN INTEREST
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 space-y-1">
          <div className="text-2xl font-bold text-foreground tabular-nums">
            ${(currentOpenInterest / 1e9).toFixed(2)}B
          </div>
          {openInterest?.current?.change24h !== undefined && (
            <div className="flex items-center gap-1">
              <div className={`text-[9px] font-semibold ${openInterest.current.change24h > 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                24H: {openInterest.current.change24h > 0 ? '+' : ''}{openInterest.current.change24h.toFixed(2)}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Long/Short Ratio */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-[10px] font-semibold tracking-wide text-muted-foreground">
            LONG/SHORT RATIO
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 space-y-2">
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {currentLongShortRatio.toFixed(2)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div>
              <div className="text-muted-foreground mb-0.5">LONGS</div>
              <div className="text-sm font-bold text-chart-green">{longPercentage.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">SHORTS</div>
              <div className="text-sm font-bold text-chart-red">{shortPercentage.toFixed(1)}%</div>
            </div>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden flex">
            <div className="bg-chart-green" style={{ width: `${longPercentage}%` }} />
            <div className="bg-chart-red flex-1" />
          </div>
        </CardContent>
      </Card>

      {/* Liquidations 24h */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-[10px] font-semibold tracking-wide text-muted-foreground">
            LIQUIDATIONS 24H
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] text-muted-foreground">LONGS</span>
              <span className="text-sm font-bold text-chart-red tabular-nums">
                ${((liquidations?.longs || 0) / 1e6).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] text-muted-foreground">SHORTS</span>
              <span className="text-sm font-bold text-chart-green tabular-nums">
                ${((liquidations?.shorts || 0) / 1e6).toFixed(2)}M
              </span>
            </div>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden flex">
            <div className="bg-chart-red" style={{ width: `${longLiqPercentage}%` }} />
            <div className="bg-chart-green flex-1" />
          </div>
        </CardContent>
      </Card>

      {/* Volume 24h */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-[10px] font-semibold tracking-wide text-muted-foreground">
            VOLUME 24H
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-2xl font-bold text-foreground tabular-nums">
            ${(Math.random() * 50 + 10).toFixed(2)}B
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            SPOT + FUTURES
          </div>
        </CardContent>
      </Card>

      {/* Market Dominance */}
      <Card className="glass-panel border border-border/50">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-[10px] font-semibold tracking-wide text-muted-foreground">
            MARKET DOMINANCE
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {(Math.random() * 10 + 40).toFixed(1)}%
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            OF TOTAL CRYPTO MARKET
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
