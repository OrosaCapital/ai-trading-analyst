import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, TrendingUp, Zap, Activity, Sparkles, Radio } from "lucide-react";
import { SentimentGauge } from "./SentimentGauge";
import { ProfessionalTradingChart } from "./ProfessionalTradingChart";
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
  const [symbol, setSymbol] = useState("BTCUSD"); // No slash format
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chartData, setChartData] = useState<MultiTimeframeData | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [tatumPrice, setTatumPrice] = useState<number | null>(null);

  // Real-time price streaming
  const { priceData, connectionStatus, isConnected, lastUpdateTime, isPolling } = useRealtimePriceStream(
    chartData?.metadata?.assetType === 'crypto' ? symbol : null,
    streamingEnabled
  );

  // Countdown timer state
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [secondsUntilNext, setSecondsUntilNext] = useState(60);
  const [priceChangeDirection, setPriceChangeDirection] = useState<'up' | 'down' | null>(null);
  const previousPriceRef = useRef<number | null>(null);
  
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
  // Track price direction for subtle color change
  useEffect(() => {
    if (priceData && priceData.price) {
      if (previousPriceRef.current !== null) {
        if (priceData.price > previousPriceRef.current) {
          setPriceChangeDirection('up');
        } else if (priceData.price < previousPriceRef.current) {
          setPriceChangeDirection('down');
        }
        const timeout = setTimeout(() => setPriceChangeDirection(null), 200);
        return () => clearTimeout(timeout);
      }
      previousPriceRef.current = priceData.price;
    }
  }, [priceData]);

  // Simplified toast notifications - only show on initial connection
  useEffect(() => {
    const currentState = `${connectionStatus}-${isPolling}`;
    const previousState = previousConnectionStatusRef.current;
    
    // Only show toast on significant state changes
    if (previousState !== currentState && previousState !== null) {
      if (connectionStatus === 'connected' && chartData?.metadata?.assetType === 'crypto' && !isPolling) {
        // Silent connection - no toast spam
      } else if (connectionStatus === 'error' && !previousState.includes('error')) {
        toast.error('Connection error', {
          duration: 2000,
        });
      }
    }
    
    previousConnectionStatusRef.current = currentState;
  }, [connectionStatus, chartData?.metadata?.assetType, isPolling]);

  const extractSymbol = (text: string): string => {
    const upperText = text.toUpperCase().trim();
    
    // Check for stock tickers first (exact list)
    const stockTickerMatch = upperText.match(/\b([A-Z]{2,5})\b/);
    if (stockTickerMatch && ["AAPL", "TSLA", "GOOGL", "MSFT", "NVDA"].includes(stockTickerMatch[1])) {
      return stockTickerMatch[1];
    }
    
    // Extract any crypto symbol (2-10 characters, alphanumeric)
    const words = upperText.split(/\s+/);
    const cryptoSymbol = words.find(word => 
      word.length >= 2 && 
      word.length <= 10 && 
      /^[A-Z0-9]+$/.test(word) &&
      !['TRADE', 'TRADING', 'BUY', 'SELL', 'CRYPTO', 'COIN', 'TOKEN', 'USD', 'USDT'].includes(word)
    );
    
    if (cryptoSymbol) {
      // Always use USDT format for crypto (CoinGlass standard)
      if (cryptoSymbol.endsWith('USDT')) {
        return cryptoSymbol;
      }
      if (cryptoSymbol.endsWith('USD')) {
        return cryptoSymbol.replace('USD', 'USDT');
      }
      return `${cryptoSymbol}USDT`;
    }
    
    return "BTCUSDT";
  };

  // Format symbol display: BTCUSD -> BTC/USD, ETHUSD -> ETH/USD
  const formatSymbolDisplay = (sym: string): string => {
    if (!sym) return '';
    
    // For crypto pairs ending in USDT
    if (sym.includes('USDT')) {
      const base = sym.replace('USDT', '');
      return `${base}/USDT`;
    }
    
    // For crypto pairs ending in USD
    if (sym.includes('USD')) {
      const base = sym.replace('USD', '');
      return `${base}/USD`;
    }
    
    // For regular stock symbols
    return sym;
  };

  // Get current price from real-time data or latest chart candle
  const getCurrentPrice = (): number => {
    // Priority 1: Real-time WebSocket price (ONLY if symbol matches)
    if (priceData?.price && priceData.price > 0 && priceData.symbol === symbol) {
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

    // Priority 3: Tatum fallback price
    if (tatumPrice && tatumPrice > 0) {
      return tatumPrice;
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

  // Fetch Tatum price as immediate fallback
  useEffect(() => {
    const fetchTatumPrice = async () => {
      if (!symbol) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('fetch-tatum-price', {
          body: { symbol }
        });
        
        if (!error && data?.price && !data.unavailable) {
          setTatumPrice(data.price);
          console.log('✅ Tatum fallback price available:', data.price);
        } else {
          setTatumPrice(null);
        }
      } catch (error) {
        console.error('Error fetching Tatum price:', error);
        setTatumPrice(null);
      }
    };

    fetchTatumPrice();
  }, [symbol]);

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

        if (error || data?.error) {
          const errorMsg = data?.error || error?.message || 'Unknown error';
          setApiError(`Unable to load data for ${symbol}`);
          setChartData(null);
          toast.error(`${symbol.replace('USDT', '').replace('USD', '')} data not available. Try BTC, ETH, or SOL.`);
          console.error('Chart data error:', errorMsg);
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
              <div className="flex items-center gap-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{formatSymbolDisplay(symbol)}</h2>
                  {getCurrentPrice() > 0 && (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-semibold transition-colors duration-200 ${
                        priceChangeDirection === 'up' ? 'text-green-400' :
                        priceChangeDirection === 'down' ? 'text-red-400' :
                        'text-foreground'
                      }`}>
                        ${getCurrentPrice().toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                      {priceData && (
                        <span className={`text-sm font-semibold ${
                          priceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {priceData.change24h >= 0 ? '↑' : '↓'} {Math.abs(priceData.change24h).toFixed(2)}%
                        </span>
                      )}
                      {chartData?.metadata?.assetType === 'crypto' && (
                        <div className={`w-2 h-2 rounded-full ${
                          isConnected && !isPolling ? 'bg-green-400' : 'bg-muted-foreground/30'
                        }`} />
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {chartData?.metadata?.assetType === 'crypto' && lastUpdateTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Next update in {secondsUntilNext}s</span>
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

            <div className="rounded-xl overflow-hidden">
              <ProfessionalTradingChart 
                symbol={symbol ? symbol.replace('/', '') : 'BTCUSD'}
                existingChartData={chartData}
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
