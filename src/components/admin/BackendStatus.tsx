import { Card } from "../ui/card";
import { CheckCircle2, AlertCircle, XCircle, ExternalLink } from "lucide-react";

export function BackendStatus() {
  const services = [
    {
      name: "Supabase Project",
      status: "online",
      id: "alzxeplijnbpuqkfnpjk",
      region: "US East",
      version: "PostgreSQL 15.x",
    },
    {
      name: "Edge Functions Runtime",
      status: "online",
      version: "Deno 1.x",
      functions: 30,
    },
    {
      name: "Authentication Service",
      status: "online",
      provider: "Supabase Auth",
      methods: "Email, OAuth",
    },
    {
      name: "Storage Service",
      status: "online",
      buckets: 0,
      usage: "0 MB",
    },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-card/95 border border-border/40">
      <h3 className="text-lg font-semibold mb-4">Backend Services Status</h3>
      <div className="space-y-3 font-mono">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
          >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{service.name}</span>
                  {service.status === "online" && (
                    <CheckCircle2 className="h-4 w-4 text-chart-green" />
                  )}
                  {service.status === "warning" && (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  )}
                  {service.status === "offline" && (
                    <XCircle className="h-4 w-4 text-chart-red" />
                  )}
                </div>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                {service.id && <div>Project ID: {service.id}</div>}
                {service.region && <div>Region: {service.region}</div>}
                {service.version && <div>Version: {service.version}</div>}
                {service.provider && <div>Provider: {service.provider}</div>}
                {service.methods && <div>Methods: {service.methods}</div>}
                {service.functions !== undefined && <div>Functions: {service.functions}</div>}
                {service.buckets !== undefined && <div>Buckets: {service.buckets}</div>}
                {service.usage && <div>Usage: {service.usage}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
