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
                className="flex items-start justify-between rounded-md border border-border/50 bg-card/50 px-3 py-2 transition-colors hover:bg-muted/30"
              >
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-medium text-foreground">
                      {item.key.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{item.notes}</div>
                  {item.received !== "error" && (
                    <div className="text-[10px] font-mono text-muted-foreground/70">
                      Received: {typeof item.received === "number" 
                        ? item.received.toFixed(2) 
                        : String(item.received)}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {item.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
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
