import { Activity, Shield, Terminal } from "lucide-react";
import { SystemOverview } from "../components/admin/SystemOverview";
import { SystemAlerts } from "../components/admin/SystemAlerts";
import { AICreditsMonitor } from "../components/admin/AICreditsMonitor";
import { BackendStatus } from "../components/admin/BackendStatus";
import { EdgeFunctionsList } from "../components/admin/EdgeFunctionsList";
import { EnvironmentInfo } from "../components/admin/EnvironmentInfo";
import { DataValidationPanel } from "../components/panels/DataValidationPanel";
import { useMarketData } from "../hooks/useMarketData";

export function Dashboard() {
  const { validation, isLoading, error } = useMarketData();

  return (
    <div className="flex h-full flex-col gap-6 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/50">
                <Terminal className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  ADMIN CONTROL PANEL
                </h1>
                <p className="text-sm text-muted-foreground">System Diagnostics & Monitoring</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-500">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <SystemOverview />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <SystemAlerts />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-4">
          <DataValidationPanel validation={validation} isLoading={isLoading} error={error} />
          <AICreditsMonitor />
          <BackendStatus />
          <EdgeFunctionsList />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnvironmentInfo />
        <div className="p-6 rounded-lg border border-border/50 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Security Status</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
              <span className="text-muted-foreground">API Keys</span>
              <span className="text-emerald-500 font-semibold">Secured</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
              <span className="text-muted-foreground">CORS</span>
              <span className="text-emerald-500 font-semibold">Configured</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
              <span className="text-muted-foreground">Authentication</span>
              <span className="text-emerald-500 font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
