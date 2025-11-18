import { create } from "zustand";
import type { MarketSnapshot, DataValidationSummary } from "../types/market";

interface MarketState {
  symbol: string;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  snapshot?: MarketSnapshot;
  validation?: DataValidationSummary;
  coinglassData?: any;
  isLoading: boolean;
  error?: string;
  loading: {
    coinglass: boolean;
  };
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: MarketState["timeframe"]) => void;
  setData: (payload: {
    snapshot?: MarketSnapshot;
    validation?: DataValidationSummary;
    error?: string;
    isLoading?: boolean;
  }) => void;
  loadCoinglassData: () => Promise<void>;
}

export const useMarketStore = create<MarketState>((set) => ({
  symbol: "BTCUSDT",
  timeframe: "1h",
  snapshot: undefined,
  validation: undefined,
  coinglassData: undefined,
  isLoading: false,
  error: undefined,
  loading: {
    coinglass: false,
  },
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setData: (payload) => set(payload),
  loadCoinglassData: async () => {
    set({ loading: { coinglass: true } });
    // Placeholder - implement later
    set({ loading: { coinglass: false } });
  },
}));
