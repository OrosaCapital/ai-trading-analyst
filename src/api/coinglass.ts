import { httpClient } from "./httpClient";
import { env } from "../config/env";
import type { ApiResult } from "../types/api";
import type { Candle, SymbolTimeframe } from "../types/market";

// Map your timeframe selectors to Coinglass intervals
const INTERVAL_MAP: Record<SymbolTimeframe["timeframe"], string> = {
  "1m": "4h", // Not allowed → fallback
  "5m": "4h", // Not allowed → fallback
  "15m": "4h", // Not allowed → fallback
  "1h": "4h", // Not allowed → fallback
  "4h": "4h",
  "1d": "1d",
};

interface CoinglassOhlcResponse {
  code: number;
  msg: string;
  data: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export async function getCoinglassKlines(params: SymbolTimeframe): Promise<ApiResult<Candle[]>> {
  const { symbol, timeframe } = params;

  // Force supported interval (Hobbyist limitation)
  const interval = INTERVAL_MAP[timeframe] ?? "4h";

  const url =
    `https://open-api-v4.coinglass.com/api/price/ohlc-history` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${interval}` +
    `&exchange=binance`;

  const response = await httpClient.get<CoinglassOhlcResponse>(url, {
    headers: {
      "CG-API-KEY": env.coinglassApiKey ?? "",
    },
  });

  if (!response.ok) return response;

  const rows = response.data.data;

  const candles: Candle[] = rows.map((row) => ({
    timestamp: row.timestamp,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }));

  return { ok: true, data: candles };
}
