import { create } from 'zustand';
import type { CoinglassData, MarketData, TradingData } from '@/types/market';
import { aggregateCoinglassData, getSymbolSummary, getTradingAnalysis } from '@/services/marketDataService';
import { startPriceLogger, fetchTatumPrice, fetchPriceOneMinuteAgo } from '@/api';

interface PriceState {
  currentPrice: number | null;
  priceOneMinuteAgo: number | null;
  lastUpdate: Date | null;
  error: string | null;
}

interface MarketStore {
  // State
  symbol: string;
  marketData: MarketData | null;
  coinglassData: CoinglassData | null;
  tradingData: TradingData | null;
  priceState: PriceState;
  loading: {
    market: boolean;
    coinglass: boolean;
    trading: boolean;
    price: boolean;
  };
  
  // Actions
  setSymbol: (symbol: string) => void;
  loadMarketData: () => Promise<void>;
  loadCoinglassData: () => Promise<void>;
  loadTradingData: () => Promise<void>;
  loadPriceData: () => Promise<void>;
  startPriceLogging: () => Promise<void>;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  // Initial state
  symbol: 'BTC',
  marketData: null,
  coinglassData: null,
  tradingData: null,
  priceState: {
    currentPrice: null,
    priceOneMinuteAgo: null,
    lastUpdate: null,
    error: null,
  },
  loading: {
    market: false,
    coinglass: false,
    trading: false,
    price: false,
  },

  // Set symbol and trigger data refresh
  setSymbol: (symbol: string) => {
    set({ symbol });
    get().loadMarketData();
    get().loadCoinglassData();
    get().loadTradingData();
    get().startPriceLogging();
  },

  // Load market overview data
  loadMarketData: async () => {
    const { symbol } = get();
    set((state) => ({ loading: { ...state.loading, market: true } }));
    
    try {
      const data = await getSymbolSummary(symbol);
      set({ marketData: data });
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, market: false } }));
    }
  },

  // Load all Coinglass metrics
  loadCoinglassData: async () => {
    const { symbol } = get();
    set((state) => ({ loading: { ...state.loading, coinglass: true } }));
    
    try {
      const data = await aggregateCoinglassData(symbol);
      set({ coinglassData: data });
    } catch (error) {
      console.error('Failed to load Coinglass data:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, coinglass: false } }));
    }
  },

  // Load trading analysis data
  loadTradingData: async () => {
    const { symbol } = get();
    set((state) => ({ loading: { ...state.loading, trading: true } }));
    
    try {
      const data = await getTradingAnalysis(symbol);
      set({ tradingData: data });
    } catch (error) {
      console.error('Failed to load trading data:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, trading: false } }));
    }
  },

  // Load current price and 1-minute ago price
  loadPriceData: async () => {
    const { symbol } = get();
    set((state) => ({ loading: { ...state.loading, price: true } }));
    
    try {
      const [currentPriceRes, priceOneMinAgo] = await Promise.all([
        fetchTatumPrice(symbol),
        fetchPriceOneMinuteAgo(symbol),
      ]);

      if (currentPriceRes.error || currentPriceRes.data?.unavailable) {
        set((state) => ({
          priceState: {
            ...state.priceState,
            error: 'Price data unavailable',
          },
        }));
        return;
      }

      set({
        priceState: {
          currentPrice: currentPriceRes.data?.price || null,
          priceOneMinuteAgo: priceOneMinAgo,
          lastUpdate: new Date(),
          error: null,
        },
      });
    } catch (error) {
      console.error('Failed to load price data:', error);
      set((state) => ({
        priceState: {
          ...state.priceState,
          error: 'Connection error',
        },
      }));
    } finally {
      set((state) => ({ loading: { ...state.loading, price: false } }));
    }
  },

  // Start price logging for the current symbol
  startPriceLogging: async () => {
    const { symbol } = get();
    try {
      await startPriceLogger(symbol);
    } catch (error) {
      console.error('Failed to start price logger:', error);
    }
  },
}));
