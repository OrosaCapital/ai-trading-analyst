import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Sparkles, TrendingUp, Activity } from "lucide-react";
import { SentimentLegend } from "./SentimentLegend";

interface AnalysisResult {
  summary: string;
  signal: string;
  sentiment: string;
  confidence: string;
  pineScript: string;
}

export const AnalystInterface = () => {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    // Mock analysis result
    setTimeout(() => {
      setResult({
        summary: "Bitcoin is showing strong bullish momentum with price above 50 EMA and 200 EMA. Volume bubbles indicate accumulation at key support levels. Market sentiment is in MILD GREED territory with funding rates neutral. Open interest is rising steadily, suggesting new money entering long positions. Long entry recommended on pullback to $95,000 support zone.",
        signal: "LONG",
        sentiment: "MILD GREED",
        confidence: "78%",
        pineScript: `// @version=6
indicator("Orosa Capital - Market Sentiment", overlay=true)

// User Inputs
emaFastLength = input.int(50, "Fast EMA Length", minval=1)
emaSlowLength = input.int(200, "Slow EMA Length", minval=1)
rsiLength = input.int(14, "RSI Length", minval=1)

// Calculate EMAs
emaFast = ta.ema(close, emaFastLength)
emaSlow = ta.ema(close, emaSlowLength)

// Calculate RSI for sentiment
rsi = ta.rsi(close, rsiLength)

// Determine sentiment based on RSI
var string sentiment = "NEUTRAL"
var color sentimentColor = color.new(color.yellow, 0)

if rsi >= 80
    sentiment := "MAX EUPHORIA"
    sentimentColor := color.new(#E88C9C, 0)
else if rsi >= 70
    sentiment := "EXTREME GREED"
    sentimentColor := color.new(#C73E3E, 0)
else if rsi >= 60
    sentiment := "HIGH GREED"
    sentimentColor := color.new(#D97339, 0)
else if rsi >= 55
    sentiment := "GREED"
    sentimentColor := color.new(#D9A339, 0)
else if rsi >= 50
    sentiment := "MILD GREED"
    sentimentColor := color.new(#D9D339, 0)
else if rsi >= 45
    sentiment := "NEUTRAL"
    sentimentColor := color.new(#C9D339, 0)
else if rsi >= 40
    sentiment := "MILD CAUTION"
    sentimentColor := color.new(#7B3FD9, 0)
else if rsi >= 30
    sentiment := "CAUTION"
    sentimentColor := color.new(#0039D9, 0)
else if rsi >= 25
    sentiment := "CONCERN"
    sentimentColor := color.new(#39A39A, 0)
else if rsi >= 20
    sentiment := "FEAR"
    sentimentColor := color.new(#39C9D9, 0)
else
    sentiment := "MAX FEAR"
    sentimentColor := color.new(#00FF7F, 0)

// Plot EMAs
plot(emaFast, "Fast EMA", color=color.new(#00FF7F, 0), linewidth=2)
plot(emaSlow, "Slow EMA", color=color.new(color.white, 0), linewidth=2)

// Generate signals
longSignal = ta.crossover(emaFast, emaSlow) and rsi < 70
shortSignal = ta.crossunder(emaFast, emaSlow) and rsi > 30

// Plot signals
plotshape(longSignal, "Long Entry", shape.triangleup, location.belowbar, 
          color.new(#00FF7F, 0), size=size.small)
plotshape(shortSignal, "Short Entry", shape.triangledown, location.abovebar, 
          color.new(#C73E3E, 0), size=size.small)

// Display sentiment on chart
var label sentimentLabel = na
if barstate.islast
    label.delete(sentimentLabel)
    sentimentLabel := label.new(bar_index, high, sentiment, 
                     style=label.style_label_down, 
                     color=sentimentColor, 
                     textcolor=color.white, 
                     size=size.large)

// Alert conditions
alertcondition(longSignal, "Long Entry", "Orosa Capital: LONG signal triggered")
alertcondition(shortSignal, "Short Entry", "Orosa Capital: SHORT signal triggered")`
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <section className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary">AI</span> Trading Analyst
          </h2>
          <p className="text-muted-foreground text-lg">
            Ask any trading question and get professional analysis with Pine Script v6 code
          </p>
        </div>

        <Card className="p-6 mb-8 bg-card border-border shadow-xl">
          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="Example: Analyze Bitcoin for long entry opportunities with volume and sentiment analysis..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[120px] bg-secondary border-border text-foreground resize-none"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!query.trim() || isAnalyzing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 self-end"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="mr-2 w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 w-4 h-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Analysis Summary</h3>
                  <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Signal</div>
                  <div className={`text-xl font-bold ${result.signal === 'LONG' ? 'text-chart-green' : 'text-chart-red'}`}>
                    {result.signal}
                  </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Sentiment</div>
                  <div className="text-xl font-bold text-sentiment-mild-greed">
                    {result.sentiment}
                  </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                  <div className="text-xl font-bold text-primary">
                    {result.confidence}
                  </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                  <div className="text-xl font-bold text-sentiment-mild-caution">
                    MEDIUM
                  </div>
                </div>
              </div>
            </Card>

            <SentimentLegend />

            <Card className="p-6 bg-card border-border">
              <Tabs defaultValue="pinescript" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="pinescript">Pine Script v6</TabsTrigger>
                  <TabsTrigger value="json">JSON Output</TabsTrigger>
                </TabsList>

                <TabsContent value="pinescript">
                  <div className="bg-secondary p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Ready-to-use TradingView Indicator</h4>
                    </div>
                    <pre className="text-sm text-muted-foreground overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                      {result.pineScript}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="json">
                  <div className="bg-secondary p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto font-mono">
{`{
  "signal": "LONG",
  "confidence": 0.78,
  "sentiment": "MILD_GREED",
  "trend": {
    "direction": "BULLISH",
    "strength": 0.82,
    "ema50": 94250.50,
    "ema200": 88750.25
  },
  "momentum": {
    "rsi": 58.5,
    "macd_histogram": 1250.75,
    "acceleration": "INCREASING"
  },
  "volume_analysis": {
    "relative_volume": 1.45,
    "open_interest_change": "+12.5%",
    "liquidation_clusters": [95000, 98000]
  },
  "entry_conditions": {
    "price": 95000,
    "stop_loss": 92500,
    "take_profit": [97500, 99000, 101000]
  },
  "risk_level": "MEDIUM"
}`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};
