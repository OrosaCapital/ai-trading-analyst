import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Sparkles, TrendingUp, Activity } from "lucide-react";
import { SentimentLegend } from "./SentimentLegend";
import { TradingViewChart } from "./TradingViewChart";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [symbol, setSymbol] = useState("BTCUSD");

  // Extract symbol from query
  const extractSymbol = (text: string): string => {
    const upperText = text.toUpperCase();
    
    // Common crypto mappings
    const cryptoMap: Record<string, string> = {
      "BITCOIN": "BTCUSD",
      "BTC": "BTCUSD",
      "ETHEREUM": "ETHUSD",
      "ETH": "ETHUSD",
      "SOLANA": "SOLUSD",
      "SOL": "SOLUSD",
      "XRP": "XRPUSD",
      "RIPPLE": "XRPUSD",
      "CARDANO": "ADAUSD",
      "ADA": "ADAUSD",
    };

    // Check for crypto names
    for (const [key, value] of Object.entries(cryptoMap)) {
      if (upperText.includes(key)) {
        return value;
      }
    }

    // Check for stock tickers (3-5 uppercase letters)
    const tickerMatch = upperText.match(/\b([A-Z]{2,5})\b/);
    if (tickerMatch && tickerMatch[1] !== "USD") {
      const ticker = tickerMatch[1];
      // Common stock symbols
      if (["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN", "NVDA", "SPY", "QQQ"].includes(ticker)) {
        return ticker;
      }
    }

    // Check for forex pairs
    const forexMatch = upperText.match(/([A-Z]{3})[\/\s]?([A-Z]{3})/);
    if (forexMatch) {
      return `${forexMatch[1]}${forexMatch[2]}`;
    }

    return "BTCUSD"; // Default
  };

  const handleAnalyze = async () => {
    if (!query.trim()) {
      toast.error("Please enter a trading query");
      return;
    }

    setIsAnalyzing(true);
    const detectedSymbol = extractSymbol(query);
    setSymbol(detectedSymbol);
    
    // Phase 1: Quick summary (fast response)
    try {
      const { data: quickData, error: quickError } = await supabase.functions.invoke('generate-quick-summary', {
        body: { query: query.trim(), symbol: detectedSymbol }
      });
      
      if (quickError) throw quickError;
      
      if (quickData.error) {
        toast.error(quickData.error);
        setIsAnalyzing(false);
        return;
      }
      
      // Show partial results immediately
      setResult({
        summary: quickData.summary,
        signal: quickData.signal,
        sentiment: quickData.sentiment,
        confidence: quickData.confidence,
        pineScript: '// Generating Pine Script code...\n// This may take a few seconds...'
      });
      
      toast.success("Analysis ready! Loading Pine Script...");
      
    } catch (error) {
      console.error('Quick summary error:', error);
      toast.error("Failed to generate summary");
      setIsAnalyzing(false);
      return;
    }
    
    // Phase 2: Full analysis with Pine Script (background)
    try {
      const { data: fullData, error: fullError } = await supabase.functions.invoke('generate-analysis', {
        body: { query: query.trim(), symbol: detectedSymbol }
      });
      
      if (fullError) throw fullError;
      
      if (fullData.error) {
        toast.warning(fullData.error);
        return;
      }
      
      // Update with complete results
      setResult(fullData);
      toast.success("Pine Script generated!");
      
    } catch (error) {
      console.error('Full analysis error:', error);
      toast.warning("Analysis complete, but Pine Script generation encountered an issue");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="min-h-screen py-20 px-4">
      <div className="container mx-auto w-full">
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
          <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border border-primary/20 bg-card">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full p-6 bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    {symbol} Chart
                  </h3>
                  <div className="flex gap-2">
                    {["BTCUSD", "ETHUSD", "SOLUSD", "AAPL", "SPY"].map((s) => (
                      <Button
                        key={s}
                        variant={symbol === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSymbol(s)}
                        className="text-xs"
                      >
                        {s.replace("USD", "")}
                      </Button>
                    ))}
                  </div>
                </div>
                <TradingViewChart symbol={symbol} />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full overflow-y-auto p-6 bg-card space-y-6">
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Analysis Summary</h3>
                      <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
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
                </div>

                <SentimentLegend />

                <div className="pt-4 border-t border-border">
                  <Tabs defaultValue="pinescript" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="pinescript">Pine Script v6</TabsTrigger>
                      <TabsTrigger value="json">JSON Output</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pinescript">
                      <div className="bg-secondary rounded-lg p-4 max-h-[300px] overflow-auto">
                        <pre className="text-xs text-foreground font-mono">
                          <code>{result.pineScript}</code>
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="json">
                      <div className="bg-secondary rounded-lg p-4 max-h-[300px] overflow-auto">
                        <pre className="text-xs text-foreground font-mono">
                          <code>{JSON.stringify(result, null, 2)}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </section>
  );
};
