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
    percentChange1h?: number;
  };
}
export const LivePriceHeader = ({
  symbol = 'BTC',
  marketData
}: LivePriceHeaderProps) => {
  const [price, setPrice] = useState<number | null>(null);
  const [priceOneMinuteAgo, setPriceOneMinuteAgo] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current price from CoinMarketCap and 1-minute ago price from logs
  const fetchPrice = async () => {
    try {
      // Fetch current price
      const {
        data,
        error
      } = await supabase.functions.invoke('fetch-cmc-price', {
        body: {
          symbol: `${symbol}USD`
        }
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
        setPrice(data.price);
        setLastUpdate(new Date());
        setError(null);
      }

      // TODO: Fetch price from 1 minute ago from cmc_price_logs after migration
      // const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      // const { data: logData, error: logError } = await supabase
      //   .from('cmc_price_logs')
      //   .select('price')
      //   .eq('symbol', `${symbol}USD`)
      //   .eq('interval', '1m')
      //   .lte('timestamp', oneMinuteAgo.toISOString())
      //   .order('timestamp', { ascending: false })
      //   .limit(1)
      //   .single();
      // if (!logError && logData) {
      //   setPriceOneMinuteAgo(logData.price);
      // }
    } catch (err) {
      console.error('Price fetch error:', err);
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  // REMOVED: No polling for price data - WebSocket only
  // Price updates come from useRealtimePriceStream hook
  useEffect(() => {
    if (!symbol) return;
    // No fetch - WebSocket handles all real-time data
  }, [symbol]);

  // Calculate 1-minute price change
  const priceChange = priceOneMinuteAgo && price ? price - priceOneMinuteAgo : 0;
  const priceChangePercent = priceOneMinuteAgo && price ? (price - priceOneMinuteAgo) / priceOneMinuteAgo * 100 : 0;
  const isUp = priceChange > 0;
  const isDown = priceChange < 0;

  // Format price with proper decimals
  const formatPrice = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
  return <Card className="p-4 bg-card border border-border">
      <div className="grid grid-cols-6 gap-6 items-center">
        {/* Symbol & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight whitespace-nowrap">
              {symbol}
            </h1>
            {isLoading ? <Activity className="w-3 h-3 text-muted-foreground animate-pulse" /> : error ? <span className="text-xs text-destructive">{error}</span> : <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-green animate-pulse" />
                <span className="text-xs text-muted-foreground">LIVE</span>
              </div>}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded">
              CoinMarketCap
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Price 1m  </div>
          {isLoading ? <div className="h-7 w-28 bg-muted animate-pulse rounded" /> : price ? <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight">
                ${formatPrice(price)}
              </span>
              {priceChange !== 0 && <div className={`flex items-center gap-0.5 ${isUp ? 'text-chart-green' : 'text-chart-red'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="text-sm font-bold">
                    {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
                  </span>
                </div>}
            </div> : <span className="text-xl text-muted-foreground">--</span>}
        </div>

        {/* Market Cap */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Market Cap</div>
          <div className="text-xl font-bold">
            {marketData?.marketCap ? formatLargeNumber(marketData.marketCap) : '--'}
          </div>
        </div>

        {/* 1Hr Change */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">1Hr Change</div>
          <div className={`text-xl font-bold ${marketData?.percentChange1h && marketData.percentChange1h > 0 ? 'text-chart-green' : marketData?.percentChange1h && marketData.percentChange1h < 0 ? 'text-chart-red' : ''}`}>
            {marketData?.percentChange1h ? `${marketData.percentChange1h > 0 ? '+' : ''}${marketData.percentChange1h.toFixed(2)}%` : '--'}
          </div>
        </div>

        {/* 24h Volume */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">24h Volume</div>
          <div className="text-xl font-bold">
            {marketData?.volume24h ? formatLargeNumber(marketData.volume24h) : '--'}
          </div>
        </div>

        {/* 24h Change */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">24h Change</div>
          <div className={`text-xl font-bold ${marketData?.percentChange24h && marketData.percentChange24h > 0 ? 'text-chart-green' : marketData?.percentChange24h && marketData.percentChange24h < 0 ? 'text-chart-red' : ''}`}>
            {marketData?.percentChange24h ? `${marketData.percentChange24h > 0 ? '+' : ''}${marketData.percentChange24h.toFixed(2)}%` : '--'}
          </div>
        </div>
      </div>
    </Card>;
};