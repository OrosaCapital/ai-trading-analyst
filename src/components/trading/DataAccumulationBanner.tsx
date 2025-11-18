import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, TrendingUp } from "lucide-react";

interface DataAccumulationBannerProps {
  symbol: string;
  minutesCollected?: number;
  minutesRequired?: number;
}

export function DataAccumulationBanner({ 
  symbol, 
  minutesCollected = 0, 
  minutesRequired = 15 
}: DataAccumulationBannerProps) {
  const progress = Math.min((minutesCollected / minutesRequired) * 100, 100);
  const timeRemaining = Math.max(minutesRequired - minutesCollected, 0);

  return (
    <Alert className="border-blue-500/20 bg-blue-500/10">
      <Clock className="h-4 w-4 text-blue-500" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-blue-500 mb-1">
              Building Market Data for {symbol}
            </div>
            <div className="text-sm text-muted-foreground">
              AI trading analysis requires {minutesRequired} minutes of price history. 
              {timeRemaining > 0 ? (
                <> Approximately {timeRemaining} minutes remaining until full analysis is available.</>
              ) : (
                <> Processing data now...</>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{minutesCollected} / {minutesRequired} minutes collected</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* What's available now */}
          <div className="flex items-start gap-2 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
            <div className="text-muted-foreground">
              Live market metrics and real-time price data are already available below. 
              AI decision signals will appear once sufficient data is collected.
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
