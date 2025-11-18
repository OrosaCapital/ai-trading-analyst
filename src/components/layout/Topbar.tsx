import { useMarketStore } from "../../store/useMarketStore";
import { DataAccumulationBanner } from "../trading/DataAccumulationBanner";

const timeframes: Array<"1m" | "5m" | "15m" | "1h" | "4h" | "1d"> = ["1m", "5m", "15m", "1h", "4h", "1d"];

interface TopbarProps {
  showProgress?: boolean;
  minutesCollected?: number;
  minutesRequired?: number;
}

export function Topbar({ showProgress, minutesCollected = 0, minutesRequired = 15 }: TopbarProps) {
  const { symbol, timeframe, setTimeframe } = useMarketStore();

  return (
    <header className="border-b border-gray-800 bg-black/80">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold text-gray-100">
          {symbol} &nbsp;·&nbsp; {timeframe.toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-2 py-1 text-xs ${
                tf === timeframe ? "bg-emerald-500 text-black" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      {/* Progress Banner */}
      {showProgress && (
        <div className="px-4 pb-3">
          <DataAccumulationBanner 
            symbol={symbol}
            minutesCollected={minutesCollected}
            minutesRequired={minutesRequired}
          />
        </div>
      )}
    </header>
  );
}
