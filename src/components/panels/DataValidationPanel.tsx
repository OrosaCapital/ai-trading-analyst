import type { DataValidationSummary } from "../../types/market";
import { Card } from "../ui/card";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface DataValidationPanelProps {
  validation?: DataValidationSummary;
  isLoading?: boolean;
  error?: string;
}

export function DataValidationPanel({ validation, isLoading, error }: DataValidationPanelProps) {
  return (
    <Card title="API Connection Test">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Testing API connections...</span>
        </div>
      ) : error ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <XCircle className="h-4 w-4" />
            <span className="font-semibold">Connection Error</span>
          </div>
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
          <div className="text-xs text-muted-foreground">
            Check your API keys in the Secrets section and verify they are valid.
          </div>
        </div>
      ) : !validation ? (
        <div className="text-xs text-muted-foreground">No validation results yet.</div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="font-medium">
              {validation.symbol} · {validation.timeframe.toUpperCase()}
            </span>
            {validation.isReadyForDecision ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-semibold">Ready</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="font-semibold">Issues Detected</span>
              </span>
            )}
          </div>

           <div className="space-y-1.5">
            {validation.items.map((item) => (
              <div
                key={item.key}
                className="rounded-md border border-border/50 bg-card/50 px-3 py-2.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-medium text-foreground">
                        {item.key.replace(/_/g, " ").toUpperCase()}
                      </span>
                      {item.responseTime !== undefined && (
                        <span className="text-[10px] text-muted-foreground/70">
                          {item.responseTime}ms
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{item.notes}</div>
                  </div>
                  <div className="flex items-center">
                    {item.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                
                {/* Technical Details */}
                <div className="space-y-1 pt-2 border-t border-border/30">
                  {item.endpoint && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] text-muted-foreground/50 min-w-[50px]">Endpoint:</span>
                      <span className="text-[10px] font-mono text-muted-foreground/70 break-all">
                        {item.endpoint}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {item.plan && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground/50">Plan:</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {item.plan}
                        </span>
                      </div>
                    )}
                    {item.rateLimit && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground/50">Limit:</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {item.rateLimit}
                        </span>
                      </div>
                    )}
                    {item.credits && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground/50">Credits:</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {item.credits}
                        </span>
                      </div>
                    )}
                  </div>
                  {item.received !== "error" && (
                    <div className="text-[10px] font-mono text-muted-foreground/70">
                      Data: {typeof item.received === "number" 
                        ? item.received.toFixed(2) 
                        : String(item.received)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {validation.isReadyForDecision && (
            <div className="rounded-md bg-emerald-500/10 p-2 text-xs text-emerald-500">
              ✓ All API connections verified. Ready for trading decisions.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
