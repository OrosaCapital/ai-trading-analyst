import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SymbolSummaryPanelProps {
  symbol: string;
}

export const SymbolSummaryPanel = ({ symbol }: SymbolSummaryPanelProps) => {
  const { priceState, marketData, loading, loadPriceData } = useMarketStore();

  useEffect(() => {
    loadPriceData();
    const interval = setInterval(loadPriceData, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  const { currentPrice, priceOneMinuteAgo, lastUpdate, error } = priceState;

  const priceChange = priceOneMinuteAgo && currentPrice 
    ? currentPrice - priceOneMinuteAgo 
    : 0;
  const priceChangePercent = priceOneMinuteAgo && currentPrice 
    ? ((currentPrice - priceOneMinuteAgo) / priceOneMinuteAgo) * 100 
    : 0;
  
  const isUp = priceChange > 0;
  const isDown = priceChange < 0;

  const formatPrice = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatTimeSince = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <Card className="p-4 bg-card border border-border">
      <div className="grid grid-cols-6 gap-6 items-center">
        {/* Symbol & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight whitespace-nowrap">
              {symbol}
            </h1>
            {loading.price ? (
              <LoadingSpinner size="sm" />
            ) : error ? (
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-chart-green animate-pulse" />
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {error || formatTimeSince()}
          </div>
        </div>

        {/* Current Price */}
        <div className="col-span-2 space-y-1">
          <div className="text-xs text-muted-foreground">Current Price</div>
          {loading.price ? (
            <LoadingSpinner />
          ) : currentPrice ? (
            <div className="text-3xl font-bold">${formatPrice(currentPrice)}</div>
          ) : (
            <div className="text-xl text-muted-foreground">--</div>
          )}
        </div>

        {/* 1-min Change */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">1-min Change</div>
          <div className={`flex items-center gap-1 ${
            isUp ? 'text-chart-green' : isDown ? 'text-chart-red' : 'text-muted-foreground'
          }`}>
            {isUp && <TrendingUp className="w-4 h-4" />}
            {isDown && <TrendingDown className="w-4 h-4" />}
            {!isUp && !isDown && <Activity className="w-4 h-4" />}
            <span className="text-sm font-semibold">
              {priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 24h Change */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">24h Change</div>
          {marketData?.percentChange24h !== undefined ? (
            <div className={`text-sm font-semibold ${
              marketData.percentChange24h > 0 
                ? 'text-chart-green' 
                : marketData.percentChange24h < 0 
                  ? 'text-chart-red' 
                  : 'text-muted-foreground'
            }`}>
              {marketData.percentChange24h > 0 ? '+' : ''}
              {marketData.percentChange24h.toFixed(2)}%
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">--</div>
          )}
        </div>

        {/* Volume */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">24h Volume</div>
          {marketData?.volume24h ? (
            <div className="text-sm font-semibold">
              {formatLargeNumber(marketData.volume24h)}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">--</div>
          )}
        </div>
      </div>
    </Card>
  );
};
