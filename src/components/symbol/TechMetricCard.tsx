import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TechMetricCardProps {
  title: string;
  value: string | number | null;
  change?: number | null;
  icon?: ReactNode;
  isLoading?: boolean;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  unit?: string;
}

export function TechMetricCard({
  title,
  value,
  change,
  icon,
  isLoading,
  trend,
  highlight,
  unit = "",
}: TechMetricCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-card/40 backdrop-blur-xl border-border/50">
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (change === null || change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-emerald-400";
    if (trend === "down") return "text-red-400";
    return "text-foreground";
  };

  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
        highlight
          ? "border-primary/50 shadow-primary/20"
          : "border-border/50 hover:border-primary/30"
      }`}
    >
      {/* Animated scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent animate-pulse" />
      
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative p-4 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {icon && <div className="text-primary/70">{icon}</div>}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${getTrendColor()}`}>
            {value !== null && value !== undefined ? value : "--"}
            {unit && <span className="text-sm ml-1 text-muted-foreground">{unit}</span>}
          </span>
        </div>

        {/* Change indicator */}
        {change !== null && change !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            {getTrendIcon()}
            <span
              className={
                change > 0
                  ? "text-emerald-400"
                  : change < 0
                  ? "text-red-400"
                  : "text-muted-foreground"
              }
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Glow effect */}
      {highlight && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      )}
    </Card>
  );
}
