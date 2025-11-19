import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity } from "lucide-react";

interface ExchangeStat {
  name: string;
  pairCount: number;
  symbols: string[];
}

interface ExchangePairsResponse {
  success: boolean;
  totalPairs: number;
  exchangeCount: number;
  exchanges: ExchangeStat[];
  error?: string;
}

export const ExchangeCoverage = () => {
  const [data, setData] = useState<ExchangePairsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExchangePairs = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke<ExchangePairsResponse>(
          "fetch-exchange-pairs"
        );

        if (error) throw error;
        if (result?.success) {
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch exchange pairs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangePairs();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-4 glass">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-muted-foreground">Loading coverage...</span>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const topExchanges = data.exchanges
    .sort((a, b) => b.pairCount - a.pairCount)
    .slice(0, 8);

  return (
    <Card className="p-4 glass border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Exchange Coverage</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {data.exchangeCount} Exchanges
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {topExchanges.map((exchange) => (
            <div
              key={exchange.name}
              className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all"
            >
              <span className="text-xs font-medium text-foreground truncate">
                {exchange.name}
              </span>
              <Badge variant="outline" className="text-xs ml-2">
                {exchange.pairCount}
              </Badge>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Pairs</span>
            <span className="font-semibold text-primary">{data.totalPairs.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
