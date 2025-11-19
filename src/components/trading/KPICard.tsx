import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export function KPICard({ label, value, change, trend, subtitle }: KPICardProps) {
  const getTrendColor = () => {
    if (trend === "up") return "text-chart-green";
    if (trend === "down") return "text-chart-red";
    return "text-muted-foreground";
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card via-card to-card/95 border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            {label}
          </span>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${getTrendColor()}`}>
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
