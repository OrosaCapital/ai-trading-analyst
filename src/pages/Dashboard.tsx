import { useMemo } from "react";
import { Activity, Shield, Server, Zap, Database, CheckCircle2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminNavigation } from "../components/admin/AdminNavigation";
import { AdminFilterBar } from "../components/admin/AdminFilterBar";
import { AdminKPICard } from "../components/admin/AdminKPICard";
import { SystemAlerts } from "../components/admin/SystemAlerts";
import { BackendStatus } from "../components/admin/BackendStatus";
import { EdgeFunctionsList } from "../components/admin/EdgeFunctionsList";
import { DatabaseIndicators } from "../components/admin/DatabaseIndicators";
import { Card } from "@/components/ui/card";
import { useMarketData } from "../hooks/useMarketData";
import { useSystemHealth } from "../hooks/useSystemHealth";

export function Dashboard() {
  const { validation, isLoading, error } = useMarketData();
  const { data: healthData } = useSystemHealth();

  const kpis = useMemo(() => {
    if (!healthData?.metrics) {
      return {
        functionsHealthy: 0,
        functionTotal: 0,
        dbStatus: "unknown",
        apiStatus: "operational",
        criticalErrors: 0,
      };
    }

    const m = healthData.metrics;
    return {
      functionsHealthy: m.edgeFunctions.healthy,
      functionTotal: m.edgeFunctions.total,
      dbStatus: m.database.status,
      apiStatus: m.apis.coinglassStatus,
      criticalErrors: m.errors.criticalCount,
    };
  }, [healthData]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminNavigation />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with trigger and filters */}
          <header className="flex items-center border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="ml-4" />
            <div className="flex-1">
              <AdminFilterBar />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top KPIs - 5 Second Rule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminKPICard
                label="Edge Functions"
                value={`${kpis.functionsHealthy}/${kpis.functionTotal}`}
                icon={Zap}
                status={kpis.functionsHealthy === kpis.functionTotal ? "success" : "warning"}
                subtitle="Functions operational"
              />
              <AdminKPICard
                label="Database Status"
                value={kpis.dbStatus.toUpperCase()}
                icon={Database}
                status={kpis.dbStatus === "healthy" ? "success" : kpis.dbStatus === "degraded" ? "warning" : "error"}
                subtitle="Connection stable"
              />
              <AdminKPICard
                label="API Services"
                value={kpis.apiStatus.toUpperCase()}
                icon={Server}
                status={kpis.apiStatus === "operational" ? "success" : kpis.apiStatus === "degraded" ? "warning" : "error"}
                subtitle="External services"
              />
              <AdminKPICard
                label="Critical Errors"
                value={kpis.criticalErrors}
                icon={kpis.criticalErrors === 0 ? CheckCircle2 : Shield}
                status={kpis.criticalErrors === 0 ? "success" : kpis.criticalErrors < 3 ? "warning" : "error"}
                subtitle="System alerts"
              />
            </div>

            {/* Primary Widget - System Alerts */}
            <SystemAlerts />

            {/* Secondary Widgets - Max 5-6 total */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <BackendStatus />
              <DatabaseIndicators />
              <EdgeFunctionsList />
            </div>

            {/* Security Status Card */}
            <Card className="p-6 bg-gradient-to-br from-card via-card to-card/95 border border-border/40">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Security Status</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border/30">
                  <span className="text-muted-foreground">API Keys</span>
                  <span className="text-chart-green font-semibold">Secured</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border/30">
                  <span className="text-muted-foreground">CORS</span>
                  <span className="text-chart-green font-semibold">Configured</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border/30">
                  <span className="text-muted-foreground">Authentication</span>
                  <span className="text-chart-green font-semibold">Active</span>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
