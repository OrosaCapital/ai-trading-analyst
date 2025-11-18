import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
import { useSystemAlertsStore } from "@/store/useSystemAlertsStore";

export function SystemAlerts() {
  const alerts = useSystemAlertsStore((state) => state.alerts);

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

  // Map icon based on type if not provided
  const getIconComponent = (type: string) => {
    switch (type) {
      case 'error':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle2;
      case 'info':
      default:
        return Info;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          System Monitoring & Alerts
          <span className="text-xs text-muted-foreground ml-auto">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
              <p>No system alerts</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const IconComponent = alert.icon || getIconComponent(alert.type);
              return (
                <Alert
                  key={alert.id}
                  variant={getAlertVariant(alert.type)}
                  className={`${getAlertStyles(alert.type)} transition-all duration-300 hover:scale-[1.01]`}
                >
                  <IconComponent className={`h-4 w-4 ${getIconColor(alert.type)}`} />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {alert.message}
                    {alert.source && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        Source: {alert.source}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
