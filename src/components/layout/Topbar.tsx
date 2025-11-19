import { useMarketStore } from "../../store/useMarketStore";
import { DataAccumulationBanner } from "../trading/DataAccumulationBanner";
import { TickerRibbon } from "../trading/TickerRibbon";

const timeframes: Array<"1m" | "5m" | "1h" | "4h" | "1d"> = ["1m", "5m", "1h", "4h", "1d"];

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
