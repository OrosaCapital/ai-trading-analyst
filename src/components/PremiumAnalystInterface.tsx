import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, TrendingUp, Zap, Activity, Sparkles } from "lucide-react";
import { SentimentGauge } from "./SentimentGauge";
import { OcapxChart } from "./OcapxChart";
import { PremiumMarketMetrics } from "./PremiumMarketMetrics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisResult {
  summary: string;
  signal: string;
  sentiment: string;
  confidence: string;
}

const popularSymbols = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { symbol: "SOL", name: "Solana", icon: "◎" },
  { symbol: "AAPL", name: "Apple", icon: "" },
];

export const PremiumAnalystInterface = () => {
  const [input, setInput] = useState("");
  const [symbol, setSymbol] = useState("BTCUSD");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const extractSymbol = (text: string): string => {
    const upperText = text.toUpperCase();
    const cryptoMap: Record<string, string> = {
      "BTC": "BTCUSD", "BITCOIN": "BTCUSD",
      "ETH": "ETHUSD", "ETHEREUM": "ETHUSD",
      "SOL": "SOLUSD", "SOLANA": "SOLUSD",
      "XRP": "XRPUSD", "RIPPLE": "XRPUSD",
    };

    for (const [key, value] of Object.entries(cryptoMap)) {
      if (upperText.includes(key)) return value;
    }

    const tickerMatch = upperText.match(/\b([A-Z]{2,5})\b/);
    if (tickerMatch && ["AAPL", "TSLA", "GOOGL", "MSFT", "NVDA"].includes(tickerMatch[1])) {
      return tickerMatch[1];
    }

    return "BTCUSD";
  };

  const handleAnalyze = async (symbolInput?: string) => {
    const targetSymbol = symbolInput || extractSymbol(input);
    if (!targetSymbol && !input.trim()) {
      toast.error("Enter a symbol to analyze");
      return;
    }

    setIsAnalyzing(true);
    setSymbol(targetSymbol);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quick-summary', {
        body: { query: input || targetSymbol, symbol: targetSymbol }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult({
        summary: data.summary,
        signal: data.signal,
        sentiment: data.sentiment,
        confidence: data.confidence,
      });

      toast.success("Analysis complete!");
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickSymbol = (sym: string) => {
    const fullSymbol = sym === "AAPL" ? "AAPL" : `${sym}USD`;
    setInput(sym);
    handleAnalyze(fullSymbol);
  };

  return (
    <div className="min-h-screen relative">
      {/* Premium Header Bar */}
      <header className="glass-strong border-b border-border/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="text-3xl font-black text-gradient">OCAPX</div>
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent"></div>
            </div>
            <div className="h-6 w-px bg-border/50"></div>
            <span className="text-sm font-medium text-muted-foreground">AI Trading Terminal</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow"></div>
              <span className="text-muted-foreground">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Command Center Input */}
        <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              Enter Symbol to <span className="text-gradient">Analyze</span>
            </h1>
            <p className="text-muted-foreground">
              Get AI-powered insights with real-time market data and sentiment analysis
            </p>
          </div>

          {/* Premium Input */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="BTC, ETH, AAPL, TSLA..."
                  className="flex-1 h-14 glass-strong text-lg font-medium placeholder:text-muted-foreground/50 border-border/30 focus:border-primary/50 transition-colors"
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-primary to-primary-glow hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Access Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {popularSymbols.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleQuickSymbol(item.symbol)}
                  disabled={isAnalyzing}
                  className="glass px-6 py-3 rounded-full hover:bg-primary/10 hover:border-primary/50 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <span className="text-lg">{item.icon}</span>}
                    <span className="font-semibold">{item.symbol}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        {symbol && (
          <div className="glass rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">{symbol} Chart</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                Real-time Data
              </div>
            </div>
            <div className="h-[600px] rounded-xl overflow-hidden">
              <OcapxChart symbol={symbol} />
            </div>
          </div>
        )}

        {/* Market Metrics */}
        {symbol && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <PremiumMarketMetrics symbol={symbol} />
          </div>
        )}

        {/* AI Analysis Panel */}
        {result && (
          <div className="glass rounded-2xl p-8 space-y-6 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">AI Analysis</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-strong rounded-xl p-6 space-y-2">
                <div className="text-sm text-muted-foreground">Signal</div>
                <div className={`text-3xl font-bold ${
                  result.signal === 'BUY' ? 'text-chart-green' :
                  result.signal === 'SELL' ? 'text-chart-red' :
                  'text-muted-foreground'
                }`}>
                  {result.signal}
                </div>
              </div>

              <div className="glass-strong rounded-xl p-6 space-y-2">
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="text-3xl font-bold">{result.confidence}</div>
              </div>

              <div className="glass-strong rounded-xl p-6 space-y-2">
                <div className="text-sm text-muted-foreground">Sentiment</div>
                <div className="text-3xl font-bold">{result.sentiment}</div>
              </div>
            </div>

            <div className="glass-strong rounded-xl p-6">
              <div className="text-sm text-muted-foreground mb-3">Summary</div>
              <p className="text-foreground leading-relaxed">{result.summary}</p>
            </div>
          </div>
        )}

        {/* Sentiment Gauge */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <SentimentGauge />
        </div>
      </div>
    </div>
  );
};
