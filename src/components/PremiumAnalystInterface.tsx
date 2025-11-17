import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, TrendingUp, Zap, Activity, Sparkles, Radio } from "lucide-react";
import { SentimentGauge } from "./SentimentGauge";
import { OcapxChart } from "./OcapxChart";
import { PremiumMarketMetrics } from "./PremiumMarketMetrics";
import { EnhancedMarketMetrics } from "./EnhancedMarketMetrics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRealtimePriceStream } from "@/hooks/useRealtimePriceStream";

interface MultiTimeframeData {
  timeframes: {
    '1h': TimeframeData;
    '15m': TimeframeData;
    '5m': TimeframeData;
  };
  metadata: {
    rule: string;
    trend1h: 'bullish' | 'bearish' | 'neutral';
    validSignals: number;
    invalidSignals: number;
    entryPoints: number;
    dataSource?: string;
    assetType?: 'crypto' | 'stock';
  };
}

interface TimeframeData {
  candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    sentiment: number;
    rsi: number;
  }>;
  trend?: 'bullish' | 'bearish' | 'neutral';
  signals?: Array<{
    time: number;
    price: number;
    type: 'buy' | 'sell';
    strength: number;
    reason: string;
    valid: boolean;
    rsi: number;
  }>;
  entryPoints?: Array<{
    time: number;
    price: number;
    type: 'buy' | 'sell';
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
  }>;
  indicators: {
    ema50: Array<{ time: number; value: number }>;
    ema200: Array<{ time: number; value: number }>;
  };
  volumeBubbles: Array<{
    time: number;
    volume: number;
    type: 'buy' | 'sell';
    size: 'small' | 'medium' | 'large';
  }>;
}

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
  const [chartData, setChartData] = useState<MultiTimeframeData | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Real-time price streaming
  const { priceData, connectionStatus, isConnected, lastUpdateTime, isPolling } = useRealtimePriceStream(
    chartData?.metadata?.assetType === 'crypto' ? symbol : null,
    streamingEnabled
  );

  // Countdown timer state
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [secondsUntilNext, setSecondsUntilNext] = useState(60);
  const [showFlash, setShowFlash] = useState(false);
  
  // Track previous connection status to only show toasts on state changes
  const previousConnectionStatusRef = useRef<string | null>(null);

  // Update countdown timer
  useEffect(() => {
    if (!lastUpdateTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastUpdateTime) / 1000;
      setSecondsSinceUpdate(Math.floor(elapsed));
      setSecondsUntilNext(Math.max(0, 60 - Math.floor(elapsed)));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  // Flash animation on price update
  useEffect(() => {
    if (priceData && lastUpdateTime) {
      setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [priceData, lastUpdateTime]);

  // Show toast only on connection status transitions
  useEffect(() => {
    const currentState = `${connectionStatus}-${isPolling}-${chartData?.metadata?.assetType}`;
    const previousState = previousConnectionStatusRef.current;
    
    // Only show toast on state transitions, not on every render
    if (previousState !== currentState) {
      if (connectionStatus === 'connected' && chartData?.metadata?.assetType === 'crypto' && !isPolling && previousState !== null && !previousState.includes('connected')) {
        toast.success(`Live streaming connected`, {
          duration: 2000,
        });
      } else if (connectionStatus === 'error' && previousState !== currentState) {
        toast.error('Connection error - retrying...', {
          duration: 3000,
        });
      } else if (connectionStatus === 'disconnected' && previousState?.includes('connected')) {
        toast.warning('Stream disconnected', {
          duration: 2000,
        });
      } else if (isPolling && chartData?.metadata?.assetType === 'crypto' && !previousState?.includes('true')) {
        toast.info('Using 1-minute polling', {
          duration: 2000,
        });
      }
      
      previousConnectionStatusRef.current = currentState;
    }
  }, [connectionStatus, chartData?.metadata?.assetType, isPolling]);

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

  // Format symbol display: BTCUSD -> BTC/USD, ETHUSD -> ETH/USD
  const formatSymbolDisplay = (sym: string): string => {
    if (!sym) return '';
    
    // For crypto pairs ending in USD/USDT
    if (sym.includes('USD')) {
      const base = sym.replace('USD', '').replace('T', '');
      return `${base}/USD`;
    }
    
    // For regular stock symbols
    return sym;
  };

  // Get current price from real-time data or latest chart candle
  const getCurrentPrice = (): number => {
    // Priority 1: Real-time WebSocket price
    if (priceData?.price && priceData.price > 0) {
      return priceData.price;
    }
    
    // Priority 2: Latest candle from chart
    if (chartData?.timeframes?.['1h']?.candles?.length > 0) {
      const candles = chartData.timeframes['1h'].candles;
      const lastCandle = candles[candles.length - 1];
      if (lastCandle?.close && lastCandle.close > 0) {
        return lastCandle.close;
      }
    }
    
    return 0;
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

  // Fetch chart data when symbol changes
  useEffect(() => {
    const fetchChartData = async () => {
      if (!symbol) return;
      
      setIsLoadingChart(true);
      setApiError(null);
      try {
        const { data, error } = await supabase.functions.invoke('fetch-chart-data', {
          body: { symbol, days: 7 }
        });

        if (error) {
          setApiError(`Failed to load chart data: ${error.message}`);
          setChartData(null);
          return;
        }
        
        setChartData(data);
      } catch (error) {
        console.error('Chart data fetch error:', error);
        setApiError(error instanceof Error ? error.message : 'Unable to connect to data service');
        setChartData(null);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchChartData();
  }, [symbol]);

  return (
    <div className="min-h-screen relative">
      {/* Premium Header Bar */}
      <header className="glass-strong border-b border-border/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="text-3xl font-black text-accent drop-shadow-[0_0_20px_hsl(var(--accent)/0.6)]">OCAPX</div>
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent/50"></div>
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
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">
                  {formatSymbolDisplay(symbol)}
                </h2>
                {getCurrentPrice() > 0 && (
                  <span className="text-xl font-semibold text-primary">
                    current price ${getCurrentPrice().toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  4h data
                </Badge>
              </div>
                {priceData && isConnected && (
                  <div className={`flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 transition-all duration-300 ${
                    showFlash ? 'scale-110 bg-primary/20 border-primary/40' : ''
                  }`}>
                    <span className="text-lg font-bold text-foreground">
                      ${priceData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs font-medium ${
                      priceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {priceData.change24h >= 0 ? '↑' : '↓'} {Math.abs(priceData.change24h).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {chartData?.metadata?.assetType === 'crypto' && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setStreamingEnabled(!streamingEnabled)}
                      className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-all hover:bg-background/50"
                    >
                      <div className={`relative flex items-center gap-2 ${
                        isConnected && !isPolling ? 'text-green-400' :
                        isPolling ? 'text-yellow-400' :
                        connectionStatus === 'connecting' ? 'text-yellow-400' :
                        connectionStatus === 'error' ? 'text-red-400' :
                        'text-muted-foreground'
                      }`}>
                        <Radio className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          {isPolling ? 'POLLING (1m)' :
                           isConnected ? 'STREAMING (1m)' :
                           connectionStatus === 'connecting' ? 'CONNECTING' :
                           connectionStatus === 'error' ? 'ERROR' :
                           'OFFLINE'}
                        </span>
                        {isConnected && !isPolling && (
                          <div className="absolute -right-1 -top-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </div>
                    </button>
                    
                    {lastUpdateTime && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Updated {secondsSinceUpdate}s ago</span>
                        <span>•</span>
                        <span>Next in {secondsUntilNext}s</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {apiError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">{apiError}</span>
                </div>
              </div>
            )}

            <div className="h-[600px] rounded-xl overflow-hidden">
              <OcapxChart 
                symbol={symbol} 
                data={chartData || undefined} 
                isLoading={isLoadingChart}
              />
            </div>
          </div>
        )}

        {/* Market Metrics */}
        {symbol && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <PremiumMarketMetrics symbol={symbol} />
          </div>
        )}

        {/* Enhanced Market Metrics */}
        {symbol && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <EnhancedMarketMetrics 
              symbol={symbol} 
              assetType={chartData?.metadata?.assetType as 'crypto' | 'stock' | undefined}
            />
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
