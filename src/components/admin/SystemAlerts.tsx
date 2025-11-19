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
        return "border-chart-red/50 bg-chart-red/10";
      case "warning":
        return "border-amber-400/50 bg-amber-400/10";
      case "success":
        return "border-chart-green/50 bg-chart-green/10";
      default:
        return "border-primary/50 bg-primary/10";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-chart-red";
      case "warning":
        return "text-amber-400";
      case "success":
        return "text-chart-green";
      default:
        return "text-primary";
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
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-chart-green" />
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
