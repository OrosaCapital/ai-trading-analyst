import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="kpi-card relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-card/80 via-card/70 to-card/60 p-4 shadow-lg shadow-black/20">
      <span className="kpi-card__grid" />
      <span className="kpi-card__orb" />
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            {label}
          </span>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[11px] font-semibold", getTrendColor())}>
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              <span>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
