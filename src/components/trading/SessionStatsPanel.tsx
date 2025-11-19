interface SessionStats {
  sessionChangePct: number | null;
  high: number | null;
  low: number | null;
  rangePct: number | null;
  direction: "up" | "down" | "flat" | null;
}

interface SessionStatsPanelProps {
  stats: SessionStats;
  symbol: string;
}

export function SessionStatsPanel({ stats, symbol }: SessionStatsPanelProps) {
  const changeIsPositive = stats.sessionChangePct !== null && stats.sessionChangePct > 0.01;
  const changeIsNegative = stats.sessionChangePct !== null && stats.sessionChangePct < -0.01;
  const hasRange = stats.high !== null && stats.low !== null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/95 via-card to-card/90 backdrop-blur-sm shadow-xl">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-pulse opacity-50" />
      
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {/* Symbol with icon */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">Symbol</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-primary tracking-tight">{symbol}</span>
          </div>
        </div>

        {/* Session Move with trend indicator */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            {changeIsPositive && (
              <div className="w-2 h-2 rounded-full bg-chart-green animate-pulse shadow-lg shadow-chart-green/50" />
            )}
            {changeIsNegative && (
              <div className="w-2 h-2 rounded-full bg-chart-red animate-pulse shadow-lg shadow-chart-red/50" />
            )}
            {!changeIsPositive && !changeIsNegative && (
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            )}
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">
              Session Move
            </span>
          </div>
          <div className="flex flex-col">
            <span
              className={`text-xl font-bold tracking-tight ${
                changeIsPositive ? "text-chart-green" : changeIsNegative ? "text-chart-red" : "text-muted-foreground"
              }`}
            >
              {stats.sessionChangePct !== null
                ? `${stats.sessionChangePct > 0 ? "+" : ""}${stats.sessionChangePct.toFixed(2)}%`
                : "—"}
            </span>
          </div>
          {/* Mini trend indicator bar */}
          {stats.sessionChangePct !== null && Math.abs(stats.sessionChangePct) > 0.01 && (
            <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  changeIsPositive ? "bg-gradient-to-r from-chart-green to-chart-green/50" : "bg-gradient-to-r from-chart-red to-chart-red/50"
                }`}
                style={{ 
                  width: `${Math.min(Math.abs(stats.sessionChangePct) * 10, 100)}%` 
                }}
              />
            </div>
          )}
        </div>

        {/* Session High */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-green/60" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">High</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            {stats.high !== null ? `$${stats.high.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </span>
        </div>

        {/* Session Low */}
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-red/60" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70">Low</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            {stats.low !== null ? `$${stats.low.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </span>
        </div>
      </div>

      {/* Price Range Visualization Bar */}
      {hasRange && (
        <div className="relative px-6 pb-4">
          <div className="h-2 w-full bg-gradient-to-r from-chart-red/20 via-muted/20 to-chart-green/20 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-3 bg-primary rounded-full shadow-lg shadow-primary/50 animate-pulse" 
                   style={{ 
                     marginLeft: `${stats.sessionChangePct !== null ? (50 + (stats.sessionChangePct * 2)) : 50}%` 
                   }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { SessionStats };
