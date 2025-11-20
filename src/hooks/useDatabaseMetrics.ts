import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TableMetrics {
  name: string;
  status: string;
  records: number;
  lastUpdate: string;
  health: string;
}

interface DatabaseMetrics {
  activeDatabases: number;
  priceTables: number;
  lastSync: string;
  totalRecords: number;
  tables: TableMetrics[];
}

function formatTimeDiff(timestampValue: string): string {
  const date = new Date(timestampValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
}

async function fetchMarketSnapshotsMetrics(): Promise<TableMetrics> {
  try {
    const { count } = await supabase
      .from("market_snapshots")
      .select("*", { count: "exact", head: true });

    const { data } = await supabase
      .from("market_snapshots")
      .select("last_updated")
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    const recordCount = count || 0;
    const lastUpdate = data?.last_updated ? formatTimeDiff(data.last_updated) : "Never";
    const isRecent = lastUpdate !== "Never" && !lastUpdate.includes("d ago");

    return {
      name: "market_snapshots",
      status: recordCount > 0 && isRecent ? "Active" : "Idle",
      records: recordCount,
      lastUpdate,
      health: recordCount > 0 && isRecent ? "success" : "neutral",
    };
  } catch (error) {
    console.error("Error fetching market_snapshots metrics:", error);
    return {
      name: "market_snapshots",
      status: "Error",
      records: 0,
      lastUpdate: "Error",
      health: "error",
    };
  }
}

async function fetchMarketCandlesMetrics(): Promise<TableMetrics> {
  try {
    const { count } = await supabase
      .from("market_candles")
      .select("*", { count: "exact", head: true });

    const { data } = await supabase
      .from("market_candles")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const recordCount = count || 0;
    const lastUpdate = data?.updated_at ? formatTimeDiff(data.updated_at) : "Never";
    const isRecent = lastUpdate !== "Never" && !lastUpdate.includes("d ago");

    return {
      name: "market_candles",
      status: recordCount > 0 && isRecent ? "Active" : "Idle",
      records: recordCount,
      lastUpdate,
      health: recordCount > 0 && isRecent ? "success" : "neutral",
    };
  } catch (error) {
    console.error("Error fetching market_candles metrics:", error);
    return {
      name: "market_candles",
      status: "Error",
      records: 0,
      lastUpdate: "Error",
      health: "error",
    };
  }
}

async function fetchMarketFundingRatesMetrics(): Promise<TableMetrics> {
  try {
    const { count } = await supabase
      .from("market_funding_rates")
      .select("*", { count: "exact", head: true });

    const { data } = await supabase
      .from("market_funding_rates")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const recordCount = count || 0;
    const lastUpdate = data?.created_at ? formatTimeDiff(data.created_at) : "Never";
    const isRecent = lastUpdate !== "Never" && !lastUpdate.includes("d ago");

    return {
      name: "market_funding_rates",
      status: recordCount > 0 && isRecent ? "Active" : "Idle",
      records: recordCount,
      lastUpdate,
      health: recordCount > 0 && isRecent ? "success" : "neutral",
    };
  } catch (error) {
    console.error("Error fetching market_funding_rates metrics:", error);
    return {
      name: "market_funding_rates",
      status: "Error",
      records: 0,
      lastUpdate: "Error",
      health: "error",
    };
  }
}

async function fetchDatabaseMetrics(): Promise<DatabaseMetrics> {
  const tableMetrics = await Promise.all([
    fetchMarketSnapshotsMetrics(),
    fetchMarketCandlesMetrics(),
    fetchMarketFundingRatesMetrics(),
  ]);

  const totalRecords = tableMetrics.reduce((sum, table) => sum + table.records, 0);
  const activeTables = tableMetrics.filter((t) => t.status === "Active").length;

  // Get the most recent update across all tables
  const recentUpdates = tableMetrics
    .filter((t) => t.lastUpdate !== "Never" && t.lastUpdate !== "Error")
    .sort((a, b) => {
      // Simple sorting by extracting numeric value
      const getMinutes = (str: string) => {
        if (str === "Just now") return 0;
        const match = str.match(/(\d+)([mhd])/);
        if (!match) return Infinity;
        const value = parseInt(match[1]);
        if (str.includes("m")) return value;
        if (str.includes("h")) return value * 60;
        if (str.includes("d")) return value * 1440;
        return Infinity;
      };
      return getMinutes(a.lastUpdate) - getMinutes(b.lastUpdate);
    });

  const lastSync = recentUpdates.length > 0 ? recentUpdates[0].lastUpdate : "Never";

  return {
    activeDatabases: activeTables,
    priceTables: tableMetrics.length,
    lastSync,
    totalRecords,
    tables: tableMetrics,
  };
}

export function useDatabaseMetrics() {
  return useQuery({
    queryKey: ["databaseMetrics"],
    queryFn: fetchDatabaseMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000,
  });
}
