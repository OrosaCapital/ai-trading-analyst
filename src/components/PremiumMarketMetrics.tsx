import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PremiumMarketMetricsProps {
  symbol: string;
}

interface MetricData {
  fundingRate: { current: string; trend: string; sentiment: string };
  openInterest: { total: string; change24h: string; trend: string };
  liquidations: { total: string; ratio: string };
  marketHealth: { score: number; status: string; signals: string[] };
}

export const PremiumMarketMetrics = ({ symbol }: PremiumMarketMetricsProps) => {
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: overviewData, error } = await supabase.functions.invoke('fetch-market-overview', {
          body: { symbol }
        });

        if (error) throw error;

        setData({
          fundingRate: {
            ...overviewData.metrics.fundingRate,
            sentiment: overviewData.metrics.fundingRate.trend === 'RISING' ? 'BULLISH' : 'BEARISH'
          },
          openInterest: overviewData.metrics.openInterest,
          liquidations: {
            total: overviewData.metrics.liquidations24h.total,
            ratio: overviewData.metrics.liquidations24h.longShortRatio
          },
          marketHealth: overviewData.marketHealth,
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-6 h-32 animate-pulse">
            <div className="shimmer h-full rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      label: "Funding Rate",
      value: data.fundingRate.current,
      status: data.fundingRate.sentiment,
      trend: data.fundingRate.trend,
      icon: Zap,
      color: data.fundingRate.sentiment === 'BULLISH' ? 'text-chart-green' : 'text-chart-red',
    },
    {
      label: "Open Interest",
      value: data.openInterest.total,
      status: data.openInterest.change24h,
      trend: data.openInterest.trend,
      icon: Activity,
      color: data.openInterest.trend === 'INCREASING' ? 'text-chart-green' : 'text-chart-red',
    },
    {
      label: "Market Health",
      value: `${data.marketHealth.score}/100`,
      status: data.marketHealth.status,
      trend: data.marketHealth.score >= 70 ? 'STRONG' : 'MODERATE',
      icon: TrendingUp,
      color: data.marketHealth.score >= 70 ? 'text-chart-green' : 
             data.marketHealth.score >= 50 ? 'text-yellow-500' : 'text-chart-red',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Live Market Metrics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={metric.label}
            className="glass rounded-xl p-6 hover:bg-primary/5 transition-all group cursor-pointer animate-fade-in-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                metric.color.includes('green') ? 'from-chart-green/20 to-chart-green/5' :
                metric.color.includes('red') ? 'from-chart-red/20 to-chart-red/5' :
                'from-yellow-500/20 to-yellow-500/5'
              } flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              {metric.trend === 'RISING' || metric.trend === 'INCREASING' || metric.trend === 'STRONG' ? (
                <TrendingUp className="w-4 h-4 text-chart-green" />
              ) : (
                <TrendingDown className="w-4 h-4 text-chart-red" />
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              <div className={`text-3xl font-bold ${metric.color} group-hover:scale-105 transition-transform`}>
                {metric.value}
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  metric.color.includes('green') ? 'bg-chart-green/10 text-chart-green' :
                  metric.color.includes('red') ? 'bg-chart-red/10 text-chart-red' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {metric.status}
                </div>
              </div>
            </div>

            {/* Animated progress bar */}
            <div className="mt-4 h-1 bg-muted/20 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  metric.color.includes('green') ? 'bg-chart-green' :
                  metric.color.includes('red') ? 'bg-chart-red' :
                  'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(parseInt(metric.value) || 75, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
