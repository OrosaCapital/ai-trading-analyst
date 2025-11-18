import { Card } from "../ui/card";
import { Activity, Database, Zap, Globe, Server } from "lucide-react";

export function SystemOverview() {
  const uptime = Math.floor((Date.now() - performance.timeOrigin) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const metrics = [
    {
      label: "Frontend Status",
      value: "Online",
      icon: Globe,
      status: "success",
      detail: `Uptime: ${hours}h ${minutes}m`,
    },
    {
      label: "Backend Services",
      value: "Connected",
      icon: Server,
      status: "success",
      detail: "Lovable Cloud",
    },
    {
      label: "Database",
      value: "Active",
      icon: Database,
      status: "success",
      detail: "PostgreSQL 15.x",
    },
    {
      label: "Edge Functions",
      value: "Deployed",
      icon: Zap,
      status: "success",
      detail: "Deno Runtime",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </span>
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${
                    metric.status === "success" ? "bg-emerald-500" : "bg-red-500"
                  } animate-pulse`} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-xs text-muted-foreground">{metric.detail}</div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
