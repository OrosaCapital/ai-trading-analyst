import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useMarketStore } from '@/store/useMarketStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  TrendingUp, TrendingDown, Activity, AlertTriangle, Target,
  Zap, Flame, BarChart3, DollarSign, TrendingUpDown, Gauge
} from 'lucide-react';

interface CoinglassPanelProps {
  symbol: string;
}

export const CoinglassPanel = ({ symbol }: CoinglassPanelProps) => {
  const { coinglassData, loading, loadCoinglassData } = useMarketStore();

  useEffect(() => {
    loadCoinglassData();
    const interval = setInterval(loadCoinglassData, 120000);
    return () => clearInterval(interval);
  }, [symbol]);

  const formatNumber = (num: number | undefined | null) => {
    if (!num || isNaN(num)) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const { longShortRatio, fearGreedIndex, liquidations, openInterest, fundingRateList, takerVolume, rsi, futuresBasis } = coinglassData || {};

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-accent/5 to-background p-6 border border-border/50">
        <div className="relative z-10">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
            Coinglass Intelligence
          </h2>
        </div>
      </div>

      {loading.coinglass ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Long/Short Ratio */}
          <Card className="p-6">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Long vs Short Ratio
            </p>
            {longShortRatio && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-chart-green text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Long
                  </span>
                  <span className="text-2xl font-black text-chart-green">
                    {longShortRatio.longRatio?.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-green" style={{ width: `${longShortRatio.longRatio}%` }} />
                </div>
              </div>
            )}
          </Card>

          {/* Fear & Greed */}
          <Card className="p-6">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Fear & Greed Index
            </p>
            {fearGreedIndex && (
              <div className="text-center">
                <div className="text-5xl font-black text-accent">{fearGreedIndex.value}</div>
                <div className="text-sm text-muted-foreground mt-2">{fearGreedIndex.valueClassification}</div>
              </div>
            )}
          </Card>

          {/* Liquidations */}
          <Card className="p-6">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              24h Liquidations
            </p>
            {liquidations && (
              <div className="text-center">
                <div className="text-3xl font-black text-destructive">
                  {formatNumber(liquidations.totalLiquidations)}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">RSI (14)</span>
                <span className="font-black">{rsi?.rsi14?.toFixed(0) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Open Interest</span>
                <span className="font-black">{formatNumber(openInterest?.openInterest)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
