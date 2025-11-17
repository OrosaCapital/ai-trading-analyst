import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

interface LiquidationHeatmapProps {
  symbol: string;
}

interface LiquidationData {
  last24h: {
    totalLongs: string;
    totalShorts: string;
    ratio: string;
    majorEvents: Array<{
      time: string;
      amount: string;
      type: string;
      price: number;
    }>;
  };
  heatmap?: {
    levels: Array<{
      price: number;
      liquidity: string;
      type: string;
    }>;
  };
}

export const LiquidationHeatmap = ({ symbol }: LiquidationHeatmapProps) => {
  const [data, setData] = useState<LiquidationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: liqData, error } = await supabase.functions.invoke('fetch-liquidations', {
          body: { symbol }
        });

        if (error) throw error;
        setData(liqData);
      } catch (error) {
        console.error('Error fetching liquidation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Liquidations (24h)</h3>
      
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Long Liquidations</div>
          <div className="text-xl font-bold text-destructive">{data.last24h.totalLongs}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Short Liquidations</div>
          <div className="text-xl font-bold text-success">{data.last24h.totalShorts}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Ratio</div>
          <div className="text-xl font-bold">{data.last24h.ratio}</div>
        </div>
      </div>

      {/* Major Events */}
      {data.last24h.majorEvents && data.last24h.majorEvents.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Major Liquidation Events
          </h4>
          <div className="space-y-2">
            {data.last24h.majorEvents.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={event.type === 'LONG' ? 'destructive' : 'default'}>
                    {event.type}
                  </Badge>
                  <span className="text-sm">
                    <span className="font-semibold">{event.amount}</span> at ${event.price.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liquidation Heatmap Levels */}
      {data.heatmap && data.heatmap.levels && data.heatmap.levels.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Liquidation Clusters</h4>
          <div className="space-y-2">
            {data.heatmap.levels
              .sort((a, b) => b.price - a.price)
              .map((level, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">
                    ${level.price.toLocaleString()}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-secondary rounded overflow-hidden">
                      <div 
                        className={`absolute h-full ${
                          level.type === 'LONG' ? 'bg-destructive/30' : 'bg-success/30'
                        }`}
                        style={{ 
                          width: `${Math.min(100, parseInt(level.liquidity) / 2)}%` 
                        }}
                      />
                      <div className="absolute inset-0 flex items-center px-3">
                        <span className="text-xs font-medium">{level.liquidity}</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={level.type === 'LONG' ? 'destructive' : 'default'}
                    className="w-16 justify-center"
                  >
                    {level.type}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};
