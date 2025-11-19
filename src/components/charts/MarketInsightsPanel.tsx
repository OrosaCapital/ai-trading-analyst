import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

interface MarketInsightsPanelProps {
  symbol: string;
  currentPrice: number;
  candles: any[];
  isUsingFallback?: boolean;
}

export function MarketInsightsPanel({ symbol, currentPrice, candles, isUsingFallback = false }: MarketInsightsPanelProps) {
  // Fetch funding rate data from database
  const { data: fundingData, isLoading: isFundingLoading } = useQuery({
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

  // Don't calculate indicators on fake/fallback data
  const hasRealData = !isUsingFallback && candles.length > 0;
  const hasRealFunding = !isFundingLoading && fundingData && fundingData.length > 0;

  // Calculate aggregated funding sentiment (only with real data)
  const fundingSentiment = hasRealFunding ? 
    fundingData.reduce((sum, d) => sum + parseFloat(d.rate.toString()), 0) / fundingData.length : null;
  
  const exchangeCount = hasRealFunding ? new Set(fundingData.map(d => d.exchange)).size : null;

  // Calculate VWAP from candles (only with real data)
  const vwap = hasRealData ? 
    candles.reduce((sum, c) => sum + (c.close * (c.volume || 1)), 0) / 
    candles.reduce((sum, c) => sum + (c.volume || 1), 0) : null;
  
  const vwapDeviation = hasRealData && vwap ? ((currentPrice - vwap) / vwap) * 100 : null;

  // Calculate recent volatility (last 20 candles, only with real data)
  const recentCandles = hasRealData ? candles.slice(-20) : [];
  const avgRange = hasRealData && recentCandles.length > 0 ?
    recentCandles.reduce((sum, c) => sum + ((c.high - c.low) / c.close) * 100, 0) / recentCandles.length : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <InsightCard
        icon={<DollarSign className="h-4 w-4" />}
        label="Funding Bias"
        value={fundingSentiment !== null ? `${(fundingSentiment * 100).toFixed(3)}%` : "Loading..."}
        subtext={fundingSentiment !== null ? 
          (fundingSentiment > 0.01 ? "Longs paying" : fundingSentiment < -0.01 ? "Shorts paying" : "Balanced") :
          "Fetching data"}
        status={fundingSentiment !== null ? 
          (fundingSentiment > 0.01 ? "negative" : fundingSentiment < -0.01 ? "positive" : "neutral") :
          "neutral"}
        isLoadingData={fundingSentiment === null}
      />
      
      <InsightCard
        icon={<Activity className="h-4 w-4" />}
        label="Exchange Coverage"
        value={exchangeCount !== null ? `${exchangeCount} exchanges` : "Loading..."}
        subtext={exchangeCount !== null ? "Real-time tracking" : "Fetching data"}
        status="neutral"
        isLoadingData={exchangeCount === null}
      />
      
      <InsightCard
        icon={vwapDeviation !== null && vwapDeviation > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        label="VWAP Deviation"
        value={vwapDeviation !== null ? `${vwapDeviation >= 0 ? '+' : ''}${vwapDeviation.toFixed(2)}%` : "Loading..."}
        subtext={vwapDeviation !== null ? 
          (Math.abs(vwapDeviation) > 1 ? "Extended" : "Fair value") :
          "Fetching candles"}
        status={vwapDeviation !== null ? 
          (Math.abs(vwapDeviation) > 1 ? (vwapDeviation > 0 ? "positive" : "negative") : "neutral") :
          "neutral"}
        isLoadingData={vwapDeviation === null}
      />
      
      <InsightCard
        icon={<Activity className="h-4 w-4" />}
        label="Avg Candle Range"
        value={avgRange !== null ? `${avgRange.toFixed(2)}%` : "Loading..."}
        subtext={avgRange !== null ? 
          (avgRange > 1.5 ? "High volatility" : avgRange > 0.8 ? "Moderate" : "Low volatility") :
          "Fetching candles"}
        status={avgRange !== null ? (avgRange > 1.5 ? "negative" : "neutral") : "neutral"}
        isLoadingData={avgRange === null}
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
  isLoadingData?: boolean;
}

function InsightCard({ icon, label, value, subtext, status, isLoadingData = false }: InsightCardProps) {
  const statusColors = {
    positive: "text-chart-green",
    negative: "text-chart-red",
    neutral: "text-muted-foreground"
  };

  return (
    <div className={`p-3 bg-card/30 rounded-lg border transition-all ${
      isLoadingData 
        ? "border-orange-500/40 hover:border-orange-500/60" 
        : "border-border/40 hover:border-border/60"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`${isLoadingData ? "text-orange-500 animate-pulse" : statusColors[status]}`}>
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
      </div>
      <div className={`text-lg font-bold mb-1 ${
        isLoadingData ? "text-orange-500" : statusColors[status]
      }`}>
        {value}
      </div>
      <div className={`text-[10px] ${
        isLoadingData ? "text-orange-500/70" : "text-muted-foreground/80"
      }`}>
        {subtext}
      </div>
    </div>
  );
}
