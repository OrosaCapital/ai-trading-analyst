import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity, Scale, Waves, Zap, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LiquidationHeatmap } from "./LiquidationHeatmap";
import { Card } from "./ui/card";

interface EnhancedMarketMetricsProps {
  symbol: string;
}

interface LongShortData {
  ratio: string;
  long_percent: string;
  short_percent: string;
  sentiment: string;
  exchanges: Array<{ name: string; long: string; short: string }>;
  mock?: boolean;
}

interface CVDData {
  cvd: {
    [key: string]: {
      current_cvd: string;
      buy_volume: string;
      sell_volume: string;
      delta: string;
      trend: string;
    };
  };
  summary: {
    dominant_trend: string;
    strength: string;
    signal: string;
  };
  mock?: boolean;
}

export const EnhancedMarketMetrics = ({ symbol }: EnhancedMarketMetricsProps) => {
  const [longShortData, setLongShortData] = useState<LongShortData | null>(null);
  const [cvdData, setCvdData] = useState<CVDData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch long/short ratio
        const { data: lsData, error: lsError } = await supabase.functions.invoke('fetch-long-short-ratio', {
          body: { symbol }
        });
        if (lsError) throw lsError;
        setLongShortData(lsData);

        // Fetch taker volume (CVD)
        const { data: cvdDataResult, error: cvdError } = await supabase.functions.invoke('fetch-taker-volume', {
          body: { symbol }
        });
        if (cvdError) throw cvdError;
        setCvdData(cvdDataResult);
        
      } catch (error) {
        console.error('Error fetching enhanced metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl p-6 h-48 animate-pulse">
              <div className="shimmer h-full rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Advanced Market Analytics
      </h3>

      {/* Long/Short Ratio */}
      {longShortData && (
        <Card className="glass p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <h4 className="font-bold">Long/Short Ratio</h4>
              {longShortData.mock && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500">Demo</span>
              )}
            </div>
            <div className={`px-3 py-1 rounded-lg font-medium ${
              longShortData.sentiment === 'BULLISH' ? 'bg-chart-green/10 text-chart-green' :
              longShortData.sentiment === 'BEARISH' ? 'bg-chart-red/10 text-chart-red' :
              'bg-muted/50 text-muted-foreground'
            }`}>
              {longShortData.sentiment}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Long Positions</div>
              <div className="text-3xl font-bold text-chart-green">{longShortData.long_percent}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Short Positions</div>
              <div className="text-3xl font-bold text-chart-red">{longShortData.short_percent}%</div>
            </div>
          </div>

          {/* Visual bar */}
          <div className="relative h-3 bg-muted/20 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute left-0 top-0 h-full bg-chart-green"
              style={{ width: `${longShortData.long_percent}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-chart-red"
              style={{ width: `${longShortData.short_percent}%` }}
            />
          </div>

          {/* Exchange breakdown */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Exchange Breakdown</div>
            {longShortData.exchanges.slice(0, 3).map((ex) => (
              <div key={ex.name} className="flex items-center justify-between text-sm">
                <span className="font-medium">{ex.name}</span>
                <div className="flex gap-4">
                  <span className="text-chart-green">{ex.long}% L</span>
                  <span className="text-chart-red">{ex.short}% S</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CVD (Cumulative Volume Delta) */}
      {cvdData && (
        <Card className="glass p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              <h4 className="font-bold">Cumulative Volume Delta (CVD)</h4>
              {cvdData.mock && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500">Demo</span>
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium ${
              cvdData.summary.signal === 'BUY' ? 'bg-chart-green/10 text-chart-green' :
              cvdData.summary.signal === 'SELL' ? 'bg-chart-red/10 text-chart-red' :
              'bg-muted/50 text-muted-foreground'
            }`}>
              {cvdData.summary.signal === 'BUY' ? <TrendingUp className="w-4 h-4" /> : 
               cvdData.summary.signal === 'SELL' ? <TrendingDown className="w-4 h-4" /> : null}
              {cvdData.summary.signal}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.entries(cvdData.cvd).map(([interval, data]) => (
              <div key={interval} className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase">{interval}</div>
                <div className={`text-xl font-bold ${
                  data.trend === 'BULLISH' ? 'text-chart-green' : 'text-chart-red'
                }`}>
                  {parseFloat(data.current_cvd) > 0 ? '+' : ''}{(parseFloat(data.current_cvd) / 1000).toFixed(1)}K
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {data.trend === 'BULLISH' ? 
                    <TrendingUp className="w-3 h-3 text-chart-green" /> : 
                    <TrendingDown className="w-3 h-3 text-chart-red" />
                  }
                  <span className={data.trend === 'BULLISH' ? 'text-chart-green' : 'text-chart-red'}>
                    {data.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <span className="text-sm font-medium">Trend Strength</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    cvdData.summary.dominant_trend === 'BULLISH' ? 'bg-chart-green' : 'bg-chart-red'
                  }`}
                  style={{ width: `${cvdData.summary.strength}%` }}
                />
              </div>
              <span className="text-sm font-bold">{cvdData.summary.strength}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* Liquidation Heatmap */}
      <LiquidationHeatmap symbol={symbol} />
    </div>
  );
};
