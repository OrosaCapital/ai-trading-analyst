import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

interface CoingласsPanelProps {
  symbol: string;
}

export const CoinglassPanel = ({ symbol }: CoingласsPanelProps) => {
  const [longShortRatio, setLongShortRatio] = useState<any>(null);
  const [fundingRate, setFundingRate] = useState<any>(null);
  const [liquidations, setLiquidations] = useState<any>(null);
  const [openInterest, setOpenInterest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoinglassData = async () => {
      try {
        setLoading(true);
        
        // Fetch all Coinglass metrics in parallel
        const [lsRatio, funding, liq, oi] = await Promise.all([
          supabase.functions.invoke('fetch-long-short-ratio', { body: { symbol } }),
          supabase.functions.invoke('fetch-funding-rate', { body: { symbol } }),
          supabase.functions.invoke('fetch-liquidations', { body: { symbol } }),
          supabase.functions.invoke('fetch-open-interest', { body: { symbol } })
        ]);

        if (lsRatio.data) setLongShortRatio(lsRatio.data);
        if (funding.data) setFundingRate(funding.data);
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

  const LoadingSkeleton = () => (
    <div className="h-24 bg-muted/20 rounded animate-pulse" />
  );

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coinglass Intelligence Panel</h2>
          <p className="text-sm text-muted-foreground">Real-time derivatives market data</p>
        </div>
        <Activity className="w-6 h-6 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Long vs Short Ratio */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Long vs Short Ratio
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : longShortRatio ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-chart-green text-sm font-medium">Long</span>
                  <span className="text-xl font-bold text-chart-green">
                    {longShortRatio.longRatio?.toFixed(1) || '0'}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-chart-green"
                    style={{ width: `${longShortRatio.longRatio || 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-chart-red text-sm font-medium">Short</span>
                  <span className="text-xl font-bold text-chart-red">
                    {longShortRatio.shortRatio?.toFixed(1) || '0'}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-chart-red"
                    style={{ width: `${longShortRatio.shortRatio || 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>

        {/* Top Trader Positions */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Top Trader Positions
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : longShortRatio?.topTraderRatio ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ratio</span>
                  <span className="text-2xl font-bold text-foreground">
                    {longShortRatio.topTraderRatio.toFixed(2)}
                  </span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${
                  longShortRatio.topTraderRatio > 1 ? 'text-chart-green' : 'text-chart-red'
                }`}>
                  {longShortRatio.topTraderRatio > 1 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {longShortRatio.topTraderRatio > 1 ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>

        {/* Funding Rate Trend */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Funding Rate Trend
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : fundingRate ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {(fundingRate.rate * 100).toFixed(4)}%
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {fundingRate.rate > 0 ? 'Longs pay shorts' : 'Shorts pay longs'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>

        {/* Liquidation Levels */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Liquidation Levels (24H)
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : liquidations ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Longs</span>
                  <span className="text-lg font-bold text-chart-red">
                    {formatNumber(liquidations.longLiquidations || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Shorts</span>
                  <span className="text-lg font-bold text-chart-green">
                    {formatNumber(liquidations.shortLiquidations || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>

        {/* Open Interest Heatmap */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Open Interest Heatmap
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : openInterest ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {formatNumber(openInterest.total || 0)}
                </div>
                <div className={`flex items-center gap-2 text-sm ${
                  openInterest.change24h > 0 ? 'text-chart-green' : 'text-chart-red'
                }`}>
                  {openInterest.change24h > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {openInterest.change24h > 0 ? '+' : ''}{openInterest.change24h?.toFixed(2)}% (24h)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>

        {/* 4H Leverage Map */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              4H Leverage Map
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : longShortRatio?.avgLeverage ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {longShortRatio.avgLeverage.toFixed(1)}x
                </div>
                <div className="text-xs text-muted-foreground">
                  Average leverage across exchanges
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>

        {/* Short Squeeze Probability */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Short Squeeze Probability
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : longShortRatio && fundingRate ? (
              <div className="space-y-2">
                {(() => {
                  const shortPressure = longShortRatio.shortRatio > 55;
                  const negativeFunding = fundingRate.rate < 0;
                  const probability = shortPressure && negativeFunding ? 'HIGH' : 
                                    shortPressure || negativeFunding ? 'MEDIUM' : 'LOW';
                  const color = probability === 'HIGH' ? 'text-chart-green' :
                               probability === 'MEDIUM' ? 'text-accent' : 'text-muted-foreground';
                  
                  return (
                    <>
                      <div className={`text-3xl font-bold ${color}`}>
                        {probability}
                      </div>
                      {probability !== 'LOW' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Watch for upside breakout</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>

        {/* Long Squeeze Probability */}
        <Card className="p-6 bg-card border border-border">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Long Squeeze Probability
            </p>
            {loading ? (
              <LoadingSkeleton />
            ) : longShortRatio && fundingRate ? (
              <div className="space-y-2">
                {(() => {
                  const longPressure = longShortRatio.longRatio > 55;
                  const positiveFunding = fundingRate.rate > 0.01;
                  const probability = longPressure && positiveFunding ? 'HIGH' : 
                                    longPressure || positiveFunding ? 'MEDIUM' : 'LOW';
                  const color = probability === 'HIGH' ? 'text-chart-red' :
                               probability === 'MEDIUM' ? 'text-accent' : 'text-muted-foreground';
                  
                  return (
                    <>
                      <div className={`text-3xl font-bold ${color}`}>
                        {probability}
                      </div>
                      {probability !== 'LOW' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Watch for downside risk</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
