import { useSystemHealth } from "@/hooks/useSystemHealth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, Activity, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIAgentPanel() {
  const { data, isLoading, error } = useSystemHealth();

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse opacity-50" />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary/10 p-3 rounded-full border border-primary/20">
                <Brain className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                AI System Monitor
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time intelligent analysis
              </p>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 font-semibold",
              data ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
            )}
          >
            {isLoading ? (
              <>
                <Activity className="w-3 h-3 animate-pulse" />
                Analyzing...
              </>
            ) : error ? (
              <>
                <AlertCircle className="w-3 h-3" />
                Error
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3" />
                Active
              </>
            )}
          </Badge>
        </div>

        {/* Status Grid */}
        {data?.metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <MetricCard
              label="Edge Functions"
              value={`${data.metrics.edgeFunctions.healthy}/${data.metrics.edgeFunctions.total}`}
              status={data.metrics.edgeFunctions.healthy === data.metrics.edgeFunctions.total ? 'success' : 'warning'}
            />
            <MetricCard
              label="Database"
              value={data.metrics.database.status}
              status={data.metrics.database.status === 'healthy' ? 'success' : data.metrics.database.status === 'degraded' ? 'warning' : 'error'}
            />
            <MetricCard
              label="CoinGlass API"
              value={data.metrics.apis.coinglassStatus}
              status={data.metrics.apis.coinglassStatus === 'operational' ? 'success' : data.metrics.apis.coinglassStatus === 'degraded' ? 'warning' : 'error'}
            />
            <MetricCard
              label="Critical Errors"
              value={data.metrics.errors.criticalCount}
              status={data.metrics.errors.criticalCount === 0 ? 'success' : data.metrics.errors.criticalCount < 3 ? 'warning' : 'error'}
            />
          </div>
        )}

        {/* AI Analysis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">AI Analysis</span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing system metrics and recent alerts...
            </div>
          ) : error ? (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              Failed to load AI analysis: {error}
            </div>
          ) : data?.analysis ? (
            <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {data.analysis}
              </p>
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(data.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
              No analysis available yet. The AI agent is initializing...
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  status: 'success' | 'warning' | 'error';
}

function MetricCard({ label, value, status }: MetricCardProps) {
  const statusColors = {
    success: 'text-green-400 bg-green-500/10 border-green-500/20',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className={cn("p-3 rounded-lg border", statusColors[status])}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-bold capitalize">{value}</div>
    </div>
  );
}
