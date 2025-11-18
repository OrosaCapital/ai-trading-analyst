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

  // Fetch prices for all symbols from database
  useEffect(() => {
    const fetchPrices = async () => {
      const prices = await Promise.all(
        TICKER_SYMBOLS.map(async (symbol) => {
          try {
            // Fetch current price from cache
            const { data: cacheData } = await supabase
              .from("tatum_price_cache")
              .select("price_data")
              .eq("symbol", symbol)
              .gt("expires_at", new Date().toISOString())
              .single();

            const currentPrice = (cacheData?.price_data as any)?.value || 0;

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
              .single();

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
    <div className="flex items-center gap-3 overflow-hidden">
      <div
        className={`flex items-center gap-3 transition-all duration-300 ${
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Symbol */}
        <div className="text-sm font-bold text-gray-100">
          {currentTicker.symbol.replace("USDT", "")}
          <span className="text-gray-500 text-xs ml-1">USDT</span>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-gray-700" />

        {/* Price */}
        <div className="text-sm font-semibold text-gray-100">
          ${currentTicker.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>

        {/* 24h Change */}
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
            currentTicker.isPositive
              ? "bg-green-500/20 text-green-500"
              : "bg-red-500/20 text-red-500"
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
      <div className="flex items-center gap-1 ml-2">
        {TICKER_SYMBOLS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 w-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "bg-emerald-500 w-3" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
