import { Database, Table, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDatabaseMetrics } from "@/hooks/useDatabaseMetrics";

export function DatabaseIndicators() {
  const { data: metrics, isLoading, error } = useDatabaseMetrics();
  const getHealthColor = (health: string) => {
    switch (health) {
      case "success":
        return "bg-chart-green";
      case "warning":
        return "bg-amber-400";
      case "error":
        return "bg-chart-red";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "Active") return "bg-chart-green/20 text-chart-green border-chart-green/30";
    return "bg-muted/20 text-muted-foreground border-muted/30";
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card via-card to-card/95 border border-border/40">
        <div className="flex items-center gap-2 mb-6">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Database Indicators</h3>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card via-card to-card/95 border border-border/40">
        <div className="flex items-center gap-2 mb-6">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Database Indicators</h3>
        </div>
        <p className="text-sm text-muted-foreground">Error loading database metrics</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-card/95 border border-border/40 hover:border-primary/40 transition-all duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Database Indicators</h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <div className="text-2xl font-bold">{metrics.activeDatabases}</div>
        </div>

        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Table className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tables</span>
          </div>
          <div className="text-2xl font-bold">{metrics.priceTables}</div>
        </div>

        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Last Sync</span>
          </div>
          <div className="text-2xl font-bold">{metrics.lastSync}</div>
        </div>

        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Records</span>
          </div>
          <div className="text-2xl font-bold">{metrics.totalRecords.toLocaleString()}</div>
        </div>
      </div>

      {/* Tables List */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Database Tables</h4>
        <div className="space-y-2">
          {metrics.tables.map((table) => (
            <div
              key={table.name}
              className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-border/20 hover:border-border/40 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`h-2 w-2 rounded-full ${getHealthColor(table.health)}`} />
                <Table className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{table.name}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-md border ${getStatusBadgeColor(table.status)}`}>
                  {table.status}
                </span>
                <span className="text-xs text-muted-foreground w-16 text-right">{table.records.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground w-20 text-right">{table.lastUpdate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
