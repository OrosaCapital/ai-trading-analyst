import { httpClient } from "./httpClient";
import { env } from "../config/env";
import type { ApiResult } from "../types/api";

interface TatumPriceResponse {
  symbol: string;
  price: string;
}

export async function getTatumSpotPrice(symbol: string): Promise<ApiResult<number>> {
  const url = `https://api.tatum.io/v3/market/value/${encodeURIComponent(symbol)}`;

  const result = await httpClient.get<TatumPriceResponse>(url, {
    headers: {
      "x-api-key": env.tatumApiKey ?? "",
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  
  const price = Number(result.data.price);
  return { ok: true, data: price };
}
