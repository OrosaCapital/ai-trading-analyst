import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  const [activeTimeframe, setActiveTimeframe] = useState<'1h' | '15m'>('15m');

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: 'hsl(197, 100%, 44%)' },
      grid: { 
        vertLines: { color: 'rgba(0, 255, 255, 0.08)', style: 2 }, 
        horzLines: { color: 'rgba(0, 255, 255, 0.08)', style: 2 } 
      },
      width: chartContainerRef.current.clientWidth,
      height: 680,
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false,
        barSpacing: 8,
        minBarSpacing: 4,
        rightOffset: 12,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        vertLine: { color: 'hsl(75, 100%, 50%)', width: 2, labelBackgroundColor: 'hsl(75, 100%, 50%)' },
        horzLine: { color: 'hsl(75, 100%, 50%)', width: 2, labelBackgroundColor: 'hsl(75, 100%, 50%)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(0, 255, 255, 0.2)',
      },
    });

    chartRef.current = chart;

    const timeframeData = data.timeframes[activeTimeframe];
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(75, 100%, 50%)',
      downColor: 'hsl(5, 85%, 60%)',
      borderUpColor: 'hsl(75, 100%, 50%)',
      borderDownColor: 'hsl(5, 85%, 60%)',
      wickUpColor: 'hsl(75, 100%, 50%)',
      wickDownColor: 'hsl(5, 85%, 60%)',
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

    // Add volume histogram
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(0, 255, 255, 0.3)',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    // Map volume data with colors based on candle direction
    const volumeData = timeframeData.candles.map(c => ({
      time: c.time as any,
      value: c.volume || 0,
      color: c.close >= c.open 
        ? 'rgba(126, 255, 51, 0.4)'  // Green for up
        : 'rgba(255, 77, 77, 0.4)'   // Red for down
    }));

    volumeSeries.setData(volumeData);
    
    // Position volume at bottom of chart
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    if (timeframeData.indicators.ema50) {
      const ema50Series = chart.addSeries(LineSeries, { 
        color: 'hsl(197, 100%, 54%)', 
        lineWidth: 3, 
        title: 'EMA 50',
        lastValueVisible: true,
        priceLineVisible: true,
      });
      ema50Series.setData(timeframeData.indicators.ema50.map(p => ({ time: p.time as any, value: p.value })));
    }

    if (timeframeData.indicators.ema200) {
      const ema200Series = chart.addSeries(LineSeries, { 
        color: 'hsl(280, 100%, 60%)', 
        lineWidth: 3, 
        title: 'EMA 200',
        lastValueVisible: true,
        priceLineVisible: true,
      });
      ema200Series.setData(timeframeData.indicators.ema200.map(p => ({ time: p.time as any, value: p.value })));
    }

    if (timeframeData.indicators.ema20) {
      const ema20Series = chart.addSeries(LineSeries, { 
        color: 'hsl(330, 100%, 60%)', 
        lineWidth: 3, 
        title: 'EMA 20',
        lastValueVisible: true,
        priceLineVisible: true,
      });
      ema20Series.setData(timeframeData.indicators.ema20.map(p => ({ time: p.time as any, value: p.value })));
    }

    // Limit visible range based on timeframe
    const visibleBars = {
      '1h': 48,   // 2 days
      '15m': 96,  // 24 hours
    }[activeTimeframe];

    if (candleData.length > 0) {
      const from = Math.max(0, candleData.length - visibleBars);
      chart.timeScale().setVisibleLogicalRange({
        from: from,
        to: candleData.length - 1
      });
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


      {/* Timeframe Selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTimeframe('1h')}
          className={`px-6 py-3 rounded-lg border transition-all ${
            activeTimeframe === '1h'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium">1H Chart</span>
            <TrendBadge trend={data.metadata.trend1h} size="sm" />
          </div>
        </button>
        
        <button
          onClick={() => setActiveTimeframe('15m')}
          className={`px-6 py-3 rounded-lg border transition-all ${
            activeTimeframe === '15m'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium">15M Chart</span>
            <span className="text-xs text-[hsl(var(--chart-green))]">{validSignals.length} Valid</span>
          </div>
        </button>
      </div>

      {/* Single Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-[680px] rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm" 
      />

      {/* Zoom Controls Hint */}
      <div className="text-xs text-muted-foreground text-center mt-2">
        Scroll to zoom • Drag to pan • Double-click to reset
      </div>

      {/* Multi-Timeframe Analysis Workflow */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Multi-Timeframe Analysis Workflow</h2>
          <p className="text-muted-foreground">Follow these 4 steps in sequence for high-probability trade entries</p>
        </div>
        
        <Accordion type="multiple" defaultValue={["step1", "step2", "step3", "step4"]} className="space-y-4">
        {/* STEP 1: 1H Trend Analysis */}
        <AccordionItem value="step1" className="bg-card/50 border border-border/50 rounded-xl px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">1</div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  1H Trend Analysis
                </h3>
                <p className="text-xs text-muted-foreground">Momentum • Structure • Sentiment Alignment</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {trendAnalysis && (
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
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Factor Scores</h4>
                  <div className="space-y-1">
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
                
                <div className="md:col-span-2 grid grid-cols-4 gap-4 bg-muted/30 rounded-lg p-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* STEP 2: 15M Setup Formation */}
        <AccordionItem value="step2" className="bg-card/50 border border-border/50 rounded-xl px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">2</div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  15M Setup Formation
                </h3>
                <p className="text-xs text-muted-foreground">
                  {validSignals.length} Valid • {invalidSignals.length} Invalid
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {signals15m.length > 0 ? (
              <>
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
                          {signal.setupScore.bosConfirmed ? '✓' : '✗'} BOS
                        </div>
                        <div className={signal.setupScore.pullbackValid ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {signal.setupScore.pullbackValid ? '✓' : '✗'} Pullback
                        </div>
                        <div className={signal.setupScore.consolidationBreak ? 'text-[hsl(var(--chart-green))]' : 'text-muted-foreground'}>
                          {signal.setupScore.consolidationBreak ? '✓' : '✗'} Consolidation Break
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {invalidSignals.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">
                        {invalidSignals.length} signal(s) failed setup criteria
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No signals detected</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* STEP 3: 5M Entry Execution */}
        <AccordionItem value="step3" className="bg-card/50 border border-border/50 rounded-xl px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">3</div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  5M Entry Execution
                </h3>
                <p className="text-xs text-muted-foreground">
                  {entryPoints.length} Entry Point(s) • Risk/Reward Analysis
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {entryPoints.length > 0 ? (
              entryPoints.map((entry, idx) => (
                <div key={idx} className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground capitalize">{entry.type} Entry</span>
                      <span className="text-sm text-muted-foreground">${entry.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Score:</span>
                      <span className="text-sm font-semibold text-foreground">{entry.validation?.entryScore || 0}/6</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Stop Loss</span>
                      <span className="font-semibold text-[hsl(var(--chart-red))]">${entry.stopLoss.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Take Profit</span>
                      <span className="font-semibold text-[hsl(var(--chart-green))]">${entry.takeProfit.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Risk/Reward</span>
                      <span className="text-sm font-bold text-primary">1:{entry.riskReward.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {entry.validation && (
                    <>
                      <div className="flex items-center justify-between bg-card/50 rounded p-2">
                        <span className="text-xs text-muted-foreground">AI Confidence</span>
                        <span className="text-sm font-bold text-primary">{entry.validation.aiConfidence}%</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          {entry.validation.microBOS ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                          <span className="text-muted-foreground">Micro BOS</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {entry.validation.candlePattern ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                          <span className="text-muted-foreground">Candle Pattern</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {entry.validation.volumeConfirm ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                          <span className="text-muted-foreground">Volume Confirm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {entry.validation.bubbleBurst ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                          <span className="text-muted-foreground">Bubble Burst</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {entry.validation.momentumFlip ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                          <span className="text-muted-foreground">Momentum Flip</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {entry.validation.wrFormation ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                          <span className="text-muted-foreground">W/R Formation</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No valid entry points detected</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* STEP 4: 1M Micro-Confirmation */}
        <AccordionItem value="step4" className="bg-card/50 border border-border/50 rounded-xl px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">4</div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  1M Micro-Confirmation
                </h3>
                <p className="text-xs text-muted-foreground">Optional Precision Entry Refinement</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {entryPoints.length > 0 ? (
              entryPoints.map((entry, idx) => {
                const confirmation = entry.microConfirmation;
                if (!confirmation) return null;
                
                return (
                  <div key={idx} className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold text-foreground">Entry #{idx + 1} Confirmation</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        confirmation.recommendation === 'ENTER NOW' ? 'bg-[hsl(var(--chart-green))]/20 text-[hsl(var(--chart-green))]' :
                        confirmation.recommendation === 'WAIT' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-[hsl(var(--chart-red))]/20 text-[hsl(var(--chart-red))]'
                      }`}>
                        {confirmation.recommendation}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {confirmation.breakoutConfirmed ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                        <span className="text-muted-foreground">Breakout</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {confirmation.volumeSustained ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                        <span className="text-muted-foreground">Volume Spike</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {confirmation.momentumContinues ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--chart-green))]" /> : <XCircle className="h-3 w-3 text-[hsl(var(--chart-red))]" />}
                        <span className="text-muted-foreground">Momentum</span>
                      </div>
                    </div>
                    
                    <div className="bg-card/50 rounded p-2">
                      <span className="text-xs text-muted-foreground">
                        Confirmation Score: {confirmation.confirmationScore}/3
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No entries to confirm</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </div>
  );
};
