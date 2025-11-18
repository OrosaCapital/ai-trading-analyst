import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
interface CoingласsPanelProps {
  symbol: string;
}
export const CoinglassPanel = ({
  symbol
}: CoingласsPanelProps) => {
  const [longShortRatio, setLongShortRatio] = useState<any>(null);
  const [fearGreedIndex, setFearGreedIndex] = useState<any>(null);
  const [liquidations, setLiquidations] = useState<any>(null);
  const [openInterest, setOpenInterest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCoinglassData = async () => {
      try {
        setLoading(true);

        // Fetch all Coinglass metrics in parallel
        const [lsRatio, fearGreed, liq, oi] = await Promise.all([supabase.functions.invoke('fetch-long-short-ratio', {
          body: {
            symbol
          }
        }), supabase.functions.invoke('fetch-fear-greed-index'), supabase.functions.invoke('fetch-liquidations', {
          body: {
            symbol
          }
        }), supabase.functions.invoke('fetch-open-interest', {
          body: {
            symbol
          }
        })]);
        console.log('Long/Short data:', lsRatio.data);
        console.log('Fear & Greed data:', fearGreed.data);
        console.log('Liquidations data:', liq.data);
        console.log('Open Interest data:', oi.data);
        if (lsRatio.data) setLongShortRatio(lsRatio.data);
        if (fearGreed.data) setFearGreedIndex(fearGreed.data);
        if (liq.data) setLiquidations(liq.data);
        if (oi.data) setOpenInterest(oi.data);
      } catch (err) {
        console.error('Error fetching Coinglass data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoinglassData();
    const interval = setInterval(fetchCoinglassData, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, [symbol]);
  const LoadingSkeleton = () => <div className="h-24 bg-muted/20 rounded animate-pulse" />;
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };
  return <div className="space-y-6">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coinglass Intelligence Panel</h2>
          <p className="text-sm text-muted-foreground">
            Real-time derivatives market data 
            {(longShortRatio?.unavailable || liquidations?.unavailable || openInterest?.unavailable) && <span className="text-accent ml-2">• Limited data for this symbol</span>}
          </p>
        </div>
        <Activity className="w-6 h-6 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Long vs Short Ratio */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Long vs Short Ratio
            </p>
            {loading ? <LoadingSkeleton /> : longShortRatio ? longShortRatio.unavailable ? <div className="text-sm text-muted-foreground">
                  Not available for this symbol
                </div> : <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-chart-green text-sm font-medium">Long</span>
                    <span className="text-xl font-bold text-chart-green">
                      {parseFloat(longShortRatio.long_percent || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-green" style={{
                width: `${longShortRatio.long_percent || 0}%`
              }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-chart-red text-sm font-medium">Short</span>
                    <span className="text-xl font-bold text-chart-red">
                      {parseFloat(longShortRatio.short_percent || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-chart-red" style={{
                width: `${longShortRatio.short_percent || 0}%`
              }} />
                  </div>
                </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Fear & Greed Index */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              FEAR & GREED INDEX               
            </p>
            {loading ? <LoadingSkeleton /> : fearGreedIndex ? <div className="space-y-2">
                <div className="text-5xl font-bold text-foreground">
                  {fearGreedIndex.value}
                </div>
                <div className={`text-lg font-semibold ${
                  fearGreedIndex.valueClassification === 'Extreme Fear' ? 'text-chart-red' :
                  fearGreedIndex.valueClassification === 'Fear' ? 'text-orange-500' :
                  fearGreedIndex.valueClassification === 'Greed' ? 'text-chart-green' :
                  fearGreedIndex.valueClassification === 'Extreme Greed' ? 'text-emerald-400' :
                  'text-muted-foreground'
                }`}>
                  {fearGreedIndex.valueClassification}
                </div>
                {fearGreedIndex.change24h !== 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{fearGreedIndex.change24h > 0 ? '+' : ''}{fearGreedIndex.change24h?.toFixed(0)} from yesterday</span>
                  </div>
                )}
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Liquidation Levels */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Liquidation Levels (24H)
            </p>
            {loading ? <LoadingSkeleton /> : liquidations?.last24h ? <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Longs</span>
                  <span className="text-lg font-bold text-chart-red">
                    ${liquidations.last24h.totalLongs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Shorts</span>
                  <span className="text-lg font-bold text-chart-green">
                    ${liquidations.last24h.totalShorts}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Total: ${liquidations.last24h.total}
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Open Interest Heatmap */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Open Interest
            </p>
            {loading ? <LoadingSkeleton /> : openInterest?.total ? <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  ${openInterest.total.value}
                </div>
                <div className={`flex items-center gap-2 text-sm ${openInterest.total.sentiment === 'INCREASING' ? 'text-chart-green' : 'text-chart-red'}`}>
                  {openInterest.total.sentiment === 'INCREASING' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-medium">
                    {openInterest.total.change24h}
                  </span>
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Short Squeeze Probability */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Short Squeeze Probability
            </p>
            {loading ? <LoadingSkeleton /> : longShortRatio && fearGreedIndex ? <div className="space-y-2">
                {(() => {
              const shortPercent = parseFloat(longShortRatio.short_percent || 0);
              const fearValue = fearGreedIndex.value;
              const shortPressure = shortPercent > 55;
              const extremeFear = fearValue < 25;
              const probability = shortPressure && extremeFear ? 'HIGH' : shortPressure || extremeFear ? 'MEDIUM' : 'LOW';
              const color = probability === 'HIGH' ? 'text-chart-green' : probability === 'MEDIUM' ? 'text-accent' : 'text-muted-foreground';
              return <>
                      <div className={`text-3xl font-bold ${color}`}>
                        {probability}
                      </div>
                      {probability !== 'LOW' && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Watch for upside breakout</span>
                        </div>}
                    </>;
            })()}
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Long Squeeze Probability */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Long Squeeze Probability
            </p>
            {loading ? <LoadingSkeleton /> : longShortRatio && fearGreedIndex ? <div className="space-y-2">
                {(() => {
              const longPercent = parseFloat(longShortRatio.long_percent || 0);
              const fearValue = fearGreedIndex.value;
              const longPressure = longPercent > 55;
              const extremeGreed = fearValue > 75;
              const probability = longPressure && extremeGreed ? 'HIGH' : longPressure || extremeGreed ? 'MEDIUM' : 'LOW';
              const color = probability === 'HIGH' ? 'text-chart-red' : probability === 'MEDIUM' ? 'text-accent' : 'text-muted-foreground';
              return <>
                      <div className={`text-3xl font-bold ${color}`}>
                        {probability}
                      </div>
                      {probability !== 'LOW' && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Watch for downside risk</span>
                        </div>}
                    </>;
            })()}
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>
      </div>
    </div>;
};