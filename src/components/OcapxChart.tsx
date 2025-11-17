import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, CandlestickSeries, LineSeries } from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, Activity, Zap, Target, Shield } from "lucide-react";
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
  oi?: number;
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

interface TrendAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  emaScore: number;
  momentumScore: number;
  structureScore: number;
  sentimentScore: number;
  higherHighs: number;
  higherLows: number;
  lowerHighs: number;
  lowerLows: number;
  breakOfStructure: boolean;
}

interface SetupScore {
  volumeBubbleAlign: boolean;
  oiExpanding: boolean;
  rsiZone: boolean;
  emotionalShift: boolean;
  bosConfirmed: boolean;
  pullbackValid: boolean;
  consolidationBreak: boolean;
  totalScore: number;
  isValid: boolean;
}

interface TradingSignal {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  strength: number;
  reason: string;
  valid: boolean;
  rsi: number;
  setupScore?: SetupScore;
}

interface EntryValidation {
  microBOS: boolean;
  candlePattern: string | null;
  volumeConfirm: boolean;
  bubbleBurst: boolean;
  momentumFlip: boolean;
  wrFormation: boolean;
  aiConfidence: number;
  aiTrigger: 'BUY' | 'SELL' | 'WAIT';
  entryScore: number;
}

interface MicroConfirmation {
  breakoutConfirmed: boolean;
  volumeSustained: boolean;
  momentumContinues: boolean;
  confirmationScore: number;
  recommendation: 'ENTER NOW' | 'WAIT' | 'SKIP';
}

interface EntryPoint {
  time: number;
  price: number;
  type: 'buy' | 'sell';
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  validation?: EntryValidation;
  microConfirmation?: MicroConfirmation;
}

interface TimeframeData {
  candles: Candle[];
  trend?: 'bullish' | 'bearish' | 'neutral';
  trendAnalysis?: TrendAnalysis;
  signals?: TradingSignal[];
  entryPoints?: EntryPoint[];
  indicators: {
    ema50?: IndicatorPoint[];
    ema200?: IndicatorPoint[];
    ema20?: IndicatorPoint[];
  };
  volumeBubbles: VolumeBubble[];
}

interface MultiTimeframeData {
  timeframes: {
    '1h': TimeframeData;
    '15m': TimeframeData;
    '5m': TimeframeData;
    '1m'?: TimeframeData;
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

const TrendBadge = ({ trend, size = 'md' }: { trend: 'bullish' | 'bearish' | 'neutral'; size?: 'sm' | 'md' | 'lg' }) => {
  const config = {
    bullish: { icon: TrendingUp, label: 'BULLISH', color: 'text-[hsl(var(--chart-green))]', bg: 'bg-[hsl(var(--chart-green))]/10' },
    bearish: { icon: TrendingDown, label: 'BEARISH', color: 'text-[hsl(var(--chart-red))]', bg: 'bg-[hsl(var(--chart-red))]/10' },
    neutral: { icon: Minus, label: 'NEUTRAL', color: 'text-muted-foreground', bg: 'bg-muted' },
  };
  
  const { icon: Icon, label, color, bg } = config[trend];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5';
  
  return (
    <div className={`flex items-center gap-2 rounded-lg ${bg} ${color} font-semibold ${sizeClass}`}>
      <Icon className="w-4 h-4" />
      {label}
    </div>
  );
};

export const OcapxChart = ({ symbol, data, isLoading }: OcapxChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<'1h' | '15m' | '5m' | '1m'>('15m');

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: 'rgba(255, 255, 255, 0.9)' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    chartRef.current = chart;

    const timeframeData = data.timeframes[activeTimeframe];
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'rgba(76, 255, 186, 0.9)',
      downColor: 'rgba(255, 71, 133, 0.9)',
      borderUpColor: 'rgba(76, 255, 186, 1)',
      borderDownColor: 'rgba(255, 71, 133, 1)',
      wickUpColor: 'rgba(76, 255, 186, 0.8)',
      wickDownColor: 'rgba(255, 71, 133, 0.8)',
    });

    const candleData = timeframeData.candles.map(c => {
      const colors = getSentimentColor(c.sentiment);
      return {
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        color: c.close >= c.open ? colors.up : colors.down,
      };
    });

    candlestickSeries.setData(candleData);

    if (timeframeData.indicators.ema50) {
      const ema50Series = chart.addSeries(LineSeries, { color: 'rgba(255, 206, 86, 0.8)', lineWidth: 2, title: 'EMA 50' });
      ema50Series.setData(timeframeData.indicators.ema50.map(p => ({ time: p.time as any, value: p.value })));
    }

    if (timeframeData.indicators.ema200) {
      const ema200Series = chart.addSeries(LineSeries, { color: 'rgba(54, 162, 235, 0.8)', lineWidth: 2, title: 'EMA 200' });
      ema200Series.setData(timeframeData.indicators.ema200.map(p => ({ time: p.time as any, value: p.value })));
    }

    if (timeframeData.indicators.ema20) {
      const ema20Series = chart.addSeries(LineSeries, { color: 'rgba(153, 102, 255, 0.8)', lineWidth: 2, title: 'EMA 20' });
      ema20Series.setData(timeframeData.indicators.ema20.map(p => ({ time: p.time as any, value: p.value })));
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, activeTimeframe]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!data || !symbol) {
    return (
      <div className="flex items-center justify-center h-[500px] border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm">
        <p className="text-muted-foreground">Enter a symbol to view multi-timeframe analysis</p>
      </div>
    );
  }

  const trendAnalysis = data.timeframes['1h'].trendAnalysis;
  const signals15m = data.timeframes['15m'].signals || [];
  const validSignals = signals15m.filter(s => s.valid);
  const invalidSignals = signals15m.filter(s => !s.valid);
  const entryPoints = data.timeframes['5m'].entryPoints || [];

  return (
    <div className="space-y-6">
      {/* Trading Rule Panel */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-2">📌 Day Trading Rule</h3>
            <p className="text-muted-foreground mb-3">{data.metadata.rule}</p>
            <div className="flex items-center gap-3">
              {data.metadata.trend1h !== 'neutral' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[hsl(var(--chart-green))]" />
                  <span className="text-[hsl(var(--chart-green))] font-semibold">Conditions Met - Safe to Trade</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-[hsl(var(--chart-red))]" />
                  <span className="text-[hsl(var(--chart-red))] font-semibold">Wait for Alignment - 1H is Neutral</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Alignment Dashboard */}
      {trendAnalysis && (
        <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            STEP 1: 1H Trend Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Trend</span>
                <TrendBadge trend={trendAnalysis.trend} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="text-lg font-bold text-primary">{trendAnalysis.confidence.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">EMAs</span>
                <span className={`font-semibold ${trendAnalysis.emaScore > 60 ? 'text-[hsl(var(--chart-green))]' : trendAnalysis.emaScore < 40 ? 'text-[hsl(var(--chart-red))]' : 'text-muted-foreground'}`}>
                  {trendAnalysis.emaScore.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Momentum</span>
                <span className={`font-semibold ${trendAnalysis.momentumScore > 60 ? 'text-[hsl(var(--chart-green))]' : trendAnalysis.momentumScore < 40 ? 'text-[hsl(var(--chart-red))]' : 'text-muted-foreground'}`}>
                  {trendAnalysis.momentumScore.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Structure</span>
                <span className={`font-semibold ${trendAnalysis.structureScore > 60 ? 'text-[hsl(var(--chart-green))]' : trendAnalysis.structureScore < 40 ? 'text-[hsl(var(--chart-red))]' : 'text-muted-foreground'}`}>
                  {trendAnalysis.structureScore.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sentiment</span>
                <span className={`font-semibold ${trendAnalysis.sentimentScore > 60 ? 'text-[hsl(var(--chart-green))]' : trendAnalysis.sentimentScore < 40 ? 'text-[hsl(var(--chart-red))]' : 'text-muted-foreground'}`}>
                  {trendAnalysis.sentimentScore.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--chart-green))]">{trendAnalysis.higherHighs}</div>
              <div className="text-xs text-muted-foreground">Higher Highs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--chart-green))]">{trendAnalysis.higherLows}</div>
              <div className="text-xs text-muted-foreground">Higher Lows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--chart-red))]">{trendAnalysis.lowerHighs}</div>
              <div className="text-xs text-muted-foreground">Lower Highs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[hsl(var(--chart-red))]">{trendAnalysis.lowerLows}</div>
              <div className="text-xs text-muted-foreground">Lower Lows</div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Timeframe Chart */}
      <Tabs value={activeTimeframe} onValueChange={(v) => setActiveTimeframe(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="1h" className="flex flex-col gap-1">
            <span>1H Trend</span>
            <TrendBadge trend={data.metadata.trend1h} size="sm" />
          </TabsTrigger>
          <TabsTrigger value="15m" className="flex flex-col gap-1">
            <span>15M Signal</span>
            <span className="text-xs text-[hsl(var(--chart-green))]">{validSignals.length} Valid</span>
          </TabsTrigger>
          <TabsTrigger value="5m" className="flex flex-col gap-1">
            <span>5M Entry</span>
            <span className="text-xs text-primary">{entryPoints.length} Points</span>
          </TabsTrigger>
          <TabsTrigger value="1m" className="flex flex-col gap-1">
            <span>1M Confirm</span>
            <span className="text-xs text-muted-foreground">Precision</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="1h" className="space-y-4">
          <div ref={chartContainerRef} className="w-full rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden" />
        </TabsContent>

        <TabsContent value="15m" className="space-y-4">
          <div ref={chartContainerRef} className="w-full rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden" />
          
          {/* STEP 2: Setup Signals */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              STEP 2: 15M Setup Formation ({signals15m.length} signals)
            </h3>
            
            <div className="space-y-3">
              {validSignals.slice(-3).map((signal, idx) => (
                <div key={idx} className="bg-[hsl(var(--chart-green))]/10 border border-[hsl(var(--chart-green))]/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[hsl(var(--chart-green))]" />
                      <span className="font-bold text-[hsl(var(--chart-green))]">{signal.type.toUpperCase()} Signal</span>
                      <span className="text-sm text-muted-foreground">${signal.price.toFixed(2)}</span>
                    </div>
                    <span className="text-sm font-semibold text-[hsl(var(--chart-green))]">
                      Setup: {signal.setupScore?.totalScore}/7 ✓
                    </span>
                  </div>
                  {signal.setupScore && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={signal.setupScore.volumeBubbleAlign ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {signal.setupScore.volumeBubbleAlign ? '✓' : '✗'} Volume Aligned
                      </div>
                      <div className={signal.setupScore.oiExpanding ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {signal.setupScore.oiExpanding ? '✓' : '✗'} OI Expanding
                      </div>
                      <div className={signal.setupScore.rsiZone ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {signal.setupScore.rsiZone ? '✓' : '✗'} RSI Zone
                      </div>
                      <div className={signal.setupScore.emotionalShift ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {signal.setupScore.emotionalShift ? '✓' : '✗'} Emotional Shift
                      </div>
                      <div className={signal.setupScore.bosConfirmed ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {signal.setupScore.bosConfirmed ? '✓' : '✗'} BOS Confirmed
                      </div>
                      <div className={signal.setupScore.pullbackValid ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {signal.setupScore.pullbackValid ? '✓' : '✗'} Valid Pullback
                      </div>
                      <div className={signal.setupScore.consolidationBreak ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {signal.setupScore.consolidationBreak ? '✓' : '✗'} Consolidation Break
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {invalidSignals.length > 0 && (
                <div className="bg-[hsl(var(--chart-red))]/10 border border-[hsl(var(--chart-red))]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-[hsl(var(--chart-red))]" />
                    <span className="font-bold text-[hsl(var(--chart-red))]">{invalidSignals.length} Invalid Signals</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These signals were filtered out due to 1H trend misalignment or low setup scores
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="5m" className="space-y-4">
          <div ref={chartContainerRef} className="w-full rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden" />
          
          {/* STEP 3: Entry Points */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              STEP 3: 5M Entry Execution ({entryPoints.length} entries)
            </h3>
            
            <div className="space-y-4">
              {entryPoints.slice(-2).map((entry, idx) => (
                <div key={idx} className="bg-primary/10 border border-primary/30 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${entry.type === 'buy' ? 'bg-[hsl(var(--chart-green))]/20' : 'bg-[hsl(var(--chart-red))]/20'}`}>
                        {entry.type === 'buy' ? <TrendingUp className="w-6 h-6 text-[hsl(var(--chart-green))]" /> : <TrendingDown className="w-6 h-6 text-[hsl(var(--chart-red))]" />}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{entry.type.toUpperCase()} Entry</div>
                        <div className="text-sm text-muted-foreground">${entry.price.toFixed(2)}</div>
                      </div>
                    </div>
                    {entry.validation && (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${entry.validation.aiConfidence > 70 ? 'text-[hsl(var(--chart-green))]' : 'text-primary'}`}>
                          {entry.validation.aiConfidence.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">AI Confidence</div>
                      </div>
                    )}
                  </div>
                  
                  {entry.validation && (
                    <div className="mb-4 p-3 bg-background/50 rounded-lg">
                      <div className="font-semibold text-sm mb-2">Entry Checklist ({entry.validation.entryScore}/6)</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={entry.validation.microBOS ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {entry.validation.microBOS ? '✓' : '✗'} Micro-BOS
                        </div>
                        <div className={entry.validation.candlePattern ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {entry.validation.candlePattern ? `✓ ${entry.validation.candlePattern}` : '✗ No Pattern'}
                        </div>
                        <div className={entry.validation.volumeConfirm ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {entry.validation.volumeConfirm ? '✓' : '✗'} Volume Confirm
                        </div>
                        <div className={entry.validation.bubbleBurst ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {entry.validation.bubbleBurst ? '✓' : '✗'} Bubble Burst
                        </div>
                        <div className={entry.validation.momentumFlip ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {entry.validation.momentumFlip ? '✓' : '✗'} Momentum Flip
                        </div>
                        <div className={entry.validation.wrFormation ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {entry.validation.wrFormation ? '✓' : '✗'} W/R Formation
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-2 bg-background/50 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Stop Loss</div>
                      <div className="font-semibold text-[hsl(var(--chart-red))]">${entry.stopLoss.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Take Profit</div>
                      <div className="font-semibold text-[hsl(var(--chart-green))]">${entry.takeProfit.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-2 bg-background/50 rounded">
                      <div className="text-xs text-muted-foreground mb-1">R:R</div>
                      <div className="font-semibold text-primary">1:{entry.riskReward.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="1m" className="space-y-4">
          <div ref={chartContainerRef} className="w-full rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden" />
          
          {/* STEP 4: Micro-Confirmation */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              STEP 4: 1M Micro-Confirmation (Optional Precision)
            </h3>
            
            <div className="space-y-3">
              {entryPoints.slice(-2).map((entry, idx) => (
                entry.microConfirmation && (
                  <div key={idx} className={`border rounded-lg p-4 ${
                    entry.microConfirmation.recommendation === 'ENTER NOW' ? 'bg-[hsl(var(--chart-green))]/10 border-[hsl(var(--chart-green))]/30' :
                    entry.microConfirmation.recommendation === 'SKIP' ? 'bg-[hsl(var(--chart-red))]/10 border-[hsl(var(--chart-red))]/30' :
                    'bg-muted/10 border-muted/30'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold">{entry.type.toUpperCase()} @ ${entry.price.toFixed(2)}</span>
                      <span className={`font-bold text-lg ${
                        entry.microConfirmation.recommendation === 'ENTER NOW' ? 'text-[hsl(var(--chart-green))]' :
                        entry.microConfirmation.recommendation === 'SKIP' ? 'text-[hsl(var(--chart-red))]' :
                        'text-muted-foreground'
                      }`}>
                        {entry.microConfirmation.recommendation}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={entry.microConfirmation.breakoutConfirmed ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {entry.microConfirmation.breakoutConfirmed ? '✓' : '✗'} Breakout
                      </div>
                      <div className={entry.microConfirmation.volumeSustained ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {entry.microConfirmation.volumeSustained ? '✓' : '✗'} Volume
                      </div>
                      <div className={entry.microConfirmation.momentumContinues ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                        {entry.microConfirmation.momentumContinues ? '✓' : '✗'} Momentum
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-sm font-semibold">Confirmation: {entry.microConfirmation.confirmationScore}/3</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
