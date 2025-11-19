import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDataLayer } from "@/providers/DataLayerProvider";

interface MetricsData {
  symbol: string;
  price: number;
  volume_24h: number;
  change_24h: number;
  last_updated: string;
}

async function fetchMetrics(symbol: string): Promise<MetricsData | null> {
  const { data, error } = await supabase
    .from("market_snapshots")
    .select("*")
    .eq("symbol", symbol)
    .single();

  if (error) {
    console.error("Error fetching metrics:", error);
    return null;
  }

  if (!data) return null;

  return {
    symbol: data.symbol,
    price: Number(data.price),
    volume_24h: Number(data.volume_24h || 0),
    change_24h: Number(data.change_24h || 0),
    last_updated: data.last_updated || new Date().toISOString(),
  };
}

export function useMetricsQuery(symbol: string) {
  const { queryKeys } = useDataLayer();

  return useQuery({
    queryKey: queryKeys.metrics(symbol),
    queryFn: () => fetchMetrics(symbol),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!symbol,
  });
}
