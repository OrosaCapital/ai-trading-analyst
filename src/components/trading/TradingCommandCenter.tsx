import { useState } from "react";
import { Search } from "lucide-react";

interface TradingCommandCenterProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  timeframe: string;
  onTimeframeChange: (timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d") => void;
  currentPrice?: number;
}

export function TradingCommandCenter({
  symbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  currentPrice,
}: TradingCommandCenterProps) {
  const [searchValue, setSearchValue] = useState(symbol);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSymbolChange(searchValue);
    }
  };

  const timeframes: Array<"1m" | "5m" | "15m" | "1h"> = ["1m", "5m", "15m", "1h"];

  return (
    <div className="relative glass-panel border-b border-border/50 p-3 shadow-elevated">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left - Symbol Search */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Search Symbol"
              className="w-full pl-10 pr-4 py-2 bg-input/50 border border-border/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Center - Current Price Display */}
        {currentPrice && (
          <div className="flex items-center gap-3 px-4 py-1.5 glass rounded-lg border border-primary/20">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">Current Price</div>
              <div className="text-xl font-bold text-primary glow-primary">
                ${currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right - Timeframe Selector */}
        <div className="flex items-center gap-1.5 p-1 glass rounded-lg">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                tf === timeframe
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] scale-105"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

