import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";

const TICKER_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT"];

export function TickerRibbon() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { tickers, loading, initialize, cleanup } = useMarketStore();

  // Initialize store on mount
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  // Rotate through tickers every 3 seconds
  useEffect(() => {
    // Filter to only available tickers
    const availableSymbols = TICKER_SYMBOLS.filter(sym => 
      tickers[sym] && !tickers[sym].unavailable
    );
    
    if (availableSymbols.length === 0) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        // Ensure we only cycle through available symbols
        setCurrentIndex((prev) => {
          const nextIdx = (prev + 1) % availableSymbols.length;
          // Map back to TICKER_SYMBOLS index
          return TICKER_SYMBOLS.indexOf(availableSymbols[nextIdx]);
        });
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [tickers]);

  const currentSymbol = TICKER_SYMBOLS[currentIndex];
  const currentTicker = tickers[currentSymbol];
  
  // Skip if unavailable
  if (currentTicker?.unavailable) {
    return (
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
        <div>{currentSymbol.replace("USDT", "")} - Unavailable</div>
      </div>
    );
  }

  if (!currentTicker || loading.tickers) {
    return (
      <div className="flex items-center gap-3 text-sm font-semibold">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 overflow-hidden px-3 py-1 glass rounded-lg">
      <div
        className={`flex items-center gap-3 transition-all duration-300 ${
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Symbol */}
        <div className="text-sm font-bold text-foreground">
          {currentTicker.symbol.replace("USDT", "")}
          <span className="text-muted-foreground text-xs ml-1">USDT</span>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-border" />

        {/* Price */}
        <div className="text-sm font-semibold text-primary">
          ${currentTicker.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-border" />

        {/* 24h Change */}
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            currentTicker.isPositive ? "text-chart-green" : "text-chart-red"
          }`}
        >
          {currentTicker.isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {Math.abs(currentTicker.change24h).toFixed(2)}%
        </div>

        {/* Indicator dots */}
        <div className="flex gap-1.5 ml-4">
          {TICKER_SYMBOLS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "bg-primary w-4"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
