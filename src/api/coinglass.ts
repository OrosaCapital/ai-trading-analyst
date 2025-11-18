import { httpClient } from "./httpClient";
import { env } from "../config/env";
import type { ApiResult } from "../types/api";
import type { Candle, SymbolTimeframe } from "../types/market";

interface CoinglassKlineResponse {
  data: {
    symbol: string;
    list: [number, number, number, number, number, number][];
  };
}

export async function getCoinglassKlines(params: SymbolTimeframe): Promise<ApiResult<Candle[]>> {
  const { symbol, timeframe } = params;

  const url = `https://open-api.coinglass.com/public/v2/kline?symbol=${encodeURIComponent(
    symbol,
  )}&interval=${encodeURIComponent(timeframe)}`;

  const result = await httpClient.get<CoinglassKlineResponse>(url, {
    headers: {
      coinglassSecret: env.coinglassApiKey ?? "",
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const candles: Candle[] = result.data.data.list.map((row) => ({
    timestamp: row[0],
    open: row[1],
    high: row[2],
    low: row[3],
    close: row[4],
    volume: row[5],
  }));

  return { ok: true, data: candles };
}
