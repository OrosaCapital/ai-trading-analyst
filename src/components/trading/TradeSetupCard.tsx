import { Card } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Shield, Target } from "lucide-react";

interface TradeSetupCardProps {
  decision: "LONG" | "SHORT";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  currentPrice?: number;
}

export function TradeSetupCard({
  decision,
  entry,
  stopLoss,
  takeProfit,
  currentPrice,
}: TradeSetupCardProps) {
  const isLong = decision === "LONG";
  
  const calculateRR = () => {
    if (!entry || !stopLoss || !takeProfit) return null;
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    return (reward / risk).toFixed(2);
  };

  const calculateDistance = (price: number | null) => {
    if (!price || !currentPrice) return null;
    const diff = ((price - currentPrice) / currentPrice) * 100;
    return diff.toFixed(2);
  };

  return (
    <Card className={`p-4 ${isLong ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
      <div className="space-y-3">
        {/* Entry */}
        {entry && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLong ? (
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">Entry</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">${entry.toLocaleString()}</div>
              {calculateDistance(entry) && (
                <div className="text-xs text-muted-foreground">
                  {calculateDistance(entry)}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stop Loss */}
        {stopLoss && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Stop Loss</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-red-500">
                ${stopLoss.toLocaleString()}
              </div>
              {calculateDistance(stopLoss) && (
                <div className="text-xs text-muted-foreground">
                  {calculateDistance(stopLoss)}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Take Profit */}
        {takeProfit && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Take Profit</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-500">
                ${takeProfit.toLocaleString()}
              </div>
              {calculateDistance(takeProfit) && (
                <div className="text-xs text-muted-foreground">
                  {calculateDistance(takeProfit)}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk/Reward Ratio */}
        {calculateRR() && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Risk/Reward</span>
              <span className="text-sm font-bold text-primary">
                1:{calculateRR()}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
