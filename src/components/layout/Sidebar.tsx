import { useState, useEffect } from "react";
import { SentimentGauge } from "../SentimentGauge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface SidebarProps {
  symbol: string;
}

export function Sidebar({ symbol }: SidebarProps) {
  const [fundingRate, setFundingRate] = useState<number | null>(null);
  const [openInterest, setOpenInterest] = useState<number | null>(null);
  const [longShortRatio, setLongShortRatio] = useState<{ long: number; short: number } | null>(null);
  const [liquidations, setLiquidations] = useState<{ longs: number; shorts: number } | null>(null);
  const [volume24h, setVolume24h] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    const fetchMetrics = async () => {
      setIsLoading(true);
      
      try {
        const [fundingRes, oiRes, lsRes, liqRes, volRes] = await Promise.all([
          supabase.functions.invoke('fetch-funding-rate', { body: { symbol } }),
          supabase.functions.invoke('fetch-open-interest', { body: { symbol } }),
          supabase.functions.invoke('fetch-long-short-ratio', { body: { symbol } }),
          supabase.functions.invoke('fetch-liquidations', { body: { symbol } }),
          supabase.functions.invoke('fetch-taker-volume', { body: { symbol } })
        ]);

        if (fundingRes.data?.current) {
          setFundingRate(fundingRes.data.current.rateValue || 0);
        }
        if (oiRes.data?.total) {
          setOpenInterest(oiRes.data.total.valueRaw || 0);
        }
        if (lsRes.data && typeof lsRes.data.long_percent === 'string' && lsRes.data.long_percent !== 'N/A') {
          const longPercent = parseFloat(lsRes.data.long_percent);
          const shortPercent = parseFloat(lsRes.data.short_percent);
          if (!isNaN(longPercent) && !isNaN(shortPercent)) {
            setLongShortRatio({ long: longPercent, short: shortPercent });
          }
        }
        if (liqRes.data?.last24h && liqRes.data.last24h.totalLongs !== 'N/A') {
          const longs = parseFloat(liqRes.data.last24h.totalLongs) || 0;
          const shorts = parseFloat(liqRes.data.last24h.totalShorts) || 0;
          setLiquidations({ longs, shorts });
        }
        if (volRes.data?.exchanges && Array.isArray(volRes.data.exchanges)) {
          // Calculate total volume from exchanges
          const totalVolume = volRes.data.exchanges.reduce((sum: number, ex: any) => {
            const buyVol = parseFloat(ex.buy_volume || 0);
            const sellVol = parseFloat(ex.sell_volume || 0);
            return sum + buyVol + sellVol;
          }, 0);
          setVolume24h(totalVolume);
        }
      } catch (error) {
        console.error('Error fetching sidebar metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

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
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold text-foreground">Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <SentimentGauge />
          </CardContent>
        </Card>

        {/* Funding Rate */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Funding Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold tabular-nums text-foreground">
                    {fundingRate !== null ? `${(fundingRate * 100).toFixed(4)}%` : 'N/A'}
                  </span>
                  {fundingRate !== null && (
                    fundingRate > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )
                  )}
                </div>
                {fundingRate !== null && (
                  <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${fundingRate > 0 ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                      style={{ width: `${Math.min(Math.abs(fundingRate * 100) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Open Interest */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              Open Interest
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {openInterest !== null ? formatLargeNumber(openInterest) : 'N/A'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Long/Short Ratio */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Long/Short Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : longShortRatio ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold tabular-nums text-green-500">
                    {typeof longShortRatio.long === 'number' ? `${longShortRatio.long.toFixed(0)}%` : 'N/A'}
                  </span>
                  {typeof longShortRatio.long === 'number' && typeof longShortRatio.short === 'number' && (
                    <span className="text-lg font-semibold text-red-500">/ {longShortRatio.short.toFixed(0)}%</span>
                  )}
                </div>
                {typeof longShortRatio.long === 'number' && typeof longShortRatio.short === 'number' && (
                  <div className="mt-2 flex gap-1 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-400 rounded-l-full transition-all duration-300" style={{ width: `${longShortRatio.long}%` }} />
                    <div className="bg-gradient-to-r from-red-500 to-red-400 rounded-r-full transition-all duration-300" style={{ width: `${longShortRatio.short}%` }} />
                  </div>
                )}
              </>
            ) : (
              <span className="text-3xl font-bold text-foreground">N/A</span>
            )}
          </CardContent>
        </Card>

        {/* Liquidations 24h */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Liquidations 24h
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : liquidations ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold tabular-nums text-foreground">
                    {formatLargeNumber((liquidations.longs || 0) + (liquidations.shorts || 0))}
                  </span>
                </div>
                {liquidations.longs && liquidations.shorts && (
                  <div className="mt-2 flex gap-1 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-400 rounded-l-full transition-all duration-300" 
                      style={{ width: `${(liquidations.longs / (liquidations.longs + liquidations.shorts)) * 100}%` }} 
                    />
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 rounded-r-full transition-all duration-300" 
                      style={{ width: `${(liquidations.shorts / (liquidations.longs + liquidations.shorts)) * 100}%` }} 
                    />
                  </div>
                )}
              </>
            ) : (
              <span className="text-3xl font-bold text-foreground">N/A</span>
            )}
          </CardContent>
        </Card>

        {/* Volume 24h */}
        <Card className="glass-panel border border-border/50 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Volume 24h
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {volume24h !== null ? formatLargeNumber(volume24h) : 'N/A'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
