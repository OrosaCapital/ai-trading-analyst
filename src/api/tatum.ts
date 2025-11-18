import { httpClient } from "./httpClient";
import { env } from "../config/env";
import type { ApiResult } from "../types/api";

interface TatumPriceResponse {
  symbol: string;
  price: string;
}

export async function getTatumSpotPrice(symbol: string): Promise<ApiResult<number>> {
  const url = `https://api.tatum.io/v3/market/value/${encodeURIComponent(symbol)}`;

  return httpClient
    .get<TatumPriceResponse>(url, {
      headers: {
        "x-api-key": env.tatumApiKey ?? "",
      },
    })
    .then((res) => {
      if (!res.ok) return res;
      const price = Number(res.data.price);
      return { ok: true, data: price };
    });
}
