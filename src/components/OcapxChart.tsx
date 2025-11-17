import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, CandlestickSeries, LineSeries } from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, ArrowUp, ArrowDown, Activity, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sentiment: number;
  rsi: number;
}

interface IndicatorPoint {
  time: number;
  value: number;
}

interface VolumeBubble {
  time: number;
  volume: number;
  type: 'buy' | 'sell';
  size: 'small' | 'medium' | 'large';
}

interface TradingSignal {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  strength: number;
  reason: string;
  valid: boolean;
  rsi: number;
}

interface EntryPoint {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
}

interface TimeframeData {
  candles: Candle[];
  trend?: 'bullish' | 'bearish' | 'neutral';
  signals?: TradingSignal[];
  entryPoints?: EntryPoint[];
  indicators: {
    ema50: IndicatorPoint[];
    ema200: IndicatorPoint[];
  };
  volumeBubbles: VolumeBubble[];
}

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
  };
}

interface OcapxChartProps {
  symbol?: string;
  data?: MultiTimeframeData;
  isLoading?: boolean;
}

function getSentimentColor(sentiment: number): { up: string; down: string } {
  if (sentiment >= 8) return { up: 'rgba(255, 71, 133, 0.9)', down: 'rgba(255, 71, 133, 0.7)' };
  if (sentiment >= 6.5) return { up: 'rgba(255, 107, 129, 0.9)', down: 'rgba(255, 107, 129, 0.7)' };
  if (sentiment >= 5.5) return { up: 'rgba(255, 167, 121, 0.9)', down: 'rgba(255, 167, 121, 0.7)' };
  if (sentiment >= 4.5) return { up: 'rgba(255, 207, 115, 0.9)', down: 'rgba(255, 207, 115, 0.7)' };
  if (sentiment >= 3.5) return { up: 'rgba(200, 230, 145, 0.9)', down: 'rgba(200, 230, 145, 0.7)' };
  if (sentiment >= 2) return { up: 'rgba(152, 255, 246, 0.9)', down: 'rgba(152, 255, 246, 0.7)' };
  return { up: 'rgba(102, 255, 240, 0.9)', down: 'rgba(102, 255, 240, 0.7)' };
}

const TrendBadge = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  const config = {
    bullish: { icon: TrendingUp, label: 'BULLISH', color: 'text-[hsl(var(--chart-green))]', bg: 'bg-[hsl(var(--chart-green))]/10' },
    bearish: { icon: TrendingDown, label: 'BEARISH', color: 'text-[hsl(var(--chart-red))]', bg: 'bg-[hsl(var(--chart-red))]/10' },
    neutral: { icon: Minus, label: 'NEUTRAL', color: 'text-muted-foreground', bg: 'bg-muted' },
  };
  
  const { icon: Icon, label, color, bg } = config[trend];
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bg} ${color} font-semibold text-sm`}>
      <Icon className="w-4 h-4" />
      {label}
    </div>
  );
};

export const OcapxChart = ({ symbol, data, isLoading }: OcapxChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<'1h' | '15m' | '5m'>('15m');

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(152, 255, 246, 0.5)',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: 'rgba(152, 255, 246, 0.5)',
          width: 1,
          style: 3,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    const renderChart = (timeframe: '1h' | '15m' | '5m') => {
      const tfData = data.timeframes[timeframe];
      
      const candleData = tfData.candles.map((candle) => {
        const colors = getSentimentColor(candle.sentiment);
        return {
          time: candle.time as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          color: candle.close >= candle.open ? colors.up : colors.down,
          borderColor: candle.close >= candle.open ? colors.up : colors.down,
          wickColor: candle.close >= candle.open ? colors.up : colors.down,
        };
      });

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: 'rgba(152, 255, 246, 0.9)',
        downColor: 'rgba(255, 71, 133, 0.9)',
        borderVisible: true,
        wickVisible: true,
      });
      candlestickSeries.setData(candleData);

      const ema50Data = tfData.indicators.ema50.map(point => ({
        time: point.time as any,
        value: point.value,
      }));
      
      const ema50Series = chart.addSeries(LineSeries, {
        color: 'rgba(76, 175, 80, 0.8)',
        lineWidth: 2,
        title: 'EMA 50',
      });
      ema50Series.setData(ema50Data);

      const ema200Data = tfData.indicators.ema200.map(point => ({
        time: point.time as any,
        value: point.value,
      }));
      
      const ema200Series = chart.addSeries(LineSeries, {
        color: 'rgba(255, 255, 255, 0.6)',
        lineWidth: 2,
        title: 'EMA 200',
      });
      ema200Series.setData(ema200Data);

      chart.timeScale().fitContent();
    };

    renderChart(activeTimeframe);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, activeTimeframe]);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-muted-foreground text-lg">Select a symbol to view multi-timeframe analysis</p>
      </div>
    );
  }

  const { timeframes, metadata } = data;
  const validSignals = timeframes['15m'].signals?.filter(s => s.valid) || [];
  const invalidSignals = timeframes['15m'].signals?.filter(s => !s.valid) || [];
  const entries = timeframes['5m'].entryPoints || [];

  return (
    <div className="space-y-6">
      {/* Trading Rule Panel */}
      <div className="glass rounded-2xl p-6 border-2 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="text-4xl">📌</div>
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold text-foreground">Day Trading Rule</h3>
            <p className="text-muted-foreground">
              {metadata.rule}
            </p>
            <div className="flex items-center gap-2 pt-2">
              {metadata.trend1h !== 'neutral' ? (
                <div className="flex items-center gap-2 text-[hsl(var(--chart-green))]">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Conditions Met - Safe to Trade</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[hsl(var(--chart-red))]">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Wait for Alignment - 1H Trend is Neutral</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Alignment Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 space-y-3">
          <div className="text-sm text-muted-foreground font-medium">1H TREND</div>
          <TrendBadge trend={metadata.trend1h} />
          <div className="text-xs text-muted-foreground">Institutional Flow</div>
        </div>

        <div className="glass rounded-2xl p-6 space-y-3">
          <div className="text-sm text-muted-foreground font-medium">15M SIGNALS</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--chart-green))]" />
              <span className="text-2xl font-bold text-[hsl(var(--chart-green))]">{metadata.validSignals}</span>
              <span className="text-sm text-muted-foreground">Valid</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[hsl(var(--chart-red))]" />
              <span className="text-2xl font-bold text-[hsl(var(--chart-red))]">{metadata.invalidSignals}</span>
              <span className="text-sm text-muted-foreground">Invalid</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Pattern Detection</div>
        </div>

        <div className="glass rounded-2xl p-6 space-y-3">
          <div className="text-sm text-muted-foreground font-medium">5M ENTRIES</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{metadata.entryPoints}</span>
            <span className="text-sm text-muted-foreground">Entry Points</span>
          </div>
          <div className="text-xs text-muted-foreground">Precision Timing</div>
        </div>
      </div>

      {/* Chart with Tabs */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {symbol} Multi-Timeframe Analysis
          </h2>
        </div>

        <Tabs value={activeTimeframe} onValueChange={(v) => setActiveTimeframe(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="1h" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              1H Trend
              <TrendBadge trend={metadata.trend1h} />
            </TabsTrigger>
            <TabsTrigger value="15m" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              15M Signal
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                {metadata.validSignals} Valid
              </span>
            </TabsTrigger>
            <TabsTrigger value="5m" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              5M Entry
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                {metadata.entryPoints} Points
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="1h">
            <div ref={chartContainerRef} className="w-full" />
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>1H Timeframe:</strong> Shows the overall institutional flow and market direction. 
                Only take trades when this trend is clearly defined (bullish or bearish).
              </p>
            </div>
          </TabsContent>

          <TabsContent value="15m">
            <div ref={chartContainerRef} className="w-full" />
            {timeframes['15m'].signals && timeframes['15m'].signals.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold text-foreground">Trading Signals</h3>
                <div className="grid gap-2">
                  {timeframes['15m'].signals.slice(-5).reverse().map((signal, i) => (
                    <div key={i} className={`p-3 rounded-lg flex items-center justify-between ${signal.valid ? 'bg-[hsl(var(--chart-green))]/10 border border-[hsl(var(--chart-green))]/20' : 'bg-[hsl(var(--chart-red))]/10 border border-[hsl(var(--chart-red))]/20'}`}>
                      <div className="flex items-center gap-3">
                        {signal.valid ? (
                          <CheckCircle2 className="w-5 h-5 text-[hsl(var(--chart-green))]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-[hsl(var(--chart-red))]" />
                        )}
                        <div>
                          <div className="font-semibold text-sm">
                            {signal.type === 'buy' ? <ArrowUp className="w-4 h-4 inline text-[hsl(var(--chart-green))]" /> : <ArrowDown className="w-4 h-4 inline text-[hsl(var(--chart-red))]" />}
                            {' '}{signal.type.toUpperCase()} at ${signal.price.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">{signal.reason} • RSI: {signal.rsi.toFixed(1)}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${signal.valid ? 'bg-[hsl(var(--chart-green))]/20 text-[hsl(var(--chart-green))]' : 'bg-[hsl(var(--chart-red))]/20 text-[hsl(var(--chart-red))]'}`}>
                        {signal.valid ? '✓ VALID' : '⚠️ INVALID'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="5m">
            <div ref={chartContainerRef} className="w-full" />
            {entries.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold text-foreground">Precise Entry Points</h3>
                <div className="grid gap-2">
                  {entries.map((entry, i) => (
                    <div key={i} className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {entry.type === 'buy' ? (
                            <ArrowUp className="w-5 h-5 text-[hsl(var(--chart-green))]" />
                          ) : (
                            <ArrowDown className="w-5 h-5 text-[hsl(var(--chart-red))]" />
                          )}
                          <span className="font-bold text-lg">{entry.type.toUpperCase()}</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">${entry.price.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stop Loss:</span>
                          <div className="font-semibold text-[hsl(var(--chart-red))]">${entry.stopLoss.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Take Profit:</span>
                          <div className="font-semibold text-[hsl(var(--chart-green))]">${entry.takeProfit.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risk/Reward:</span>
                          <div className="font-semibold text-primary">1:{entry.riskReward}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {timeframes[activeTimeframe].volumeBubbles.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-green))]" />
            <span>Volume Spikes Detected: {timeframes[activeTimeframe].volumeBubbles.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};
