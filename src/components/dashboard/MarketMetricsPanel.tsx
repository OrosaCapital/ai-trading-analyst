import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mockMetrics } from "@/data/mockMetrics";
import { formatCurrency, formatPercentage } from "@/lib/mockDataGenerators";

interface MarketMetricsPanelProps {
  symbol: string;
}

export const MarketMetricsPanel = ({ symbol }: MarketMetricsPanelProps) => {
  const [marketData, setMarketData] = useState<any>(null);
  
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const { data } = await supabase.functions.invoke('fetch-cmc-data', {
          body: { symbol: `${symbol}USD` }
        });
        if (data) setMarketData(data);
      } catch (err) {
        console.error('Market data fetch error:', err);
      }
    };
    
    fetchMarketData();
    // Removed polling - derivatives data cached and rate-limited on backend
  }, [symbol]);

  const { fundingRate, openInterest, longShortRatio, liquidations } = mockMetrics;
  
  // Use real data if available, otherwise fall back to mock
  const price = marketData ? {
    current: marketData.price,
    changePercent24h: marketData.percentChange24h / 100,
    change24h: (marketData.price * marketData.percentChange24h) / 100
  } : mockMetrics.price;
  
  const volume = marketData ? {
    volume24h: marketData.volume24h,
    volumeChange: 0
  } : mockMetrics.volume;

  return (
    <div className="space-y-4">
      {/* Current Price */}
      <Card className="p-6 glass">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">BTC/USD</span>
          <TrendingUp className="w-4 h-4 text-chart-green" />
        </div>
        <div className="text-3xl font-black mb-1">
          {formatCurrency(price.current)}
        </div>
        <div className="text-sm text-chart-green font-semibold">
          {formatPercentage(price.changePercent24h)} • {formatCurrency(price.change24h)}
        </div>
      </Card>

      {/* Volume */}
      <Card className="p-6 glass">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">24h Volume</span>
        </div>
        <div className="text-2xl font-bold mb-1">
          {formatCurrency(volume.volume24h)}
        </div>
        <div className="text-sm text-chart-green">
          +{volume.volumeChange}% vs avg
        </div>
      </Card>

      {/* Funding Rate */}
      <Card className="p-6 glass">
        <div className="text-sm font-semibold mb-2">Funding Rate</div>
        <div className="text-2xl font-bold mb-1 text-chart-green">
          {(fundingRate.current * 100).toFixed(4)}%
        </div>
        <div className="text-xs text-muted-foreground">
          Next: {(fundingRate.predicted * 100).toFixed(4)}%
        </div>
      </Card>

      {/* Open Interest */}
      <Card className="p-6 glass">
        <div className="text-sm font-semibold mb-2">Open Interest</div>
        <div className="text-2xl font-bold mb-1">
          {formatCurrency(openInterest.total)}
        </div>
        <div className="text-sm text-chart-green">
          +{openInterest.change24h}% (24h)
        </div>
      </Card>

      {/* Long/Short Ratio */}
      <Card className="p-6 glass">
        <div className="text-sm font-semibold mb-3">Long/Short Ratio</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-chart-green">Long</span>
              <span className="font-bold">{longShortRatio.long}%</span>
            </div>
            <div className="h-2 bg-chart-green/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-chart-green rounded-full"
                style={{ width: `${longShortRatio.long}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-chart-red">Short</span>
              <span className="font-bold">{longShortRatio.short}%</span>
            </div>
            <div className="h-2 bg-chart-red/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-chart-red rounded-full"
                style={{ width: `${longShortRatio.short}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Liquidations */}
      <Card className="p-6 glass">
        <div className="text-sm font-semibold mb-3">24h Liquidations</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Longs</span>
            <span className="font-bold text-chart-red">
              {formatCurrency(liquidations.long24h)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shorts</span>
            <span className="font-bold text-chart-green">
              {formatCurrency(liquidations.short24h)}
            </span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>{formatCurrency(liquidations.total24h)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
