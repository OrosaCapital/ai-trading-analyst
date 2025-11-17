import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
  SeriesMarker,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { useProfessionalChartData } from '@/hooks/useProfessionalChartData';
import { calculateTradeSignal, ChartDataForSignal } from '@/lib/signalEngine';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { ChartToolbar } from '@/components/ChartToolbar';
import { AnnotationConfig } from '@/types/annotations';
import { getEventsForSymbol, filterEventsByDateRange } from '@/data/cryptoEvents';
import { AnnotationManager } from '@/lib/annotationManager';

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
  indicators: {
    ema50: Array<{ time: number; value: number }>;
    ema200: Array<{ time: number; value: number }>;
  };
}

interface ProfessionalTradingChartProps {
  symbol: string;
  existingChartData?: MultiTimeframeData | null;
}

type Timeframe = '1H' | '15M' | '5M' | '1M';

export const ProfessionalTradingChart = ({ symbol, existingChartData }: ProfessionalTradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const annotationManagerRef = useRef<AnnotationManager>(new AnnotationManager());

  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1H');
  const [chartMode, setChartMode] = useState<'candlestick' | 'area'>('candlestick');
  const [annotationConfig, setAnnotationConfig] = useState<AnnotationConfig>({
    showEvents: true,
    showSignals: true,
    showNews: true,
    showMilestones: true,
    responsiveLabels: true,
  });

  const shouldFetchData = !existingChartData;
  const { chartData: hookChartData, isLoading: hookLoading, error: hookError } = useProfessionalChartData(
    shouldFetchData ? symbol : null
  );

  const chartData = existingChartData ? convertToChartData(existingChartData) : hookChartData;
  const isLoading = existingChartData ? false : hookLoading;
  const error = existingChartData ? null : hookError;

  const [tradeSignal, setTradeSignal] = useState<ReturnType<typeof calculateTradeSignal> | null>(null);

  function convertToChartData(data: MultiTimeframeData): any {
    const candles1h = data.timeframes['1h']?.candles || [];
    
    return {
      candles1m: candles1h,
      candles5m: candles1h,
      candles15m: candles1h,
      candles1h: candles1h.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })),
      indicators: {
        '1h': {
          ema50: data.timeframes['1h']?.indicators?.ema50?.map(e => e.value) || [],
          rsi: candles1h.map(c => c.rsi || 50),
          volumeSMA: [],
        },
        '15m': { ema50: [], rsi: [], volumeSMA: [] },
      },
      coinglass: {
        fundingRate: 0,
        fundingSentiment: 'neutral' as const,
        openInterest: 0,
        oiChange: 0,
        liquidations: { longs: 0, shorts: 0 },
        longShortRatio: 1,
        overallSentiment: 'neutral' as const,
      },
      levels: { support: [], resistance: [] },
      liquiditySweeps: [],
      candleCount: candles1h.length,
    };
  }

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: { background: { color: 'transparent' }, textColor: '#d1d5db' },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)', style: 1 },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)', style: 1 },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.2)', scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.2)', timeVisible: true, secondsVisible: false },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#8b5cf6',
      topColor: 'rgba(139, 92, 246, 0.4)',
      bottomColor: 'rgba(139, 92, 246, 0.01)',
      lineWidth: 2,
      visible: false,
    });
    areaSeriesRef.current = areaSeries;

    emaSeriesRef.current = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2 });
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
    rsiSeriesRef.current = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1, priceScaleId: 'rsi' });
    chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Toggle chart mode
  useEffect(() => {
    if (!candleSeriesRef.current || !areaSeriesRef.current) return;
    candleSeriesRef.current.applyOptions({ visible: chartMode === 'candlestick' });
    areaSeriesRef.current.applyOptions({ visible: chartMode === 'area' });
  }, [chartMode]);

  // Update chart data with annotations
  useEffect(() => {
    if (!chartData || !candleSeriesRef.current || !areaSeriesRef.current) return;

    const timeframeMap = { '1H': 'candles1h', '15M': 'candles15m', '5M': 'candles5m', '1M': 'candles1m' };
    const candles = chartData[timeframeMap[activeTimeframe]] || [];
    if (candles.length === 0) return;

    candleSeriesRef.current.setData(candles);
    areaSeriesRef.current.setData(candles.map((c: any) => ({ time: c.time, value: c.close })));

    const indicators = chartData.indicators?.[activeTimeframe.toLowerCase()];
    if (indicators?.ema50) {
      emaSeriesRef.current?.setData(candles.map((c: any, i: number) => ({ time: c.time, value: indicators.ema50[i] || c.close })));
    }
    if (indicators?.rsi) {
      rsiSeriesRef.current?.setData(candles.map((c: any, i: number) => ({ time: c.time, value: indicators.rsi[i] || 50 })));
    }
    volumeSeriesRef.current?.setData(candles.map((c: any) => ({ time: c.time, value: c.volume || 0, color: c.close >= c.open ? '#22c55e80' : '#ef444480' })));

    // Add annotations (using price lines instead of markers)
    const events = getEventsForSymbol(symbol);
    if (events.length > 0) {
      const startDate = new Date((candles[0].time as number) * 1000);
      const endDate = new Date((candles[candles.length - 1].time as number) * 1000);
      const relevantEvents = filterEventsByDateRange(events, startDate, endDate).filter(e => {
        if (e.type === 'event') return annotationConfig.showEvents;
        if (e.type === 'news') return annotationConfig.showNews;
        if (e.type === 'milestone') return annotationConfig.showMilestones;
        return true;
      });
      annotationManagerRef.current.clearAnnotations();
      annotationManagerRef.current.addAnnotations(relevantEvents);
      
      // Add price lines for annotations (markers API not available)
      relevantEvents.forEach(event => {
        if (event.price && candleSeriesRef.current) {
          candleSeriesRef.current.createPriceLine({
            price: event.price,
            color: event.type === 'milestone' ? '#FFA726' : '#2196F3',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: event.title.substring(0, 15),
          });
        }
      });
    }

    if (tradeSignal && tradeSignal.signal !== 'NO TRADE') {
      const lastCandle = candles[candles.length - 1];
      candleSeriesRef.current?.createPriceLine({
        price: lastCandle.close,
        color: tradeSignal.signal === 'BUY' ? '#22c55e' : '#ef4444',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${tradeSignal.signal} (${tradeSignal.confidence}%)`,
      });
    }
  }, [chartData, activeTimeframe, annotationConfig, tradeSignal, chartMode, symbol]);

  if (isLoading) return <Skeleton className="h-[600px] w-full" />;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <ChartToolbar
        config={annotationConfig}
        onConfigChange={setAnnotationConfig}
        chartMode={chartMode}
        onChartModeChange={setChartMode}
      />
      <div className="flex gap-2">
        {(['1H', '15M', '5M', '1M'] as Timeframe[]).map(tf => (
          <button
            key={tf}
            onClick={() => setActiveTimeframe(tf)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTimeframe === tf ? 'bg-primary text-primary-foreground' : 'bg-card/50 hover:bg-card'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} className="bg-card/30 rounded-lg border border-border min-h-[600px]" />
    </div>
  );
};
