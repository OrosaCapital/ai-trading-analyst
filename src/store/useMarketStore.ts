import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { MarketSnapshot, DataValidationSummary } from "../types/market";
import type { CMCQuote, CMCGlobalMetrics, CMCTrendingCoin } from "../types/cmc";

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
  
  // CoinMarketCap data
  cmcQuotes: Record<string, CMCQuote>;
  cmcGlobal?: CMCGlobalMetrics;
  cmcTrending: CMCTrendingCoin[];
  
  // Loading states
  isLoading: boolean;
  loading: {
    tickers: boolean;
    metrics: boolean;
    snapshot: boolean;
    cmcQuotes: boolean;
    cmcGlobal: boolean;
    cmcTrending: boolean;
  };
  
  error?: string;
  
  // Last fetch timestamps (for smart caching)
  lastFetch: {
    tickers: number;
    metrics: number;
    cmcQuotes: number;
    cmcGlobal: number;
    cmcTrending: number;
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
  fetchCMCQuotes: (symbols: string[]) => Promise<void>;
  fetchCMCGlobal: () => Promise<void>;
  fetchCMCTrending: (limit?: number) => Promise<void>;
  
  // Initialize store with polling
  initialize: () => void;
  cleanup: () => void;
}

let tickerInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;
let cmcInterval: NodeJS.Timeout | null = null;

export const useMarketStore = create<MarketState>((set, get) => ({
  symbol: "BTCUSDT",
  timeframe: "1h",
  snapshot: undefined,
  validation: undefined,
  tickers: {},
  metrics: {},
  cmcQuotes: {},
  cmcGlobal: undefined,
  cmcTrending: [],
  isLoading: false,
  loading: {
    tickers: false,
    metrics: false,
    snapshot: false,
    cmcQuotes: false,
    cmcGlobal: false,
    cmcTrending: false,
  },
  error: undefined,
  lastFetch: {
    tickers: 0,
    metrics: 0,
    cmcQuotes: 0,
    cmcGlobal: 0,
    cmcTrending: 0,
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
    
    if (now - lastFetch < 120000) {
      console.log("⚡ Using cached metrics data");
      return;
    }
    
    set({ loading: { ...get().loading, metrics: true } });
    
    const { generateLocalMarketMetrics } = await import("@/lib/marketMetricsGenerator");
    const metrics = generateLocalMarketMetrics(symbol);
    
    set({
      metrics: { ...get().metrics, [symbol]: metrics },
      loading: { ...get().loading, metrics: false },
      lastFetch: { ...get().lastFetch, metrics: now },
    });
    
    console.log("✅ Local market metrics generated:", symbol);
  },
  
  fetchCMCQuotes: async (symbols: string[]) => {
    const now = Date.now();
    const lastFetch = get().lastFetch.cmcQuotes;
    
    // Smart caching: Skip if fetched within last 5 minutes (300 seconds)
    if (now - lastFetch < 300000) {
      console.log("⚡ Using cached CMC quotes data");
      return;
    }
    
    set({ loading: { ...get().loading, cmcQuotes: true } });
    
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cmc-quotes", {
        body: { symbols },
      });
      
      if (error || !data) {
        console.error("Error fetching CMC quotes:", error);
        set({ loading: { ...get().loading, cmcQuotes: false } });
        return;
      }
      
      // Handle single or multiple quotes
      const quotesArray = Array.isArray(data) ? data : [data];
      const cmcQuotesMap: Record<string, CMCQuote> = {};
      
      quotesArray.forEach((quote: CMCQuote) => {
        cmcQuotesMap[quote.symbol] = quote;
      });
      
      set({
        cmcQuotes: { ...get().cmcQuotes, ...cmcQuotesMap },
        loading: { ...get().loading, cmcQuotes: false },
        lastFetch: { ...get().lastFetch, cmcQuotes: now },
      });
      
      console.log("✅ Fetched CMC quotes for", symbols.length, "symbols");
    } catch (error) {
      console.error("Error fetching CMC quotes:", error);
      set({ loading: { ...get().loading, cmcQuotes: false } });
    }
  },
  
  fetchCMCGlobal: async () => {
    const now = Date.now();
    const lastFetch = get().lastFetch.cmcGlobal;
    
    // Smart caching: Skip if fetched within last 5 minutes
    if (now - lastFetch < 300000) {
      console.log("⚡ Using cached CMC global data");
      return;
    }
    
    set({ loading: { ...get().loading, cmcGlobal: true } });
    
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cmc-global", {
        body: {},
      });
      
      if (error || !data) {
        console.error("Error fetching CMC global:", error);
        set({ loading: { ...get().loading, cmcGlobal: false } });
        return;
      }
      
      set({
        cmcGlobal: data,
        loading: { ...get().loading, cmcGlobal: false },
        lastFetch: { ...get().lastFetch, cmcGlobal: now },
      });
      
      console.log("✅ Fetched CMC global metrics");
    } catch (error) {
      console.error("Error fetching CMC global:", error);
      set({ loading: { ...get().loading, cmcGlobal: false } });
    }
  },
  
  fetchCMCTrending: async (limit = 10) => {
    const now = Date.now();
    const lastFetch = get().lastFetch.cmcTrending;
    
    // Smart caching: Skip if fetched within last 5 minutes
    if (now - lastFetch < 300000) {
      console.log("⚡ Using cached CMC trending data");
      return;
    }
    
    set({ loading: { ...get().loading, cmcTrending: true } });
    
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cmc-trending", {
        body: { limit },
      });
      
      if (error || !data) {
        console.error("Error fetching CMC trending:", error);
        set({ loading: { ...get().loading, cmcTrending: false } });
        return;
      }
      
      set({
        cmcTrending: data,
        loading: { ...get().loading, cmcTrending: false },
        lastFetch: { ...get().lastFetch, cmcTrending: now },
      });
      
      console.log("✅ Fetched CMC trending coins");
    } catch (error) {
      console.error("Error fetching CMC trending:", error);
      set({ loading: { ...get().loading, cmcTrending: false } });
    }
  },
  
  initialize: () => {
    const state = get();
    
    // Fetch initial data
    state.fetchTickers(["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT"]);
    state.fetchMetrics(state.symbol);
    
    // Fetch initial CMC data
    state.fetchCMCQuotes(["BTC", "ETH", "BNB", "SOL", "ADA", "XRP"]);
    state.fetchCMCGlobal();
    state.fetchCMCTrending(10);
    
    // Removed all polling - data updates via WebSocket
    // Tickers updated in real-time via websocket-price-stream
    // CMC data cached on backend with 5-minute TTL
    
    console.log("🚀 Market store initialized (no polling - WebSocket only)");
  },
  
  cleanup: () => {
    if (tickerInterval) clearInterval(tickerInterval);
    if (metricsInterval) clearInterval(metricsInterval);
    if (cmcInterval) clearInterval(cmcInterval);
    console.log("🧹 Market store cleaned up");
  },
}));
