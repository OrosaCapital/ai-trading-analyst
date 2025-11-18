import { CoinglassApi, TatumApi, NinjasApi } from "../api";
import type { MarketSnapshot, SymbolTimeframe, DataValidationSummary } from "../types/market";
import type { ApiResult } from "../types/api";

export async function fetchMarketSnapshot(params: SymbolTimeframe): Promise<ApiResult<MarketSnapshot>> {
  const candlesRes = await CoinglassApi.getCoinglassKlines(params);

  if (!candlesRes.ok) {
    return { ok: false, error: candlesRes.error };
  }

  // Placeholder indicators – extend later with real calc.
  const latest = candlesRes.data.at(-1);

  const snapshot: MarketSnapshot = {
    symbol: params.symbol,
    timeframe: params.timeframe,
    candles: candlesRes.data,
    indicators: latest
      ? {
          emaFast: latest.close,
          emaSlow: latest.close,
          rsi: 50,
          macd: 0,
          signal: 0,
        }
      : undefined,
  };

  return { ok: true, data: snapshot };
}

export async function buildDataValidation(params: SymbolTimeframe): Promise<DataValidationSummary> {
  const [candlesRes, spotRes, newsRes] = await Promise.all([
    CoinglassApi.getCoinglassKlines(params),
    TatumApi.getTatumSpotPrice(params.symbol),
    NinjasApi.getSymbolNews(params.symbol),
  ]);

  const items = [
    {
      key: "coinglass_candles",
      received: candlesRes.ok ? candlesRes.data.length : candlesRes.error,
      valid: candlesRes.ok && candlesRes.data.length > 0,
      notes: candlesRes.ok ? `Received ${candlesRes.data.length} candles` : candlesRes.error.message,
    },
    {
      key: "tatum_spot",
      received: spotRes.ok ? spotRes.data : spotRes.error,
      valid: spotRes.ok && typeof spotRes.data === "number",
      notes: spotRes.ok ? "Spot price OK" : spotRes.error.message,
    },
    {
      key: "api_ninjas_news",
      received: newsRes.ok ? newsRes.data.length : newsRes.error,
      valid: newsRes.ok,
      notes: newsRes.ok ? `Received ${newsRes.data.length} news items` : newsRes.error.message,
    },
  ];

  const isReadyForDecision = items.every((i) => i.valid);

  return {
    symbol: params.symbol,
    timeframe: params.timeframe,
    items,
    isReadyForDecision,
  };
}
