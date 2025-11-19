import { httpClient } from "./httpClient";
import type { ApiResult } from "../types/api";
import { env } from "../config/env";

interface CMCQuoteResponse {
  data: {
    [key: string]: Array<{
      quote: {
        USD: {
          price: number;
        };
      };
    }>;
  };
}

export async function getCMCSpotPrice(symbol: string): Promise<ApiResult<number>> {
  const cleanSymbol = symbol.replace('USDT', '').replace('USD', '');
  const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(cleanSymbol)}&convert=USD`;

  const result = await httpClient.get<CMCQuoteResponse>(url, {
    headers: {
      "X-CMC_PRO_API_KEY": env.cmcApiKey ?? "",
      "Accept": "application/json"
    },
  });

  if (!result.ok) {
    return result as ApiResult<number>;
  }

  const price = result.data.data[cleanSymbol]?.[0]?.quote.USD.price;
  if (!price) {
    return {
      ok: false,
      error: { message: "Price not found in response" },
    };
  }

  return { ok: true, data: price };
}
