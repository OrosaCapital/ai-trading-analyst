import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDataLayer } from "@/providers/DataLayerProvider";

interface FundingRateData {
  symbol: string;
  exchange: string;
  rate: number;
  timestamp: number;
}

function normalizeFundingTimestamp(rawTimestamp: number): number {
  // Detect and correct milliseconds-vs-seconds issue
  // If timestamp is suspiciously far in the future, assume it needs conversion
  if (rawTimestamp > 9999999999) { // e.g., > 2286-11-20 in seconds
    return Math.floor(rawTimestamp / 1000);
  }
  return rawTimestamp;
}

async function fetchFundingRate(symbol: string): Promise<FundingRateData | null> {
  const { data, error } = await supabase
    .from("market_funding_rates")
    .select("*")
    .eq("symbol", symbol)
    .eq("exchange", "Binance")
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching funding rate:", error);
    return null;
  }

  if (!data) return null;

  return {
    symbol: data.symbol,
    exchange: data.exchange,
    rate: Number(data.rate),
    timestamp: normalizeFundingTimestamp(data.timestamp),
  };
}

export function useFundingQuery(symbol: string) {
  const { queryKeys } = useDataLayer();

  return useQuery({
    queryKey: queryKeys.funding(symbol),
    queryFn: () => fetchFundingRate(symbol),
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    refetchInterval: 4 * 60 * 60 * 1000, // Background refetch every 4 hours
    refetchOnWindowFocus: false,
    enabled: !!symbol,
  });
}
