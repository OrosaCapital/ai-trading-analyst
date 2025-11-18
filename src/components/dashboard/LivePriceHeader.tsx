import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LivePriceHeaderProps {
  symbol?: string;
  marketData?: {
    marketCap?: number;
    volume24h?: number;
    percentChange24h?: number;
  };
}

export const LivePriceHeader = ({ symbol = 'BTC', marketData }: LivePriceHeaderProps) => {
  const [price, setPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch price from Tatum
  const fetchPrice = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-tatum-price', {
        body: { symbol: `${symbol}USD` }
      });

      if (error) {
        console.error('Error fetching price:', error);
        setError('Failed to fetch price');
        return;
      }

      if (data?.unavailable) {
        setError('Price data unavailable');
        return;
      }

      if (data?.price) {
        setPreviousPrice(price);
        setPrice(data.price);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Price fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling every 5 seconds
  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Calculate price change
  const priceChange = previousPrice && price ? price - previousPrice : 0;
  const priceChangePercent = previousPrice && price 
    ? ((price - previousPrice) / previousPrice) * 100 
    : 0;
  const isUp = priceChange > 0;
  const isDown = priceChange < 0;

  // Format price with proper decimals
  const formatPrice = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format time since update
  const formatTimeSince = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <Card className="p-3 bg-card border border-border">
      <div className="flex items-center justify-between gap-6">
        {/* Symbol & Price */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {symbol} <span className="text-muted-foreground text-base">/ USD</span>
            </h1>
            {isLoading ? (
              <Activity className="w-3 h-3 text-muted-foreground animate-pulse" />
            ) : error ? (
              <span className="text-xs text-destructive">{error}</span>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-green animate-pulse" />
                <span className="text-xs text-muted-foreground">LIVE</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            ) : price ? (
              <>
                <span className="text-3xl md:text-4xl font-black tracking-tight">
                  ${formatPrice(price)}
                </span>
                {priceChange !== 0 && (
                  <div className={`flex items-center gap-0.5 ${isUp ? 'text-chart-green' : 'text-chart-red'}`}>
                    {isUp ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-base font-bold">
                      {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xl text-muted-foreground">--</span>
            )}
          </div>
        </div>

        {/* Market Metrics */}
        <div className="grid grid-cols-3 gap-4 text-right">
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">Market Cap</div>
            <div className="text-sm font-bold">
              {marketData?.marketCap ? formatLargeNumber(marketData.marketCap) : '--'}
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">24h Volume</div>
            <div className="text-sm font-bold">
              {marketData?.volume24h ? formatLargeNumber(marketData.volume24h) : '--'}
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">24h Change</div>
            <div className={`text-sm font-bold ${
              marketData?.percentChange24h && marketData.percentChange24h > 0 
                ? 'text-chart-green' 
                : marketData?.percentChange24h && marketData.percentChange24h < 0 
                  ? 'text-chart-red' 
                  : ''
            }`}>
              {marketData?.percentChange24h 
                ? `${marketData.percentChange24h > 0 ? '+' : ''}${marketData.percentChange24h.toFixed(2)}%` 
                : '--'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Source */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
        <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-xs">
          Tatum Feed
        </span>
        {lastUpdate && (
          <span>Updated {formatTimeSince()}</span>
        )}
      </div>
    </Card>
  );
};
