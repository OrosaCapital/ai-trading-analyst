import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

interface MarketInsightsPanelProps {
  symbol: string;
  currentPrice: number;
  candles: any[];
}

export function MarketInsightsPanel({ symbol, currentPrice, candles }: MarketInsightsPanelProps) {
  // Fetch funding rate data from database
  const { data: fundingData } = useQuery({
    queryKey: ['market-insights-funding', symbol],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_funding_rates')
        .select('rate, exchange, timestamp')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Calculate aggregated funding sentiment
  const fundingSentiment = fundingData?.length ? 
    fundingData.reduce((sum, d) => sum + parseFloat(d.rate.toString()), 0) / fundingData.length : 0;
  
  const exchangeCount = fundingData ? new Set(fundingData.map(d => d.exchange)).size : 0;

  // Calculate VWAP from candles
  const vwap = candles.length > 0 ? 
    candles.reduce((sum, c) => sum + (c.close * (c.volume || 1)), 0) / 
    candles.reduce((sum, c) => sum + (c.volume || 1), 0) : currentPrice;
  
  const vwapDeviation = ((currentPrice - vwap) / vwap) * 100;

  // Calculate recent volatility (last 20 candles)
  const recentCandles = candles.slice(-20);
  const avgRange = recentCandles.length > 0 ?
    recentCandles.reduce((sum, c) => sum + ((c.high - c.low) / c.close) * 100, 0) / recentCandles.length : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <InsightCard
        icon={<DollarSign className="h-4 w-4" />}
        label="Funding Bias"
        value={`${(fundingSentiment * 100).toFixed(3)}%`}
        subtext={fundingSentiment > 0.01 ? "Longs paying" : fundingSentiment < -0.01 ? "Shorts paying" : "Balanced"}
        status={fundingSentiment > 0.01 ? "negative" : fundingSentiment < -0.01 ? "positive" : "neutral"}
      />
      
      <InsightCard
        icon={<Activity className="h-4 w-4" />}
        label="Exchange Coverage"
        value={`${exchangeCount} exchanges`}
        subtext="Real-time tracking"
        status="neutral"
      />
      
      <InsightCard
        icon={vwapDeviation > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        label="VWAP Deviation"
        value={`${vwapDeviation >= 0 ? '+' : ''}${vwapDeviation.toFixed(2)}%`}
        subtext={Math.abs(vwapDeviation) > 1 ? "Extended" : "Fair value"}
        status={Math.abs(vwapDeviation) > 1 ? (vwapDeviation > 0 ? "positive" : "negative") : "neutral"}
      />
      
      <InsightCard
        icon={<Activity className="h-4 w-4" />}
        label="Avg Candle Range"
        value={`${avgRange.toFixed(2)}%`}
        subtext={avgRange > 1.5 ? "High volatility" : avgRange > 0.8 ? "Moderate" : "Low volatility"}
        status={avgRange > 1.5 ? "negative" : "neutral"}
      />
    </div>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  status: "positive" | "negative" | "neutral";
}

function InsightCard({ icon, label, value, subtext, status }: InsightCardProps) {
  const statusColors = {
    positive: "text-chart-green",
    negative: "text-chart-red",
    neutral: "text-muted-foreground"
  };

  return (
    <div className="p-3 bg-card/30 rounded-lg border border-border/40 hover:border-border/60 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className={`${statusColors[status]}`}>{icon}</div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
      </div>
      <div className={`text-lg font-bold ${statusColors[status]} mb-1`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground/80">
        {subtext}
      </div>
    </div>
  );
}
