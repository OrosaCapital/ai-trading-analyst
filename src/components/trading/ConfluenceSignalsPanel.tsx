import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";
import { useConfluenceSignals } from "@/hooks/useConfluenceSignals";
import type { Candle } from "@/lib/indicators";

interface ConfluenceSignalsPanelProps {
  symbol: string;
  candles: Candle[];
}

export function ConfluenceSignalsPanel({ symbol, candles }: ConfluenceSignalsPanelProps) {
  const signals = useConfluenceSignals({ candles, symbol });

  if (!signals) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Multi-Confluence Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Loading signal analysis...
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    bullishScore,
    bearishScore,
    buySignal,
    sellSignal,
    bullishDivergence,
    bearishDivergence,
    trendShift,
    overbought,
    oversold,
    momentumBullish,
    structureBullish,
    volumeBullish,
    ichimokuBullish,
  } = signals;

  const indicators = [
    {
      name: "Macro Trend",
      bullish: bullishScore > bearishScore, // Simplified macro trend
      value: bullishScore > bearishScore ? "Bullish ▲" : "Bearish ▼"
    },
    {
      name: "Current Signal",
      bullish: bullishScore >= 3,
      value: bullishScore >= 3 ? "Bullish ▲" : "Bearish ▼"
    },
    {
      name: "Momentum",
      bullish: momentumBullish,
      value: momentumBullish ? "Bullish ▲" : "Bearish ▼"
    },
    {
      name: "Market Structure",
      bullish: structureBullish,
      value: structureBullish ? "Bullish ▲" : "Bearish ▼"
    },
    {
      name: "Overbought/Oversold",
      bullish: oversold,
      value: oversold ? "Oversold" : overbought ? "Overbought" : "Neutral ⊖"
    },
    {
      name: "Volume & Order Flow",
      bullish: volumeBullish,
      value: volumeBullish ? "Bullish ▲" : "Bearish ▼"
    }
  ];

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Multi-Confluence Signals
          <div className="flex gap-2 ml-auto">
            {buySignal && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                BUY
              </Badge>
            )}
            {sellSignal && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                SELL
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signal Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">{bullishScore}</div>
            <div className="text-sm text-muted-foreground">Bullish Signals</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-red-600">{bearishScore}</div>
            <div className="text-sm text-muted-foreground">Bearish Signals</div>
          </div>
        </div>

        {/* Divergence Alerts */}
        {(bullishDivergence || bearishDivergence) && (
          <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                {bullishDivergence ? "Bullish Divergence Detected" : "Bearish Divergence Detected"}
              </span>
            </div>
          </div>
        )}

        {/* Trend Shift Alert */}
        {trendShift && (
          <div className={`p-3 rounded-lg border ${
            trendShift === 'bullish'
              ? 'border-green-500/20 bg-green-500/10'
              : 'border-red-500/20 bg-red-500/10'
          }`}>
            <div className={`flex items-center gap-2 ${
              trendShift === 'bullish' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trendShift === 'bullish' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium">
                {trendShift === 'bullish' ? 'Bullish' : 'Bearish'} Trend Shift
              </span>
            </div>
          </div>
        )}

        {/* Indicator Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 bg-muted/50 p-3 font-medium text-sm">
            <div>Indicator</div>
            <div>Signal</div>
          </div>
          {indicators.map((indicator, index) => (
            <div key={indicator.name} className={`grid grid-cols-2 p-3 text-sm border-t ${
              index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
            }`}>
              <div className="font-medium">{indicator.name}</div>
              <div className={`flex items-center gap-2 ${
                indicator.bullish ? 'text-green-600' : 'text-red-600'
              }`}>
                {indicator.bullish ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {indicator.value}
              </div>
            </div>
          ))}
        </div>

        {/* Confluence Requirement */}
        <div className="text-xs text-muted-foreground text-center">
          Signals require 3+ confluence indicators
        </div>
      </CardContent>
    </Card>
  );
}