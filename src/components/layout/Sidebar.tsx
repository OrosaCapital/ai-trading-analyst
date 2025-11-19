import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Server, 
  Database, 
  Globe, 
  Activity,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { Badge } from "../ui/badge";

interface SidebarProps {
  symbol: string;
}

export function Sidebar({ symbol }: SidebarProps) {
  const { data: healthData, isLoading, error } = useSystemHealth();

  const healthScore = useMemo(() => {
    if (!healthData?.metrics) return 0;
    const m = healthData.metrics;
    const functionHealth = (m.edgeFunctions.healthy / m.edgeFunctions.total) * 100;
    const dbHealth = m.database.status === 'healthy' ? 100 : m.database.status === 'degraded' ? 50 : 0;
    const apiHealth = (
      (m.apis.coinglassStatus === 'operational' ? 100 : m.apis.coinglassStatus === 'degraded' ? 50 : 0) +
      (m.apis.tatumStatus === 'operational' ? 100 : m.apis.tatumStatus === 'degraded' ? 50 : 0)
    ) / 2;
    const errorPenalty = Math.max(0, 100 - (m.errors.criticalCount * 10));
    
    return Math.round((functionHealth + dbHealth + apiHealth + errorPenalty) / 4);
  }, [healthData]);

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: 'EXCELLENT', color: 'text-chart-green', icon: CheckCircle2 };
    if (score >= 70) return { label: 'GOOD', color: 'text-emerald-400', icon: CheckCircle2 };
    if (score >= 50) return { label: 'DEGRADED', color: 'text-amber-400', icon: AlertTriangle };
    return { label: 'CRITICAL', color: 'text-chart-red', icon: XCircle };
  };

  const status = getHealthStatus(healthScore);
  const StatusIcon = status.icon;

  return (
    <aside className="flex w-64 flex-col border-r border-border/50 bg-gradient-to-b from-background via-background/98 to-background/95 overflow-y-auto backdrop-blur-sm">
      <div className="px-6 py-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          ADMIN CONTROL
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium">AI System Monitor</p>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-3">
        {/* System Health Score */}
        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full rounded-md" />
            ) : error ? (
              <p className="text-sm text-destructive">Failed to load</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                    <span className={`text-sm font-bold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <span className="text-3xl font-bold">{healthScore}%</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      healthScore >= 90 ? 'bg-chart-green' :
                      healthScore >= 70 ? 'bg-emerald-400' :
                      healthScore >= 50 ? 'bg-amber-400' : 'bg-chart-red'
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Server className="w-3 h-3 transition-transform group-hover:scale-110" />
              Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-md" />
            ) : healthData?.metrics ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-chart-green">
                    {healthData.metrics.edgeFunctions.healthy}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {healthData.metrics.edgeFunctions.total}
                  </span>
                </div>
                {healthData.metrics.edgeFunctions.errors > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {healthData.metrics.edgeFunctions.errors} errors
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3 h-3 transition-transform group-hover:scale-110" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-md" />
            ) : healthData?.metrics ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={healthData.metrics.database.status === 'healthy' ? 'default' : 'destructive'}
                    className="uppercase text-xs"
                  >
                    {healthData.metrics.database.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {healthData.metrics.database.connections} connections
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* API Status */}
        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-3 h-3 transition-transform group-hover:scale-110" />
              External APIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-md" />
            ) : healthData?.metrics ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>CoinGlass</span>
                  <Badge 
                    variant={healthData.metrics.apis.coinglassStatus === 'operational' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {healthData.metrics.apis.coinglassStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Tatum</span>
                  <Badge 
                    variant={healthData.metrics.apis.tatumStatus === 'operational' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {healthData.metrics.apis.tatumStatus}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Error Metrics */}
        <Card className="glass-panel border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3 transition-transform group-hover:scale-110" />
              Errors (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-md" />
            ) : healthData?.metrics ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {healthData.metrics.errors.last24h}
                  </span>
                  {healthData.metrics.errors.criticalCount > 0 ? (
                    <Badge variant="destructive" className="text-xs">
                      {healthData.metrics.errors.criticalCount} critical
                    </Badge>
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-chart-green" />
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis */}
        {healthData?.analysis && (
          <Card className="glass-panel border border-primary/40 bg-primary/5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3 h-3" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {healthData.analysis.length > 200 
                  ? `${healthData.analysis.substring(0, 200)}...` 
                  : healthData.analysis}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  );
}
