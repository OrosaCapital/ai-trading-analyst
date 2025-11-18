import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TickerSymbol {
  symbol: string;
  price: number;
  change24h: number;
  isPositive: boolean;
}

const TICKER_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];

export function TickerRibbon() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickers, setTickers] = useState<TickerSymbol[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch prices for all symbols and ensure they're being logged
  useEffect(() => {
    const fetchPrices = async () => {
      const prices = await Promise.all(
        TICKER_SYMBOLS.map(async (symbol) => {
          try {
            // First, trigger price logger to ensure data is being collected
            const { data: loggerData } = await supabase.functions.invoke('tatum-price-logger', {
              body: { symbol }
            });

            const currentPrice = loggerData?.price || 0;

            // Fetch price from 24h ago from logs
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: historicalData } = await supabase
              .from("tatum_price_logs")
              .select("price")
              .eq("symbol", symbol)
              .eq("interval", "1m")
              .lte("timestamp", twentyFourHoursAgo)
              .order("timestamp", { ascending: false })
              .limit(1)
              .maybeSingle();

            const pastPrice = historicalData?.price || currentPrice;
            const change24h = pastPrice > 0 ? ((currentPrice - pastPrice) / pastPrice) * 100 : 0;

            return {
              symbol,
              price: currentPrice,
              change24h,
              isPositive: change24h >= 0,
            };
          } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            return {
              symbol,
              price: 0,
              change24h: 0,
              isPositive: true,
            };
          }
        })
      );

      setTickers(prices);
    };

    fetchPrices();
    // Update prices every 60s
    const interval = setInterval(fetchPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  // Rotate ticker every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TICKER_SYMBOLS.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentTicker = tickers[currentIndex];

  if (!currentTicker) {
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

        {/* 24h Change */}
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border backdrop-blur-sm ${
            currentTicker.isPositive
              ? "bg-chart-green/10 text-chart-green border-chart-green/30 shadow-[0_0_10px_hsl(var(--chart-green)/0.2)]"
              : "bg-chart-red/10 text-chart-red border-chart-red/30 shadow-[0_0_10px_hsl(var(--chart-red)/0.2)]"
          }`}
        >
          {currentTicker.isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {currentTicker.isPositive ? "+" : ""}
          {currentTicker.change24h.toFixed(2)}%
        </div>
      </div>

      {/* Ticker Dots */}
      <div className="flex items-center gap-1.5 ml-2">
        {TICKER_SYMBOLS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex 
                ? "bg-primary w-4 shadow-[0_0_8px_hsl(var(--primary)/0.6)]" 
                : "bg-muted w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
