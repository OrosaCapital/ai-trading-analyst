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
}

export function MicroTimeframePanel({ candles1m, candles15m }: MicroTimeframePanelProps) {
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

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br from-card via-card to-card/95 border border-border/40 hover:border-border/60 transition-all duration-300 shadow-lg hover:shadow-xl">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Intraday Tape</span>
        <span className="text-[10px] text-muted-foreground/70 font-medium">1m / 15m</span>
      </div>

      <MiniRow
        label="1m Pulse"
        value={`${microChange >= 0 ? '+' : ''}${microChange.toFixed(2)}%`}
        hint={microChange > 0.1 ? "Bid lifting" : microChange < -0.1 ? "Selling pressure" : "Consolidating"}
        positive={microChange > 0.1}
        negative={microChange < -0.1}
      />
      <MiniRow
        label="15m Body Ratio"
        value={`${(bodyRatio * 100).toFixed(0)}%`}
        hint={bodyRatio > 0.7 ? "Strong conviction" : bodyRatio > 0.3 ? "Balanced" : "Indecision"}
        positive={bodyRatio > 0.7}
      />
      <MiniRow 
        label="1m Volume" 
        value={last1m.volume >= 1000 ? `${(last1m.volume / 1000).toFixed(1)}K` : last1m.volume.toFixed(0)} 
        hint="Last candle" 
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
