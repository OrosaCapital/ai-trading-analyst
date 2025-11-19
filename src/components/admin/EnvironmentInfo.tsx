import { Card } from "../ui/card";
import { Terminal, Shield, Key } from "lucide-react";

export function EnvironmentInfo() {
  const envVars = [
    { key: "VITE_SUPABASE_URL", status: "set", icon: Terminal },
    { key: "VITE_SUPABASE_PUBLISHABLE_KEY", status: "set", icon: Key },
    { key: "VITE_COINGLASS_API_KEY", status: "set", icon: Shield },
    { key: "VITE_COINMARKETCAP_API_KEY", status: "set", icon: Shield },
    { key: "VITE_API_NINJAS_KEY", status: "set", icon: Shield },
  ];

  const buildInfo = {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
  };

  return (
    <Card title="Environment & Configuration" className="font-mono">
      <div className="space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-2">Build Info</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 text-xs">
              <span className="text-muted-foreground">Mode:</span>
              <span className="font-semibold uppercase">{buildInfo.mode}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 text-xs">
              <span className="text-muted-foreground">Environment:</span>
              <span className="font-semibold">{buildInfo.dev ? "Development" : "Production"}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Environment Variables</div>
          <div className="space-y-1.5">
            {envVars.map((env) => {
              const Icon = env.icon;
              return (
                <div
                  key={env.key}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/20 text-xs hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">{env.key}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">
                    {env.status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
