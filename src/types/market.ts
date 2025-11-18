export interface SymbolTimeframe {
  symbol: string; // e.g. "BTCUSDT"
  baseAsset?: string; // e.g. "BTC"
  quoteAsset?: string; // e.g. "USDT"
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
}

export interface Candle {
  timestamp: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSet {
  emaFast?: number;
  emaSlow?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
}

export interface MarketSnapshot {
  symbol: string;
  timeframe: SymbolTimeframe["timeframe"];
  candles: Candle[];
  indicators?: IndicatorSet;
}

export interface DataValidationEntry {
  key: string;
  received: unknown;
  valid: boolean;
  notes?: string;
  responseTime?: number;
  endpoint?: string;
  plan?: string;
  rateLimit?: string;
  credits?: string;
}

export interface DataValidationSummary {
  symbol: string;
  timeframe: string;
  items: DataValidationEntry[];
  isReadyForDecision: boolean;
}
