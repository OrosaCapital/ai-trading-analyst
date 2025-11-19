import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AdminKPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  status?: "success" | "warning" | "error" | "neutral";
  subtitle?: string;
}

export function AdminKPICard({ label, value, icon: Icon, status = "neutral", subtitle }: AdminKPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-chart-green";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-chart-red";
      default:
        return "text-primary";
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case "success":
        return "bg-chart-green/10 border-chart-green/30";
      case "warning":
        return "bg-amber-400/10 border-amber-400/30";
      case "error":
        return "bg-chart-red/10 border-chart-red/30";
      default:
        return "bg-primary/10 border-primary/30";
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card via-card to-card/95 border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              {label}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border ${getStatusBg()}`}>
          <Icon className={`h-5 w-5 ${getStatusColor()}`} />
        </div>
      </div>
    </Card>
  );
}
