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
    <header className="border-b border-gray-800 bg-black/80">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Ticker Ribbon */}
        <TickerRibbon />
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-2 py-1 text-xs transition-all duration-200 ${
                tf === timeframe 
                  ? "bg-emerald-500 text-black font-semibold scale-105" 
                  : "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
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
