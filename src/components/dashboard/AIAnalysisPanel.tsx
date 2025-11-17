import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Droplets, BarChart3, Target } from "lucide-react";
import { mockAIAnalysis, mockSentiment } from "@/data/mockAnalysis";
import { formatCurrency } from "@/lib/mockDataGenerators";

export const AIAnalysisPanel = () => {
  const { decision, confidence, summary, action } = mockAIAnalysis;

  return (
    <div className="space-y-4">
      {/* Signal Card */}
      <Card className="p-6 glass border-chart-green/30 bg-chart-green/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">AI Signal</div>
            <div className="text-3xl font-black text-chart-green">{decision}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Confidence</div>
            <div className="text-3xl font-black text-accent">{confidence}%</div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-chart-green to-accent rounded-full transition-all duration-1000"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </Card>

      {/* Sentiment */}
      <Card className="p-6 glass">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Market Sentiment</span>
          <Badge variant="outline" className="border-chart-green text-chart-green">
            {mockSentiment.overall}
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-3">{mockSentiment.score}/100</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Social Volume</span>
            <span className="font-semibold">{mockSentiment.socialVolume}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">News Impact</span>
            <span className="font-semibold text-chart-green">{mockSentiment.newsImpact}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fear & Greed</span>
            <span className="font-semibold">{mockSentiment.fearGreedIndex}</span>
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
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Risk/Reward</span>
            <span className="text-lg font-bold text-accent">1:1.87</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">{action.reason}</p>
      </Card>
    </div>
  );
};
