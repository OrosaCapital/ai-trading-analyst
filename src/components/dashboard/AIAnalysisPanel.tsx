import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Droplets, BarChart3, Target } from "lucide-react";
import { formatCurrency } from "@/lib/mockDataGenerators";
import { useMarketData } from "@/hooks/useMarketData";
import { Skeleton } from "@/components/ui/skeleton";
import { DataValidationPanel } from "@/components/panels/DataValidationPanel";
import { ErrorState } from "@/components/ui/ErrorState";

interface AIAnalysisPanelProps {
  symbol: string;
}

export const AIAnalysisPanel = ({ symbol }: AIAnalysisPanelProps) => {
  const { data, isLoading, error } = useMarketData(symbol);

  if (isLoading || data?.status === 'accumulating') {
    return (
      <div className="space-y-4">
        {data?.progress ? (
          <DataValidationPanel 
            message={data.message || "Accumulating data..."}
            progress={data.progress}
          />
        ) : (
          <Card className="p-6 glass">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-20 w-full" />
          </Card>
        )}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 glass">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data?.aiSignal) {
    return <ErrorState message={error || "Failed to load AI analysis"} />;
  }

  const { decision, confidence, summary, action } = data.aiSignal;
  
  // Calculate sentiment score based on confidence and decision
  const sentimentScore = decision === 'LONG' ? Math.min(50 + confidence / 2, 100) : 
                        decision === 'SHORT' ? Math.max(50 - confidence / 2, 0) : 50;
  const sentimentLabel = sentimentScore > 60 ? 'Bullish' : sentimentScore < 40 ? 'Bearish' : 'Neutral';

  return (
    <div className="space-y-4">
      {/* Signal Card */}
      <Card className={`p-6 glass ${
        decision === 'LONG' ? 'border-chart-green/30 bg-chart-green/5' : 
        decision === 'SHORT' ? 'border-chart-red/30 bg-chart-red/5' : 
        'border-muted/30'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">AI Signal</div>
            <div className={`text-3xl font-black ${
              decision === 'LONG' ? 'text-chart-green' : 
              decision === 'SHORT' ? 'text-chart-red' : 
              'text-muted-foreground'
            }`}>{decision}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Confidence</div>
            <div className="text-3xl font-black text-accent">{confidence}%</div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              decision === 'LONG' ? 'bg-gradient-to-r from-chart-green to-accent' :
              decision === 'SHORT' ? 'bg-gradient-to-r from-chart-red to-destructive' :
              'bg-gradient-to-r from-muted-foreground to-muted'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </Card>

      {/* Sentiment */}
      <Card className="p-6 glass">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Market Sentiment</span>
          <Badge variant="outline" className={`${
            sentimentLabel === 'Bullish' ? 'border-chart-green text-chart-green' :
            sentimentLabel === 'Bearish' ? 'border-chart-red text-chart-red' :
            'border-muted-foreground text-muted-foreground'
          }`}>
            {sentimentLabel}
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-3">{Math.round(sentimentScore)}/100</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">AI Confidence</span>
            <span className="font-semibold">{confidence}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Signal Type</span>
            <span className={`font-semibold ${
              decision === 'LONG' ? 'text-chart-green' : 
              decision === 'SHORT' ? 'text-chart-red' : 
              'text-muted-foreground'
            }`}>{decision}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Analysis Status</span>
            <span className="font-semibold text-chart-green">Live</span>
          </div>
        </div>
      </Card>

      {/* Analysis Summary */}
      <Card className="p-6 glass">
        <h4 className="text-sm font-semibold mb-4">Analysis Summary</h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">Trend</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{summary.trend}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold">Volume</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{summary.volume}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-chart-blue" />
              <span className="text-xs font-semibold">Liquidity</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{summary.liquidity}</p>
          </div>
        </div>
      </Card>

      {/* Action Levels */}
      {decision !== 'NO TRADE' && action.entry && action.stopLoss && action.takeProfit && (
        <Card className="p-6 glass">
          <h4 className="text-sm font-semibold mb-4">Recommended Action</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Entry Price</span>
              <span className="text-lg font-bold text-chart-green">{formatCurrency(action.entry)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stop Loss</span>
              <span className="text-lg font-bold text-chart-red">{formatCurrency(action.stopLoss)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Take Profit</span>
              <span className="text-lg font-bold text-chart-green">{formatCurrency(action.takeProfit)}</span>
            </div>
            {action.entry && action.stopLoss && action.takeProfit && (
              <>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Risk/Reward</span>
                  <span className="text-lg font-bold text-accent">
                    1:{((action.takeProfit - action.entry) / (action.entry - action.stopLoss)).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
          {action.reason && (
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">{action.reason}</p>
          )}
        </Card>
      )}
      
      {decision === 'NO TRADE' && action.reason && (
        <Card className="p-6 glass border-muted/30">
          <h4 className="text-sm font-semibold mb-3">Analysis</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{action.reason}</p>
        </Card>
      )}
    </div>
  );
};
