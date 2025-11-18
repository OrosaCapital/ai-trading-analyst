import { useEffect, useRef } from "react";
import { useMarketStore } from "../store/useMarketStore";
import { fetchMarketSnapshot, buildDataValidation } from "../services/marketDataService";

export function useMarketData() {
  const { symbol, timeframe, snapshot, validation, isLoading, error, setData } = useMarketStore();

  const lastSymbolRef = useRef<string | null>(null);
  const lastTimeframeRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!symbol || !timeframe) return;

    if (lastSymbolRef.current === symbol && lastTimeframeRef.current === timeframe) {
      return; // prevent duplicate fetch
    }

    lastSymbolRef.current = symbol;
    lastTimeframeRef.current = timeframe;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      let cancelled = false;

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

      return () => {
        cancelled = true;
      };
    }, 300); // debounce to prevent flood
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
