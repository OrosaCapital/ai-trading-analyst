import { callEdgeFunction } from './httpClient';
import type { 
  LongShortRatio, 
  FearGreedIndex, 
  Liquidations, 
  OpenInterest, 
  FundingRateList,
  TakerVolume,
  RSI,
  FuturesBasis 
} from '@/types/market';

export const fetchLongShortRatio = (symbol: string) => 
  callEdgeFunction<LongShortRatio>('fetch-long-short-ratio', { symbol });

export const fetchFearGreedIndex = () => 
  callEdgeFunction<FearGreedIndex>('fetch-fear-greed-index');

export const fetchLiquidations = (symbol: string) => 
  callEdgeFunction<Liquidations>('fetch-liquidations', { symbol });

export const fetchOpenInterest = (symbol: string) => 
  callEdgeFunction<OpenInterest>('fetch-open-interest', { symbol });

export const fetchFundingRateList = (symbol: string) => 
  callEdgeFunction<FundingRateList>('fetch-funding-rate-list', { symbol });

export const fetchTakerVolume = (symbol: string) => 
  callEdgeFunction<TakerVolume>('fetch-taker-volume', { symbol });

export const fetchRSI = (symbol: string) => 
  callEdgeFunction<RSI>('fetch-rsi', { symbol });

export const fetchFuturesBasis = (symbol: string) => 
  callEdgeFunction<FuturesBasis>('fetch-futures-basis', { symbol });
