import { Card } from "../ui/card";
import { Zap, CheckCircle2, Clock } from "lucide-react";

export function EdgeFunctionsList() {
  const functions = [
    { name: "fetch-market-data", status: "deployed", lastDeploy: "2 min ago", calls: 15 },
    { name: "fetch-fear-greed-index", status: "deployed", lastDeploy: "1 hour ago", calls: 8 },
    { name: "fetch-funding-rate", status: "deployed", lastDeploy: "1 hour ago", calls: 12 },
    { name: "fetch-open-interest", status: "deployed", lastDeploy: "1 hour ago", calls: 5 },
    { name: "fetch-liquidations", status: "deployed", lastDeploy: "1 hour ago", calls: 7 },
    { name: "generate-analysis", status: "deployed", lastDeploy: "1 hour ago", calls: 3 },
    { name: "fetch-trading-data", status: "deployed", lastDeploy: "1 hour ago", calls: 9 },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-card/95 border border-border/40">
      <h3 className="text-lg font-semibold mb-4">Edge Functions</h3>
      <div className="space-y-2 font-mono">
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/50">
          <span>Total Functions: {functions.length}</span>
          <span>All Deployed ✓</span>
        </div>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {functions.map((fn) => (
            <div
              key={fn.name}
              className="flex items-center justify-between p-2.5 rounded-md bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-medium">{fn.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{fn.lastDeploy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-primary font-semibold">{fn.calls}</span>
                  <span>calls</span>
                </div>
                <CheckCircle2 className="h-3.5 w-3.5 text-chart-green" />
              </div>
            </div>
        ))}
        </div>
      </div>
    </Card>
  );
}
