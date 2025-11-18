import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TradeSetupCard } from "./TradeSetupCard";
import { SentimentGauge } from "@/components/SentimentGauge";
import { AlertCircle, TrendingUp, Activity, BarChart3, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIDecisionPanelProps {
  aiData: any;
  isLoading: boolean;
  error: string | null;
  currentPrice?: number;
}

export function AIDecisionPanel({ aiData, isLoading, error, currentPrice }: AIDecisionPanelProps) {
  // During accumulation phase, show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show real errors (not accumulation status)
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (aiData?.status === "accumulating") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <div className="text-lg font-medium mb-2">Preparing Analysis</div>
            <div className="text-sm text-muted-foreground mb-4">
              {aiData.message || "Collecting market data..."}
            </div>
            {aiData.progress !== undefined && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Progress: {aiData.progress}%
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${aiData.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const signal = aiData?.aiSignal;
  if (!signal) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No AI signal available
          </div>
        </CardContent>
      </Card>
    );
  }

  const signalColor = 
    signal.decision === "LONG" ? "text-green-500 border-green-500 bg-green-500/20" :
    signal.decision === "SHORT" ? "text-red-500 border-red-500 bg-red-500/20" :
    "text-yellow-500 border-yellow-500 bg-yellow-500/20";

  return (
    <div className="space-y-4">
      {/* AI Signal Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            AI Trading Signal
            <Badge className={signalColor}>
              {signal.decision}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-bold">{signal.confidence}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  signal.decision === "LONG" ? "bg-green-500" :
                  signal.decision === "SHORT" ? "bg-red-500" :
                  "bg-yellow-500"
                }`}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
          </div>

          {/* Trade Setup */}
          {signal.decision !== "NO TRADE" && signal.action?.entry && (
            <TradeSetupCard
              decision={signal.decision}
              entry={signal.action.entry}
              stopLoss={signal.action.stopLoss}
              takeProfit={signal.action.takeProfit}
              currentPrice={currentPrice}
            />
          )}
        </CardContent>
      </Card>

      {/* Reasoning Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {signal.summary?.trend && (
            <div className="flex gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium mb-1">Trend</div>
                <div className="text-xs text-muted-foreground">{signal.summary.trend}</div>
              </div>
            </div>
          )}

          {signal.summary?.volume && (
            <div className="flex gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium mb-1">Volume</div>
                <div className="text-xs text-muted-foreground">{signal.summary.volume}</div>
              </div>
            </div>
          )}

          {signal.summary?.liquidity && (
            <div className="flex gap-2">
              <Activity className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium mb-1">Liquidity</div>
                <div className="text-xs text-muted-foreground">{signal.summary.liquidity}</div>
              </div>
            </div>
          )}

          {signal.summary?.entryTrigger && (
            <div className="flex gap-2">
              <Target className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium mb-1">Entry Trigger</div>
                <div className="text-xs text-muted-foreground">{signal.summary.entryTrigger}</div>
              </div>
            </div>
          )}

          {signal.action?.reason && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-medium mb-1">Reason</div>
              <div className="text-xs text-muted-foreground">{signal.action.reason}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
