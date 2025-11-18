import {
  fetchLongShortRatio,
  fetchFearGreedIndex,
  fetchLiquidations,
  fetchOpenInterest,
  fetchFundingRateList,
  fetchTakerVolume,
  fetchRSI,
  fetchFuturesBasis,
  fetchMarketOverview,
  fetchTradingData,
} from '@/api';
import type { CoinglassData, MarketData, TradingData } from '@/types/market';

export async function aggregateCoinglassData(symbol: string): Promise<CoinglassData> {
  const [
    lsRatio,
    fearGreed,
    liq,
    oi,
    fundingList,
    takerVol,
    rsiData,
    basis
  ] = await Promise.all([
    fetchLongShortRatio(symbol),
    fetchFearGreedIndex(),
    fetchLiquidations(symbol),
    fetchOpenInterest(symbol),
    fetchFundingRateList(symbol),
    fetchTakerVolume(symbol),
    fetchRSI(symbol),
    fetchFuturesBasis(symbol),
  ]);

  return {
    longShortRatio: lsRatio.data,
    fearGreedIndex: fearGreed.data,
    liquidations: liq.data,
    openInterest: oi.data,
    fundingRateList: fundingList.data,
    takerVolume: takerVol.data,
    rsi: rsiData.data,
    futuresBasis: basis.data,
  };
}

export async function getSymbolSummary(symbol: string): Promise<MarketData | null> {
  const { data, error } = await fetchMarketOverview(symbol);
  if (error || !data) return null;
  return data;
}

export async function getTradingAnalysis(symbol: string): Promise<TradingData | null> {
  const { data, error } = await fetchTradingData(symbol);
  if (error || !data) return null;
  return data;
}
