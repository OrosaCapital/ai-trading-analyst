import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Zap, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function AICreditsMonitor() {
  // Mock data - in production, fetch from your API
  const creditData = {
    total: 10000,
    used: 7800,
    remaining: 2200,
    dailyUsage: 450,
    monthlyLimit: 10000,
    lastUpdated: new Date().toLocaleTimeString(),
  };

  const usagePercent = (creditData.used / creditData.total) * 100;
  
  const getStatusColor = () => {
    if (usagePercent >= 90) return "text-red-500";
    if (usagePercent >= 75) return "text-amber-500";
    return "text-emerald-500";
  };

  const getStatusBg = () => {
    if (usagePercent >= 90) return "bg-red-500/10 border-red-500/50";
    if (usagePercent >= 75) return "bg-amber-500/10 border-amber-500/50";
    return "bg-emerald-500/10 border-emerald-500/50";
  };

  const getStatusIcon = () => {
    if (usagePercent >= 90) return XCircle;
    if (usagePercent >= 75) return AlertTriangle;
    return CheckCircle2;
  };

  const getProgressColor = () => {
    if (usagePercent >= 90) return "bg-red-500";
    if (usagePercent >= 75) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card title="AI Credits Monitor" className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16" />
      
      <div className="relative space-y-4">
        {/* Status Alert */}
        <Alert className={getStatusBg()}>
          <StatusIcon className={`h-4 w-4 ${getStatusColor()}`} />
          <AlertTitle className="flex items-center justify-between">
            <span>
              {usagePercent >= 90 && "Critical: Credits Low"}
              {usagePercent >= 75 && usagePercent < 90 && "Warning: High Usage"}
              {usagePercent < 75 && "Status: Healthy"}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              Updated: {creditData.lastUpdated}
            </span>
          </AlertTitle>
          <AlertDescription>
            {usagePercent >= 90 && "Immediate action required. Add credits to avoid service interruption."}
            {usagePercent >= 75 && usagePercent < 90 && "Consider adding more credits soon to maintain service."}
            {usagePercent < 75 && "AI services operating normally with sufficient credit balance."}
          </AlertDescription>
        </Alert>

        {/* Credit Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Credits</span>
            </div>
            <div className="text-2xl font-bold">{creditData.total.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Daily Usage</span>
            </div>
            <div className="text-2xl font-bold">{creditData.dailyUsage.toLocaleString()}</div>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credits Used</span>
            <span className={`font-bold ${getStatusColor()}`}>
              {creditData.used.toLocaleString()} / {creditData.total.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <Progress value={usagePercent} className="h-3" />
            <div 
              className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${getStatusColor()}`}>{usagePercent.toFixed(1)}% Used</span>
            <span className="text-muted-foreground">{creditData.remaining.toLocaleString()} Remaining</span>
          </div>
        </div>

        {/* Threshold Indicators */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Alert Thresholds</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Healthy</span>
              </div>
              <span className="text-muted-foreground">&lt; 75%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Warning</span>
              </div>
              <span className="text-muted-foreground">75% - 89%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>Critical</span>
              </div>
              <span className="text-muted-foreground">&ge; 90%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
