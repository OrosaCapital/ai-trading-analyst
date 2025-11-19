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

async function fetchTableMetrics(tableName: string): Promise<TableMetrics> {
  try {
    // Count total records
    const { count, error: countError } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // Get most recent record to determine last update
    let lastUpdate = "Never";
    let timestampValue: string | null = null;

    // Fetch latest timestamp based on table structure
    if (tableName === "market_candles") {
      const { data, error } = await supabase
        .from(tableName)
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) timestampValue = data.updated_at;
    } else if (tableName === "market_snapshots") {
      const { data, error } = await supabase
        .from(tableName)
        .select("last_updated")
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) timestampValue = data.last_updated;
    } else if (tableName === "tatum_price_logs") {
      const { data, error } = await supabase
        .from(tableName)
        .select("timestamp")
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) timestampValue = data.timestamp;
    } else if (tableName === "market_funding_rates") {
      const { data, error } = await supabase
        .from(tableName)
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) timestampValue = data.created_at;
    }

    if (timestampValue) {
      const date = new Date(timestampValue);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        lastUpdate = "Just now";
      } else if (diffMins < 60) {
        lastUpdate = `${diffMins}m ago`;
      } else if (diffMins < 1440) {
        lastUpdate = `${Math.floor(diffMins / 60)}h ago`;
      } else {
        lastUpdate = `${Math.floor(diffMins / 1440)}d ago`;
      }
    }

    // Determine status and health
    const recordCount = count || 0;
    const isRecent = lastUpdate !== "Never" && !lastUpdate.includes("d ago");
    
    return {
      name: tableName,
      status: recordCount > 0 && isRecent ? "Active" : "Idle",
      records: recordCount,
      lastUpdate,
      health: recordCount > 0 && isRecent ? "success" : "neutral",
    };
  } catch (error) {
    console.error(`Error fetching metrics for ${tableName}:`, error);
    return {
      name: tableName,
      status: "Error",
      records: 0,
      lastUpdate: "Error",
      health: "error",
    };
  }
}

async function fetchDatabaseMetrics(): Promise<DatabaseMetrics> {
  const tables = [
    "market_snapshots",
    "market_candles",
    "market_funding_rates",
    "tatum_price_logs",
  ];

  const tableMetrics = await Promise.all(
    tables.map((table) => fetchTableMetrics(table))
  );

  const totalRecords = tableMetrics.reduce((sum, table) => sum + table.records, 0);
  const activeTables = tableMetrics.filter((t) => t.status === "Active").length;

  // Get the most recent update across all tables
  const recentUpdates = tableMetrics
    .filter((t) => t.lastUpdate !== "Never" && t.lastUpdate !== "Error")
    .map((t) => t.lastUpdate);

  const lastSync =
    recentUpdates.length > 0
      ? recentUpdates.sort((a, b) => {
          // Sort by most recent (smallest time value)
          const getMinutes = (str: string) => {
            if (str === "Just now") return 0;
            const match = str.match(/(\d+)([mhd])/);
            if (!match) return Infinity;
            const value = parseInt(match[1]);
            const unit = match[2];
            if (unit === "m") return value;
            if (unit === "h") return value * 60;
            if (unit === "d") return value * 1440;
            return Infinity;
          };
          return getMinutes(a) - getMinutes(b);
        })[0]
      : "Never";

  return {
    activeDatabases: tables.length,
    priceTables: tables.length,
    lastSync,
    totalRecords,
    tables: tableMetrics,
  };
}

export function useDatabaseMetrics() {
  return useQuery({
    queryKey: ["database-metrics"],
    queryFn: fetchDatabaseMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
}
