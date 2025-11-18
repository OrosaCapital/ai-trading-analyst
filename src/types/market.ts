export interface AISignal {
  decision: 'LONG' | 'SHORT' | 'NO TRADE';
  confidence: number;
  summary: {
    trend: string;
    volume: string;
    liquidity: string;
    coinglass: string;
    entryTrigger: string;
  };
  action: {
    entry?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    reason?: string | null;
  };
}

export interface TradingData {
  status: 'accumulating' | 'ready';
  message?: string;
  progress?: number;
  aiSignal?: AISignal;
  priceData?: any;
  emas?: any;
  coinglass?: any;
  liquiditySweep?: any;
  currentPrice?: number;
}

export interface LongShortRatio {
  symbol: string;
  longRatio: number;
  shortRatio: number;
  sentiment: string;
  timestamp: number;
}

export interface FearGreedIndex {
  value: number;
  valueClassification: string;
  timestamp: number;
}

export interface Liquidations {
  symbol: string;
  longLiquidations: number;
  shortLiquidations: number;
  totalLiquidations: number;
  timestamp: number;
}

export interface OpenInterest {
  symbol: string;
  openInterest: number;
  change24h: number;
  timestamp: number;
}

export interface FundingRateList {
  symbol: string;
  rates: Array<{
    exchange: string;
    rate: number;
  }>;
  averageRate: number;
  timestamp: number;
}

export interface TakerVolume {
  symbol: string;
  buyRatio: number;
  sellRatio: number;
  sentiment: string;
  timestamp: number;
}

export interface RSI {
  symbol: string;
  rsi14: number;
  signal: string;
  timestamp: number;
}

export interface FuturesBasis {
  symbol: string;
  basis: number;
  basisPercentage: number;
  signal: string;
  timestamp: number;
}

export interface MarketData {
  marketCap?: number;
  volume24h?: number;
  percentChange24h?: number;
  percentChange1h?: number;
  price?: number;
}

export interface CoinglassData {
  longShortRatio: LongShortRatio | null;
  fearGreedIndex: FearGreedIndex | null;
  liquidations: Liquidations | null;
  openInterest: OpenInterest | null;
  fundingRateList: FundingRateList | null;
  takerVolume: TakerVolume | null;
  rsi: RSI | null;
  futuresBasis: FuturesBasis | null;
}
