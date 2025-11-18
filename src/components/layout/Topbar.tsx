import { useMarketStore } from "../../store/useMarketStore";

const timeframes: Array<"1m" | "5m" | "15m" | "1h" | "4h" | "1d"> = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function Topbar() {
  const { symbol, timeframe, setTimeframe } = useMarketStore();

  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-black/80 px-4 py-3">
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
    </header>
  );
}
