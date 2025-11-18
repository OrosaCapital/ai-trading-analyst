import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Target,
  Zap,
  Flame,
  Droplet,
  BarChart3,
  DollarSign,
  TrendingUpDown,
  Gauge
} from 'lucide-react';
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
  const [fundingRateList, setFundingRateList] = useState<any>(null);
  const [takerVolume, setTakerVolume] = useState<any>(null);
  const [rsi, setRsi] = useState<any>(null);
  const [futuresBasis, setFuturesBasis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCoinglassData = async () => {
      try {
        setLoading(true);

        // Fetch all Coinglass metrics in parallel (8 total metrics)
        const [lsRatio, fearGreed, liq, oi, fundingList, takerVol, rsiData, basis] = await Promise.all([
          supabase.functions.invoke('fetch-long-short-ratio', { body: { symbol } }),
          supabase.functions.invoke('fetch-fear-greed-index'),
          supabase.functions.invoke('fetch-liquidations', { body: { symbol } }),
          supabase.functions.invoke('fetch-open-interest', { body: { symbol } }),
          supabase.functions.invoke('fetch-funding-rate-list', { body: { symbol } }),
          supabase.functions.invoke('fetch-taker-volume', { body: { symbol } }),
          supabase.functions.invoke('fetch-rsi', { body: { symbol } }),
          supabase.functions.invoke('fetch-futures-basis', { body: { symbol } })
        ]);
        
        console.log('Long/Short data:', lsRatio.data);
        console.log('Fear & Greed data:', fearGreed.data);
        console.log('Liquidations data:', liq.data);
        console.log('Open Interest data:', oi.data);
        console.log('Funding Rate List data:', fundingList.data);
        console.log('Taker Volume data:', takerVol.data);
        console.log('RSI data:', rsiData.data);
        console.log('Futures Basis data:', basis.data);
        
        if (lsRatio.data) setLongShortRatio(lsRatio.data);
        if (fearGreed.data) setFearGreedIndex(fearGreed.data);
        if (liq.data) setLiquidations(liq.data);
        if (oi.data) setOpenInterest(oi.data);
        if (fundingList.data) setFundingRateList(fundingList.data);
        if (takerVol.data) setTakerVolume(takerVol.data);
        if (rsiData.data) setRsi(rsiData.data);
        if (basis.data) setFuturesBasis(basis.data);
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
  return <div className="space-y-8">
      {/* Panel Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-accent/5 to-background p-6 border border-border/50">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
              <Zap className="w-6 h-6 text-primary animate-pulse" />
              Coinglass Intelligence
            </h2>
            <p className="text-xs text-muted-foreground mt-2">
              Real-time derivatives market analytics 
              {(longShortRatio?.unavailable || liquidations?.unavailable || openInterest?.unavailable) && 
                <span className="text-accent ml-2 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Limited data for this symbol
                </span>
              }
            </p>
          </div>
          <Activity className="w-8 h-8 text-primary/60 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
      </div>

      {/* Summary Dashboard - Inspired by Block.AI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Summary Card */}
        <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-card via-card to-card/80 border border-border/50">
          <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Summary
          </h3>
          <div className="space-y-4">
            {/* Market Sentiment */}
            <div className="flex justify-between items-center py-3 border-b border-border/30">
              <span className="text-sm text-muted-foreground font-medium">Market Sentiment</span>
              <span className={`text-base font-black ${
                fearGreedIndex?.valueClassification?.includes('Greed') 
                  ? 'text-chart-green' 
                  : fearGreedIndex?.valueClassification?.includes('Fear')
                    ? 'text-chart-red'
                    : 'text-muted-foreground'
              }`}>
                {loading ? '...' : fearGreedIndex?.value || '--'}
              </span>
            </div>

            {/* Long/Short Balance */}
            <div className="flex justify-between items-center py-3 border-b border-border/30">
              <span className="text-sm text-muted-foreground font-medium">Long/Short Ratio</span>
              <span className={`text-base font-black ${
                longShortRatio?.sentiment === 'BULLISH' 
                  ? 'text-chart-green' 
                  : longShortRatio?.sentiment === 'BEARISH'
                    ? 'text-chart-red'
                    : 'text-muted-foreground'
              }`}>
                {loading ? '...' : longShortRatio?.ratio || '--'}
              </span>
            </div>

            {/* Liquidations 24h */}
            <div className="flex justify-between items-center py-3 border-b border-border/30">
              <span className="text-sm text-muted-foreground font-medium">Liquidations 24h</span>
              <span className="text-base font-black text-destructive">
                {loading ? '...' : liquidations?.last24h?.total || '--'}
              </span>
            </div>

            {/* RSI */}
            <div className="flex justify-between items-center py-3 border-b border-border/30">
              <span className="text-sm text-muted-foreground font-medium">RSI (14)</span>
              <span className={`text-base font-black ${
                rsi?.signal === 'OVERBOUGHT' || rsi?.signal === 'BEARISH'
                  ? 'text-chart-red'
                  : rsi?.signal === 'OVERSOLD' || rsi?.signal === 'BULLISH'
                    ? 'text-chart-green'
                    : 'text-muted-foreground'
              }`}>
                {loading ? '...' : rsi?.rsi14?.toFixed(0) || '--'}
              </span>
            </div>

            {/* Funding Rate */}
            <div className="flex justify-between items-center py-3 border-b border-border/30">
              <span className="text-sm text-muted-foreground font-medium">Funding Rate</span>
              <span className={`text-base font-black ${
                fundingRateList?.sentiment?.includes('BULLISH')
                  ? 'text-chart-green'
                  : fundingRateList?.sentiment?.includes('BEARISH')
                    ? 'text-chart-red'
                    : 'text-muted-foreground'
              }`}>
                {loading ? '...' : fundingRateList?.unavailable ? 'N/A' : `${(fundingRateList?.avgRate * 100)?.toFixed(3)}%` || '--'}
              </span>
            </div>

            {/* Open Interest */}
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-muted-foreground font-medium">Open Interest</span>
              <span className="text-base font-black text-foreground">
                {loading ? '...' : openInterest?.total?.value || 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Main Metrics Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Long vs Short Ratio */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-green/5 to-chart-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Long vs Short Ratio
              </p>
              <TrendingUpDown className="w-5 h-5 text-primary/60" />
            </div>
            {loading ? <LoadingSkeleton /> : longShortRatio ? longShortRatio.unavailable ? <div className="text-sm text-muted-foreground">
                  Not available for this symbol
                </div> : <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-chart-green text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Long
                      </span>
                      <span className="text-2xl font-black text-chart-green">
                        {parseFloat(longShortRatio.long_percent || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-chart-green to-emerald-400 animate-fade-in shadow-lg" 
                        style={{ width: `${longShortRatio.long_percent || 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-chart-red text-sm font-bold flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Short
                      </span>
                      <span className="text-2xl font-black text-chart-red">
                        {parseFloat(longShortRatio.short_percent || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-chart-red to-red-400 animate-fade-in shadow-lg" 
                        style={{ width: `${longShortRatio.short_percent || 0}%` }} />
                    </div>
                  </div>
                </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Fear & Greed Index */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 overflow-hidden">
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            fearGreedIndex?.valueClassification === 'Extreme Fear' ? 'bg-gradient-to-br from-chart-red/10 to-red-900/5 opacity-50' :
            fearGreedIndex?.valueClassification === 'Fear' ? 'bg-gradient-to-br from-orange-500/10 to-orange-900/5 opacity-50' :
            fearGreedIndex?.valueClassification === 'Greed' ? 'bg-gradient-to-br from-chart-green/10 to-emerald-900/5 opacity-50' :
            fearGreedIndex?.valueClassification === 'Extreme Greed' ? 'bg-gradient-to-br from-emerald-400/10 to-green-900/5 opacity-50' :
            'bg-gradient-to-br from-muted/10 to-background/5 opacity-50'
          } group-hover:opacity-70`} />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                FEAR & GREED INDEX               
              </p>
              <Flame className={`w-6 h-6 ${
                fearGreedIndex?.valueClassification === 'Extreme Fear' || fearGreedIndex?.valueClassification === 'Fear' 
                  ? 'text-chart-red animate-pulse' 
                  : 'text-chart-green animate-pulse'
              }`} />
            </div>
            {loading ? <LoadingSkeleton /> : fearGreedIndex ? <div className="space-y-3">
                <div className="text-4xl font-black bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {fearGreedIndex.value}
                </div>
                <div className={`inline-block text-base font-black uppercase px-4 py-2 rounded-full ${
                  fearGreedIndex.valueClassification === 'Extreme Fear' ? 'bg-chart-red/20 text-chart-red border border-chart-red/30' :
                  fearGreedIndex.valueClassification === 'Fear' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                  fearGreedIndex.valueClassification === 'Greed' ? 'bg-chart-green/20 text-chart-green border border-chart-green/30' :
                  fearGreedIndex.valueClassification === 'Extreme Greed' ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30' :
                  'bg-muted/20 text-muted-foreground border border-muted'
                }`}>
                  {fearGreedIndex.valueClassification}
                </div>
                {fearGreedIndex.change24h !== 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {fearGreedIndex.change24h > 0 ? <TrendingUp className="w-4 h-4 text-chart-green" /> : <TrendingDown className="w-4 h-4 text-chart-red" />}
                    <span className="font-medium">{fearGreedIndex.change24h > 0 ? '+' : ''}{fearGreedIndex.change24h?.toFixed(0)} from yesterday</span>
                  </div>
                )}
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Liquidation Levels */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-destructive/50 transition-all duration-300 hover:shadow-lg hover:shadow-destructive/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-chart-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Droplet className="w-4 h-4 text-primary" />
                Liquidation Levels (24H)
              </p>
              <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
            </div>
            {loading ? <LoadingSkeleton /> : liquidations?.last24h ? <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-chart-red/10 border border-chart-red/20">
                  <span className="text-sm font-bold text-chart-red flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Longs
                  </span>
                  <span className="text-xl font-black text-chart-red">
                    ${liquidations.last24h.totalLongs}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-chart-green/10 border border-chart-green/20">
                  <span className="text-sm font-bold text-chart-green flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Shorts
                  </span>
                  <span className="text-xl font-black text-chart-green">
                    ${liquidations.last24h.totalShorts}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Total: ${liquidations.last24h.total}
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Open Interest Heatmap */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Open Interest
              </p>
              <DollarSign className="w-6 h-6 text-primary/60" />
            </div>
            {loading ? <LoadingSkeleton /> : openInterest?.total ? <div className="space-y-3">
                <div className="text-3xl font-black bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  ${openInterest.total.value}
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold ${
                  openInterest.total.sentiment === 'INCREASING' 
                    ? 'bg-chart-green/20 text-chart-green border border-chart-green/30' 
                    : 'bg-chart-red/20 text-chart-red border border-chart-red/30'
                }`}>
                  {openInterest.total.sentiment === 'INCREASING' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{openInterest.total.change24h}</span>
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Short Squeeze Probability */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-chart-green/50 transition-all duration-300 hover:shadow-lg hover:shadow-chart-green/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-green/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Short Squeeze Probability
              </p>
              <TrendingUp className="w-5 h-5 text-chart-green" />
            </div>
            {loading ? <LoadingSkeleton /> : longShortRatio && fearGreedIndex ? <div className="space-y-3">
                {(() => {
              const shortPercent = parseFloat(longShortRatio.short_percent || 0);
              const fearValue = fearGreedIndex.value;
              const shortPressure = shortPercent > 55;
              const extremeFear = fearValue < 25;
              const probability = shortPressure && extremeFear ? 'HIGH' : shortPressure || extremeFear ? 'MEDIUM' : 'LOW';
              const color = probability === 'HIGH' ? 'text-chart-green' : probability === 'MEDIUM' ? 'text-accent' : 'text-muted-foreground';
              return <>
                      <div className={`text-4xl font-black ${color}`}>
                        {probability}
                      </div>
                      {probability !== 'LOW' && <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-chart-green/10 border border-chart-green/20 rounded-lg p-3">
                          <AlertTriangle className="w-4 h-4 text-chart-green" />
                          <span>Watch for upside breakout</span>
                        </div>}
                    </>;
            })()}
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Long Squeeze Probability */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-chart-red/50 transition-all duration-300 hover:shadow-lg hover:shadow-chart-red/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-red/5 to-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Long Squeeze Probability
              </p>
              <TrendingDown className="w-5 h-5 text-chart-red" />
            </div>
            {loading ? <LoadingSkeleton /> : longShortRatio && fearGreedIndex ? <div className="space-y-3">
                {(() => {
              const longPercent = parseFloat(longShortRatio.long_percent || 0);
              const fearValue = fearGreedIndex.value;
              const longPressure = longPercent > 55;
              const extremeGreed = fearValue > 75;
              const probability = longPressure && extremeGreed ? 'HIGH' : longPressure || extremeGreed ? 'MEDIUM' : 'LOW';
              const color = probability === 'HIGH' ? 'text-chart-red' : probability === 'MEDIUM' ? 'text-accent' : 'text-muted-foreground';
              return <>
                      <div className={`text-4xl font-black ${color}`}>
                        {probability}
                      </div>
                      {probability !== 'LOW' && <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-chart-red/10 border border-chart-red/20 rounded-lg p-3">
                          <AlertTriangle className="w-4 h-4 text-chart-red" />
                          <span>Watch for downside risk</span>
                        </div>}
                    </>;
            })()}
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Funding Rate */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Funding Rate
              </p>
              <Zap className="w-5 h-5 text-accent animate-pulse" />
            </div>
            {loading ? <LoadingSkeleton /> : fundingRateList && !fundingRateList.unavailable ? <div className="space-y-3">
                <div className="text-3xl font-black bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {(fundingRateList.avgRate * 100).toFixed(4)}%
                </div>
                <div className={`inline-block text-base font-black uppercase px-4 py-2 rounded-full ${
                  fundingRateList.sentiment.includes('BULLISH') 
                    ? 'bg-chart-green/20 text-chart-green border border-chart-green/30' :
                  fundingRateList.sentiment.includes('BEARISH') 
                    ? 'bg-chart-red/20 text-chart-red border border-chart-red/30' :
                  'bg-muted/20 text-muted-foreground border border-muted'
                }`}>
                  {fundingRateList.sentiment}
                </div>
                <div className="text-sm text-muted-foreground font-medium px-3 py-2 bg-muted/20 rounded-lg">
                  {fundingRateList.avgRate > 0 ? '💰 Longs pay shorts' : '💰 Shorts pay longs'}
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Taker Buy/Sell Volume */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-green/5 to-chart-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Taker Volume Ratio
              </p>
              <Activity className="w-5 h-5 text-primary/60" />
            </div>
            {loading ? <LoadingSkeleton /> : takerVolume && !takerVolume.unavailable && takerVolume.buyRatio != null && takerVolume.sellRatio != null ? <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-chart-green text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Buy
                    </span>
                    <span className="text-2xl font-black text-chart-green">
                      {takerVolume.buyRatio?.toFixed(1) ?? '50.0'}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-chart-green to-emerald-400 animate-fade-in shadow-lg" 
                      style={{ width: `${takerVolume.buyRatio ?? 50}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-chart-red text-sm font-bold flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Sell
                    </span>
                    <span className="text-2xl font-black text-chart-red">
                      {takerVolume.sellRatio?.toFixed(1) ?? '50.0'}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-chart-red to-red-400 animate-fade-in shadow-lg" 
                      style={{ width: `${takerVolume.sellRatio ?? 50}%` }} />
                  </div>
                </div>
                <div className={`inline-block text-lg font-black uppercase px-4 py-2 rounded-full ${
                  takerVolume.sentiment?.includes('BUYING') 
                    ? 'bg-chart-green/20 text-chart-green border border-chart-green/30' :
                  takerVolume.sentiment?.includes('SELLING') 
                    ? 'bg-chart-red/20 text-chart-red border border-chart-red/30' :
                  'bg-muted/20 text-muted-foreground border border-muted'
                }`}>
                  {takerVolume.sentiment ?? 'BALANCED'}
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* RSI Indicator */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden">
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            rsi?.signal === 'OVERBOUGHT' ? 'bg-gradient-to-br from-chart-red/10 to-red-900/5 opacity-50' :
            rsi?.signal === 'OVERSOLD' ? 'bg-gradient-to-br from-chart-green/10 to-emerald-900/5 opacity-50' :
            'bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100'
          }`} />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                RSI (14)
              </p>
              <Activity className="w-5 h-5 text-primary/60" />
            </div>
            {loading ? <LoadingSkeleton /> : rsi && !rsi.unavailable && rsi.rsi14 != null ? <div className="space-y-3">
                <div className="text-4xl font-black bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {rsi.rsi14?.toFixed(1) ?? '50.0'}
                </div>
                <div className={`inline-block text-base font-black uppercase px-4 py-2 rounded-full ${
                  rsi.signal === 'OVERBOUGHT' || rsi.signal === 'BEARISH' 
                    ? 'bg-chart-red/20 text-chart-red border border-chart-red/30' :
                  rsi.signal === 'OVERSOLD' || rsi.signal === 'BULLISH' 
                    ? 'bg-chart-green/20 text-chart-green border border-chart-green/30' :
                  'bg-muted/20 text-muted-foreground border border-muted'
                }`}>
                  {rsi.signal ?? 'NEUTRAL'}
                </div>
                <div className="text-sm text-muted-foreground font-medium px-3 py-2 bg-muted/20 rounded-lg">
                  {rsi.signal === 'OVERBOUGHT' ? '⚠️ Potential reversal zone' :
                   rsi.signal === 'OVERSOLD' ? '💡 Potential buying opportunity' :
                   '➡️ Neutral momentum'}
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Futures Basis */}
        <Card className="group relative p-6 bg-gradient-to-br from-card via-card to-card/50 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUpDown className="w-4 h-4 text-primary" />
                Futures Basis
              </p>
              <BarChart3 className="w-5 h-5 text-primary/60" />
            </div>
            {loading ? <LoadingSkeleton /> : futuresBasis && !futuresBasis.unavailable && futuresBasis.basisPercent != null ? <div className="space-y-3">
                <div className="text-4xl font-black bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {futuresBasis.basisPercent?.toFixed(2) ?? '0.00'}%
                </div>
                <div className={`inline-block text-base font-black uppercase px-4 py-2 rounded-full ${
                  futuresBasis.signal?.includes('SPECULATION') 
                    ? 'bg-chart-red/20 text-chart-red border border-chart-red/30' :
                  futuresBasis.signal?.includes('BULLISH') 
                    ? 'bg-chart-green/20 text-chart-green border border-chart-green/30' :
                  'bg-muted/20 text-muted-foreground border border-muted'
                }`}>
                  {futuresBasis.signal ?? 'NEUTRAL'}
                </div>
                <div className="text-sm text-muted-foreground font-medium px-3 py-2 bg-muted/20 rounded-lg">
                  <span className="font-black text-foreground">{futuresBasis.structure ?? 'FLAT'}</span> - {
                    futuresBasis.structure === 'CONTANGO' ? '📈 Futures premium' :
                    futuresBasis.structure === 'BACKWARDATION' ? '📉 Spot premium' :
                    '➡️ Neutral pricing'
                  }
                </div>
              </div> : <p className="text-muted-foreground">No data</p>}
          </div>
        </Card>
        </div>
      </div>
    </div>;
};