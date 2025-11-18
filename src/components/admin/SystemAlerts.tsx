import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle, Info, Zap, Database, Shield, Activity } from "lucide-react";

export function SystemAlerts() {
  const alerts = [
    {
      type: "error",
      icon: XCircle,
      title: "Missing API Keys",
      message: "COINGLASS_API_KEY, TATUM_API_KEY, and API_NINJAS_KEY are not configured",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: "warning",
      icon: AlertTriangle,
      title: "High Memory Usage",
      message: "Application memory usage at 78% - consider optimization",
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
    },
    {
      type: "info",
      icon: Info,
      title: "Database Connection",
      message: "All database queries responding within normal parameters",
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
    },
    {
      type: "success",
      icon: CheckCircle2,
      title: "Edge Functions Healthy",
      message: "All 30 edge functions deployed and operational",
      timestamp: new Date(Date.now() - 900000).toLocaleTimeString(),
    },
    {
      type: "warning",
      icon: Zap,
      title: "Rate Limit Warning",
      message: "API rate limit at 85% - 150 requests remaining this hour",
      timestamp: new Date(Date.now() - 1200000).toLocaleTimeString(),
    },
    {
      type: "info",
      icon: Database,
      title: "Cache Performance",
      message: "Cache hit ratio: 94% - optimal performance",
      timestamp: new Date(Date.now() - 1500000).toLocaleTimeString(),
    },
    {
      type: "warning",
      icon: Shield,
      title: "Auth Session Expiry",
      message: "12 user sessions expiring in next 15 minutes",
      timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
    },
    {
      type: "success",
      icon: Activity,
      title: "WebSocket Connected",
      message: "Real-time price stream active with 3 active connections",
      timestamp: new Date(Date.now() - 2100000).toLocaleTimeString(),
    },
  ];

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "error":
        return "border-red-500/50 bg-red-950/20";
      case "warning":
        return "border-amber-500/50 bg-amber-950/20";
      case "success":
        return "border-emerald-500/50 bg-emerald-950/20";
      default:
        return "border-blue-500/50 bg-blue-950/20";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "success":
        return "text-emerald-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <Card title="System Monitoring & Alerts" className="h-[500px]">
      <div className="space-y-3 overflow-y-auto h-[440px] pr-2">
        {alerts.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <Alert
              key={index}
              variant={getAlertVariant(alert.type)}
              className={getAlertStyles(alert.type)}
            >
              <Icon className={`h-4 w-4 ${getIconColor(alert.type)}`} />
              <AlertTitle className="flex items-center justify-between">
                <span>{alert.title}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {alert.timestamp}
                </span>
              </AlertTitle>
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    </Card>
  );
}
