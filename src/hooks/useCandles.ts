import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDataLayer } from "@/providers/DataLayerProvider";
import { Candle } from "@/types/market";

async function fetchCandles(symbol: string): Promise<Candle[]> {
  const { data, error } = await supabase
    .from("market_candles")
    .select("*")
    .eq("symbol", symbol)
    .eq("timeframe", "1m")
    .order("timestamp", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("Error fetching candles:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    timestamp: row.timestamp,
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume || 0),
  }));
}

export function useCandles(symbol: string) {
  const { queryKeys } = useDataLayer();

  return useQuery({
    queryKey: queryKeys.candles(symbol),
    queryFn: () => fetchCandles(symbol),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!symbol,
  });
}
