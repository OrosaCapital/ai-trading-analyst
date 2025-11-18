import { useMarketStore } from "../../store/useMarketStore";
import { DataAccumulationBanner } from "../trading/DataAccumulationBanner";
import { TickerRibbon } from "../trading/TickerRibbon";

const timeframes: Array<"1m" | "5m" | "15m" | "1h" | "4h" | "1d"> = ["1m", "5m", "15m", "1h", "4h", "1d"];

interface TopbarProps {
  showProgress?: boolean;
  minutesCollected?: number;
  minutesRequired?: number;
}

export function Topbar({ showProgress, minutesCollected = 0, minutesRequired = 15 }: TopbarProps) {
  const { timeframe, setTimeframe } = useMarketStore();

  return (
    <header className="glass-panel border-b border-border/50 shadow-elevated">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Ticker Ribbon */}
        <TickerRibbon />
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 p-1 glass rounded-lg">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                tf === timeframe 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)] scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      {/* Progress Banner */}
      {showProgress && (
        <div className="px-4 pb-3 animate-fade-in">
          <DataAccumulationBanner 
            symbol="current"
            minutesCollected={minutesCollected}
            minutesRequired={minutesRequired}
          />
        </div>
      )}
    </header>
  );
}
