export interface Candle { timestamp: number; open: number; high: number; low: number; close: number; volume?: number; }
export interface PriceLog { symbol: string; price: number; timestamp: number; }
export interface TradingSignal { symbol: string; signal: string; confidence: number; }
