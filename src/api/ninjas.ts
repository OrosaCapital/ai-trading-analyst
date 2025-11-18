import { httpClient } from "./httpClient";
import { env } from "../config/env";
import type { ApiResult } from "../types/api";

interface NinjaNewsItem {
  title: string;
  summary: string;
  url: string;
  date: string;
}

export async function getSymbolNews(symbol: string): Promise<ApiResult<NinjaNewsItem[]>> {
  const url = `https://api.api-ninjas.com/v1/news?symbol=${encodeURIComponent(symbol)}`;

  return httpClient.get<NinjaNewsItem[]>(url, {
    headers: {
      "X-Api-Key": env.apiNinjasKey ?? "",
    },
  });
}
