import { supabase } from "../integrations/supabase/client";
import type { MarketSnapshot, SymbolTimeframe, DataValidationSummary, Candle } from "../types/market";
import type { ApiResult } from "../types/api";

interface EdgeFunctionResponse {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  spotPrice: number | null;
  news: any[];
  validation: {
    coinglass: { valid: boolean; count: number; error: string | null };
    tatum: { valid: boolean; price: number | null; error: string | null };
    ninjas: { valid: boolean; count: number; error: string | null };
  };
}

export async function fetchMarketSnapshot(params: SymbolTimeframe): Promise<ApiResult<MarketSnapshot>> {
  try {
    const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>("fetch-market-data", {
      body: {
        symbol: params.symbol,
        timeframe: params.timeframe,
      },
    });

    if (error) {
      return {
        ok: false,
        error: {
          message: error.message || "Failed to fetch market data",
          details: error,
        },
      };
    }

    if (!data) {
      return {
        ok: false,
        error: {
          message: "No data returned from edge function",
        },
      };
    }

    const latest = data.candles.at(-1);

    const snapshot: MarketSnapshot = {
      symbol: params.symbol,
      timeframe: params.timeframe,
      candles: data.candles,
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
  } catch (err: any) {
    return {
      ok: false,
      error: {
        message: err?.message ?? "Unexpected error",
        details: err,
      },
    };
  }
}

export async function buildDataValidation(params: SymbolTimeframe): Promise<DataValidationSummary> {
  try {
    const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>("fetch-market-data", {
      body: {
        symbol: params.symbol,
        timeframe: params.timeframe,
      },
    });

    if (error || !data) {
      return {
        symbol: params.symbol,
        timeframe: params.timeframe,
        items: [
          {
            key: "edge_function",
            received: "error",
            valid: false,
            notes: error?.message || "Failed to call edge function",
          },
        ],
        isReadyForDecision: false,
      };
    }

    const items = [
      {
        key: "coinglass_candles",
        received: data.validation.coinglass.count,
        valid: data.validation.coinglass.valid,
        notes: data.validation.coinglass.valid
          ? `Received ${data.validation.coinglass.count} candles`
          : data.validation.coinglass.error || "Failed to fetch candles",
      },
      {
        key: "tatum_spot",
        received: data.validation.tatum.price,
        valid: data.validation.tatum.valid,
        notes: data.validation.tatum.valid
          ? "Spot price OK"
          : data.validation.tatum.error || "Failed to fetch spot price",
      },
      {
        key: "api_ninjas_news",
        received: data.validation.ninjas.count,
        valid: data.validation.ninjas.valid,
        notes: data.validation.ninjas.valid
          ? `Received ${data.validation.ninjas.count} news items`
          : data.validation.ninjas.error || "Failed to fetch news",
      },
    ];

    const isReadyForDecision = items.every((i) => i.valid);

    return {
      symbol: params.symbol,
      timeframe: params.timeframe,
      items,
      isReadyForDecision,
    };
  } catch (err: any) {
    return {
      symbol: params.symbol,
      timeframe: params.timeframe,
      items: [
        {
          key: "unexpected_error",
          received: "error",
          valid: false,
          notes: err?.message || "Unexpected error occurred",
        },
      ],
      isReadyForDecision: false,
    };
  }
}
