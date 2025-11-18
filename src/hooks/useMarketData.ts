import { useEffect } from "react";
import { useMarketStore } from "../store/useMarketStore";
import { fetchMarketSnapshot, buildDataValidation } from "../services/marketDataService";

export function useMarketData() {
  const { symbol, timeframe, snapshot, validation, isLoading, error, setData } = useMarketStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setData({ isLoading: true, error: undefined });

      try {
        const [snapRes, validationRes] = await Promise.all([
          fetchMarketSnapshot({ symbol, timeframe }),
          buildDataValidation({ symbol, timeframe }),
        ]);

        if (cancelled) return;

        if (!snapRes.ok) {
          setData({
            isLoading: false,
            error: "Failed to fetch market data",
          });
          return;
        }

        setData({
          snapshot: snapRes.data,
          validation: validationRes,
          isLoading: false,
          error: undefined,
        });
      } catch (err: any) {
        if (cancelled) return;
        setData({
          isLoading: false,
          error: err?.message ?? "Unexpected error",
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, setData]);

  return {
    symbol,
    timeframe,
    snapshot,
    validation,
    isLoading,
    error,
  };
}
