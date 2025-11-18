import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { MarketSnapshot, DataValidationSummary } from "../types/market";

// Ticker data for multiple symbols
export interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  isPositive: boolean;
  timestamp: number;
  unavailable?: boolean;
}

// Market metrics for a symbol
export interface MarketMetrics {
  fundingRate: number;
  openInterest: number;
  longShortRatio: number;
  liquidations24h: number;
  volume24h: number;
  timestamp: number;
}

interface MarketState {
  // Current symbol and timeframe
  symbol: string;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  
  // Snapshot and validation (existing)
  snapshot?: MarketSnapshot;
  validation?: DataValidationSummary;
  
  // Shared ticker data (for all ticker symbols)
  tickers: Record<string, TickerData>;
  
  // Market metrics (per symbol)
  metrics: Record<string, MarketMetrics>;
  
  // Loading states
  isLoading: boolean;
  loading: {
    tickers: boolean;
    metrics: boolean;
    snapshot: boolean;
  };
  
  error?: string;
  
  // Last fetch timestamps (for smart caching)
  lastFetch: {
    tickers: number;
    metrics: number;
  };
  
  // Actions
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: MarketState["timeframe"]) => void;
  setData: (payload: {
    snapshot?: MarketSnapshot;
    validation?: DataValidationSummary;
    error?: string;
    isLoading?: boolean;
  }) => void;
  
  // Centralized fetch actions
  fetchTickers: (symbols: string[]) => Promise<void>;
  fetchMetrics: (symbol: string) => Promise<void>;
  
  // Initialize store with polling
  initialize: () => void;
  cleanup: () => void;
}

let tickerInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

export const useMarketStore = create<MarketState>((set, get) => ({
  symbol: "BTCUSDT",
  timeframe: "1h",
  snapshot: undefined,
  validation: undefined,
  tickers: {},
  metrics: {},
  isLoading: false,
  loading: {
    tickers: false,
    metrics: false,
    snapshot: false,
  },
  error: undefined,
  lastFetch: {
    tickers: 0,
    metrics: 0,
  },
  
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setData: (payload) => set(payload),
  
  fetchTickers: async (symbols: string[]) => {
    const now = Date.now();
    const lastFetch = get().lastFetch.tickers;
    
    // Smart caching: Skip if fetched within last 60 seconds
    if (now - lastFetch < 60000) {
      console.log("⚡ Using cached ticker data");
      return;
    }
    
    set({ loading: { ...get().loading, tickers: true } });
    
    try {
      const fetchPromises = symbols.map(async (symbol) => {
        const [priceRes, histRes] = await Promise.all([
          supabase.functions.invoke("fetch-tatum-price", {
            body: { symbol },
          }),
          supabase.functions.invoke("fetch-historical-prices", {
            body: { symbol, limit: 2 },
          }),
        ]);
        
        // Handle unavailable symbols gracefully
        if (priceRes.data?.unavailable) {
          console.log(`⚠️ Price unavailable for ${symbol}: ${priceRes.data.reason}`);
          return {
            symbol,
            price: 0,
            change24h: 0,
            isPositive: false,
            timestamp: now,
            unavailable: true,
          };
        }
        
        const price = priceRes.data?.price || 0;
        const hist = histRes.data || [];
        const change24h = hist.length >= 2 ? ((price - hist[0].price) / hist[0].price) * 100 : 0;
        
        return {
          symbol,
          price,
          change24h,
          isPositive: change24h >= 0,
          timestamp: now,
        };
      });
      
      const results = await Promise.all(fetchPromises);
      const tickersMap: Record<string, TickerData> = {};
      
      results.forEach((ticker) => {
        tickersMap[ticker.symbol] = ticker;
      });
      
      set({
        tickers: tickersMap,
        loading: { ...get().loading, tickers: false },
        lastFetch: { ...get().lastFetch, tickers: now },
      });
      
      console.log("✅ Fetched tickers for", symbols.length, "symbols");
    } catch (error) {
      console.error("Error fetching tickers:", error);
      set({ loading: { ...get().loading, tickers: false } });
    }
  },
  
  fetchMetrics: async (symbol: string) => {
    const now = Date.now();
    const lastFetch = get().lastFetch.metrics;
    
    // Smart caching: Skip if fetched within last 120 seconds
    if (now - lastFetch < 120000) {
      console.log("⚡ Using cached metrics data");
      return;
    }
    
    set({ loading: { ...get().loading, metrics: true } });
    
    try {
      const [fundingRes, oiRes, lsRes, liqRes] = await Promise.all([
        supabase.functions.invoke("fetch-funding-rate", {
          body: { symbol },
        }),
        supabase.functions.invoke("fetch-open-interest", {
          body: { symbol },
        }),
        supabase.functions.invoke("fetch-long-short-ratio", {
          body: { symbol },
        }),
        supabase.functions.invoke("fetch-liquidations", {
          body: { symbol },
        }),
      ]);
      
      // Parse long/short ratio from API response
      let longShortRatio = 1; // Default to 1:1
      if (lsRes.data && typeof lsRes.data.long_percent === 'string' && lsRes.data.long_percent !== 'N/A') {
        const longPercent = parseFloat(lsRes.data.long_percent);
        const shortPercent = parseFloat(lsRes.data.short_percent);
        if (!isNaN(longPercent) && !isNaN(shortPercent) && shortPercent > 0) {
          longShortRatio = longPercent / shortPercent;
        }
      }
      
      // Parse funding rate
      const fundingRate = fundingRes.data?.current?.rateValue || fundingRes.data?.rate || 0;
      
      // Parse open interest
      const openInterest = oiRes.data?.total?.valueRaw || oiRes.data?.value || 0;
      
      // Helper to parse formatted numbers like "47.3M", "1.2B", "500K"
      const parseFormattedNumber = (str: string | number | undefined): number => {
        if (!str || str === 'N/A') return 0;
        if (typeof str === 'number') return str;
        
        const numStr = str.toString().trim().toUpperCase();
        const num = parseFloat(numStr);
        if (isNaN(num)) return 0;
        
        if (numStr.includes('B')) return num * 1e9;
        if (numStr.includes('M')) return num * 1e6;
        if (numStr.includes('K')) return num * 1e3;
        return num;
      };
      
      // Parse liquidations
      let liquidations24h = 0;
      if (liqRes.data?.last24h && liqRes.data.last24h.totalLongs !== 'N/A') {
        const longs = parseFormattedNumber(liqRes.data.last24h.totalLongs);
        const shorts = parseFormattedNumber(liqRes.data.last24h.totalShorts);
        liquidations24h = longs + shorts;
      }
      
      const metrics: MarketMetrics = {
        fundingRate,
        openInterest,
        longShortRatio,
        liquidations24h,
        volume24h: oiRes.data?.volume || 0,
        timestamp: now,
      };
      
      set({
        metrics: { ...get().metrics, [symbol]: metrics },
        loading: { ...get().loading, metrics: false },
        lastFetch: { ...get().lastFetch, metrics: now },
      });
      
      console.log("✅ Fetched metrics for", symbol, metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      set({ loading: { ...get().loading, metrics: false } });
    }
  },
  
  initialize: () => {
    const state = get();
    
    // Fetch initial data
    state.fetchTickers(["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT"]);
    state.fetchMetrics(state.symbol);
    
    // Set up polling intervals (120s for reduced API usage)
    tickerInterval = setInterval(() => {
      state.fetchTickers(["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT"]);
    }, 120000);
    
    metricsInterval = setInterval(() => {
      state.fetchMetrics(state.symbol);
    }, 120000);
    
    console.log("🚀 Market store initialized with 120s polling");
  },
  
  cleanup: () => {
    if (tickerInterval) clearInterval(tickerInterval);
    if (metricsInterval) clearInterval(metricsInterval);
    console.log("🧹 Market store cleaned up");
  },
}));
