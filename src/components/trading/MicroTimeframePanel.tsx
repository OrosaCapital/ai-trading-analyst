import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

interface MicroTimeframePanelProps {
  candles1m: Candle[];
  candles15m: Candle[];
  symbol?: string;
}

export function MicroTimeframePanel({ candles1m, candles15m, symbol = "BTCUSDT" }: MicroTimeframePanelProps) {
  // Fetch latest funding rate from database
  const { data: fundingData } = useQuery({
    queryKey: ['funding-rate', symbol],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_funding_rates')
        .select('rate, timestamp')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (!candles1m.length) {
    return (
      <div className="flex flex-col gap-3 p-6 rounded-xl bg-gradient-to-br from-card via-card to-card/95 border border-border/40 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Initializing price stream
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const last1m = candles1m[candles1m.length - 1];
  const prev1m = candles1m[candles1m.length - 2] ?? last1m;
  const microChange = ((last1m.close - prev1m.close) / prev1m.close) * 100;

  const last15m = candles15m[candles15m.length - 1] ?? last1m;
  const body = last15m.close - last15m.open;
  const wick = last15m.high - last15m.low;
  const bodyRatio = wick ? Math.abs(body / wick) : 0;

  // Calculate volume momentum (last 3 vs previous 3 candles)
  const recentVolume = candles1m.slice(-3).reduce((sum, c) => sum + c.volume, 0) / 3;
  const priorVolume = candles1m.slice(-6, -3).reduce((sum, c) => sum + c.volume, 0) / 3;
  const volumeMomentum = priorVolume ? ((recentVolume - priorVolume) / priorVolume) * 100 : 0;

  // Calculate short-term momentum (last 5 candles)
  const momentum5 = candles1m.length >= 5 
    ? ((last1m.close - candles1m[candles1m.length - 5].close) / candles1m[candles1m.length - 5].close) * 100
    : 0;

  // Funding rate analysis
  const fundingRate = fundingData?.rate ? parseFloat(fundingData.rate.toString()) : null;
  const fundingBias = fundingRate 
    ? fundingRate > 0.01 ? "Long squeeze risk" 
    : fundingRate < -0.01 ? "Short squeeze risk"
    : "Neutral"
    : "Loading...";

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br from-card via-card to-card/95 border border-border/40 hover:border-border/60 transition-all duration-300 shadow-lg hover:shadow-xl">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Market Microstructure</span>
        <span className="text-[10px] text-muted-foreground/70 font-medium">Live Tape</span>
      </div>

      <MiniRow
        label="5-Candle Momentum"
        value={`${momentum5 >= 0 ? '+' : ''}${momentum5.toFixed(2)}%`}
        hint={Math.abs(momentum5) > 0.3 ? "Strong trend" : "Range-bound"}
        positive={momentum5 > 0.3}
        negative={momentum5 < -0.3}
      />
      
      <MiniRow
        label="Volume Momentum"
        value={`${volumeMomentum >= 0 ? '+' : ''}${volumeMomentum.toFixed(0)}%`}
        hint={volumeMomentum > 50 ? "Surging" : volumeMomentum < -30 ? "Drying up" : "Steady"}
        positive={volumeMomentum > 50}
        negative={volumeMomentum < -30}
      />

      <MiniRow
        label="Funding Rate"
        value={fundingRate ? `${(fundingRate * 100).toFixed(3)}%` : "N/A"}
        hint={fundingBias}
        positive={fundingRate !== null && fundingRate < -0.01}
        negative={fundingRate !== null && fundingRate > 0.01}
      />

      <MiniRow
        label="15m Conviction"
        value={`${(bodyRatio * 100).toFixed(0)}%`}
        hint={bodyRatio > 0.7 ? "Decisive" : bodyRatio > 0.3 ? "Moderate" : "Choppy"}
        positive={bodyRatio > 0.7}
      />
    </div>
  );
}

function MiniRow({
  label,
  value,
  hint,
  positive,
  negative,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex flex-col border-b border-border/30 pb-2.5 last:border-b-0 last:pb-0 transition-colors hover:border-border/50">
      <div className="flex justify-between items-center mb-1">
        <span className="text-muted-foreground text-[11px] font-semibold">{label}</span>
        <span
          className={`text-sm font-bold transition-colors ${
            positive ? "text-chart-green" : negative ? "text-chart-red" : "text-foreground"
          }`}
        >
          {value}
        </span>
      </div>
      {hint && <span className="text-[10px] text-muted-foreground/80 font-medium">{hint}</span>}
    </div>
  );
}
