import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Activity, Target, Shield, Sparkles } from "lucide-react";

interface AISignalCardProps {
  decision: 'LONG' | 'SHORT' | 'NO TRADE';
  confidence: number;
  summary: {
    trend: string;
    volume: string;
    liquidity: string;
    coinglass: string;
    entryTrigger: string;
  };
  action: {
    entry?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    reason?: string | null;
  };
}

export const AISignalCard = ({ decision, confidence, summary, action }: AISignalCardProps) => {
  const signalColor = 
    decision === 'LONG' ? 'from-chart-green/80 to-chart-green' :
    decision === 'SHORT' ? 'from-destructive/80 to-destructive' :
    'from-muted/80 to-muted';
  
  return (
    <Card className="border-2 border-primary/30 glass-strong shadow-2xl shadow-primary/10 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r ${signalColor} shadow-lg`}>
            <Zap className="w-8 h-8 text-foreground animate-pulse" />
            <span className="text-3xl font-bold text-foreground">{decision}</span>
          </div>
          <Badge variant="outline" className="text-xl px-4 py-2 border-primary text-primary glow-primary">
            {confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Trend Explanation */}
        <div className="p-4 glass border border-primary/20 rounded-lg hover:border-primary/40 transition-all">
          <h4 className="text-primary font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trend Analysis
          </h4>
          <p className="text-muted-foreground">{summary.trend}</p>
        </div>
        
        {/* Volume Explanation */}
        <div className="p-4 glass border border-chart-green/20 rounded-lg hover:border-chart-green/40 transition-all">
          <h4 className="text-chart-green font-semibold mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Volume Confirmation
          </h4>
          <p className="text-muted-foreground">{summary.volume}</p>
        </div>
        
        {/* Liquidity Explanation */}
        <div className="p-4 glass border border-accent/20 rounded-lg hover:border-accent/40 transition-all">
          <h4 className="text-accent font-semibold mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Liquidity Status
          </h4>
          <p className="text-muted-foreground">{summary.liquidity}</p>
        </div>
        
        {/* CoinGlass Sentiment */}
        <div className="p-4 glass border border-destructive/20 rounded-lg hover:border-destructive/40 transition-all">
          <h4 className="text-destructive font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Market Sentiment
          </h4>
          <p className="text-muted-foreground">{summary.coinglass}</p>
        </div>
        
        {/* Entry Trigger */}
        <div className="p-4 glass border border-primary/20 rounded-lg hover:border-primary/40 transition-all">
          <h4 className="text-primary font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Entry Trigger (1m)
          </h4>
          <p className="text-muted-foreground">{summary.entryTrigger}</p>
        </div>
        
        {/* Action Levels (if LONG or SHORT) */}
        {decision !== 'NO TRADE' && action.entry && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 glass-strong border border-chart-green/30 rounded-lg text-center hover:border-chart-green/60 transition-all">
              <p className="text-xs text-chart-green mb-1">Entry</p>
              <p className="text-2xl font-bold text-chart-green">${action.entry.toFixed(2)}</p>
            </div>
            <div className="p-4 glass-strong border border-destructive/30 rounded-lg text-center hover:border-destructive/60 transition-all">
              <p className="text-xs text-destructive mb-1">Stop Loss</p>
              <p className="text-2xl font-bold text-destructive">${action.stopLoss?.toFixed(2) || 'N/A'}</p>
            </div>
            <div className="p-4 glass-strong border border-primary/30 rounded-lg text-center hover:border-primary/60 transition-all">
              <p className="text-xs text-primary mb-1">Take Profit</p>
              <p className="text-2xl font-bold text-primary">${action.takeProfit?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        )}
        
        {/* NO TRADE Reason */}
        {decision === 'NO TRADE' && action.reason && (
          <div className="p-4 glass border border-destructive/20 rounded-lg">
            <h4 className="text-destructive font-semibold mb-2">Why NO TRADE?</h4>
            <p className="text-muted-foreground">{action.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
