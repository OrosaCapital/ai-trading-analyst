import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
  SeriesMarker,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
} from 'lightweight-charts';
import { useProfessionalChartData } from '@/hooks/useProfessionalChartData';
import { calculateTradeSignal, ChartDataForSignal } from '@/lib/signalEngine';
import { Skeleton } from './ui/skeleton';
import { ChartToolbar } from '@/components/ChartToolbar';
import { AnnotationConfig } from '@/types/annotations';

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
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const markersRef = useRef<any>(null);

  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1H');
  const [chartReady, setChartReady] = useState(false);
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

  // Effect 1: Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    console.log('📊 Initializing chart...');
    
    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#9CA3AF',
        },
        grid: {
          vertLines: { color: '#1F2937' },
          horzLines: { color: '#1F2937' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 600,
        timeScale: {
          borderColor: '#1F2937',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#1F2937',
        },
        localization: {
          timeFormatter: (time: number) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          },
        },
      });

      // Add candlestick series first
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });

      // Add volume series second (renders behind EMAs) in separate bottom panel
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      // Configure volume to occupy bottom 20% of chart
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,    // Volume starts at 80% from top
          bottom: 0,   // Volume ends at bottom
        },
      });

      // Add EMA series last (renders on top)
      const emaSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        title: 'EMA 50',
      });

      // Add RSI series (separate pane)
      const rsiSeries = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
        priceScaleId: 'rsi',
      });

      chart.priceScale('rsi').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });

      // Store references
      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      emaSeriesRef.current = emaSeries;
      rsiSeriesRef.current = rsiSeries;

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      setChartReady(true);
      console.log('✅ Chart initialized successfully');

      return () => {
        window.removeEventListener('resize', handleResize);
        try {
          chart.remove();
          chartRef.current = null;
          setChartReady(false);
        } catch (e) {
          console.warn('Chart cleanup skipped:', e);
        }
      };
    } catch (err) {
      console.error('❌ Chart initialization failed:', err);
    }
  }, []);

  // Effect 2: Load and display data
  useEffect(() => {
    if (!chartReady || !chartData || !candleSeriesRef.current) {
      console.log('⏳ Waiting for chart or data...', { chartReady, hasData: !!chartData });
      return;
    }

    try {
      const timeframeMap = { '1H': 'candles1h', '15M': 'candles15m', '5M': 'candles5m', '1M': 'candles1m' };
      const candles = chartData[timeframeMap[activeTimeframe]] || [];

      if (candles.length === 0) {
        console.warn('⚠️ No candles available for timeframe:', activeTimeframe);
        return;
      }

      // Filter out null/invalid candles
      const safeCandles = candles.filter(
        (c: any) =>
          c &&
          c.time != null &&
          c.open != null &&
          c.high != null &&
          c.low != null &&
          c.close != null
      );

      if (safeCandles.length === 0) {
        console.warn('⚠️ No valid candles after filtering');
        return;
      }

      console.log(`📈 Updating chart with ${safeCandles.length} candles for ${activeTimeframe}`);

      // Update candlestick data
      candleSeriesRef.current.setData(safeCandles.map((c: any) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })));

      // Update volume data
      if (volumeSeriesRef.current) {
        const safeVolume = safeCandles
          .map((c: any) => ({
            time: c.time as Time,
            value: c.volume || 0,
            color: c.close >= c.open ? '#22c55e' : '#ef4444',
          }))
          .filter((v: any) => v.value != null);

        if (safeVolume.length > 0) {
          volumeSeriesRef.current.setData(safeVolume);
        }
      }

      // Update EMA data
      const indicators = chartData.indicators?.[activeTimeframe.toLowerCase()];
      if (emaSeriesRef.current && indicators?.ema50) {
        const emaData = safeCandles
          .map((c: any, i: number) => ({
            time: c.time as Time,
            value: indicators.ema50[i] || c.close,
          }))
          .filter((e: any) => e.value != null);

        if (emaData.length > 0) {
          emaSeriesRef.current.setData(emaData);
        }
      }

      // Update RSI data
      if (rsiSeriesRef.current && indicators?.rsi) {
        const rsiData = safeCandles
          .map((c: any, i: number) => ({
            time: c.time as Time,
            value: indicators.rsi[i] || 50,
          }))
          .filter((r: any) => r.value != null);

        if (rsiData.length > 0) {
          rsiSeriesRef.current.setData(rsiData);
        }
      }

      console.log('✅ Chart data updated successfully');
    } catch (err) {
      console.error('❌ Failed to update chart data:', err);
    }
  }, [chartReady, chartData, activeTimeframe]);

  // Effect 3: Calculate and display trade signals
  useEffect(() => {
    if (!chartReady || !chartData || !candleSeriesRef.current || !annotationConfig.showSignals) {
      return;
    }

    try {
      const timeframeMap = { '1H': 'candles1h', '15M': 'candles15m', '5M': 'candles5m', '1M': 'candles1m' };
      const candles = chartData[timeframeMap[activeTimeframe]] || [];
      
      if (candles.length < 50) {
        console.log('⏳ Need at least 50 candles for signal calculation');
        return;
      }

      const indicators = chartData.indicators?.[activeTimeframe.toLowerCase()];
      if (!indicators) {
        console.log('⏳ Waiting for indicators...');
        return;
      }

      console.log('🎯 Calculating trade signals...');
      const signalMarkers: SeriesMarker<Time>[] = [];
      const step = 15; // Calculate every 15 candles to avoid clutter

      for (let i = 50; i < candles.length; i += step) {
        const currentCandle = candles[i];
        
        const signalData: ChartDataForSignal = {
          price1h: currentCandle.close,
          ema501h: indicators.ema50?.slice(0, i + 1) || [],
          rsi1h: indicators.rsi?.slice(0, i + 1) || [],
          price15m: currentCandle.close,
          ema5015m: indicators.ema50?.slice(0, i + 1) || [],
          rsi15m: indicators.rsi?.slice(0, i + 1) || [],
          currentVolume: currentCandle.volume || 0,
          volumeSMA: indicators.volumeSMA?.slice(0, i + 1) || [],
        };

        const signal = calculateTradeSignal(signalData);

        // Only show high-confidence signals
        if (signal.confidence >= 70 && signal.signal !== 'NO TRADE') {
          signalMarkers.push({
            time: currentCandle.time as Time,
            position: signal.signal === 'BUY' ? 'belowBar' : 'aboveBar',
            color: signal.signal === 'BUY' ? '#22c55e' : '#ef4444',
            shape: signal.signal === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `${signal.signal} ${signal.confidence}%`,
          });
        }
      }

      // Apply signals to chart using v5 API
      if (signalMarkers.length > 0) {
        if (markersRef.current) {
          markersRef.current.setMarkers(signalMarkers);
        } else if (candleSeriesRef.current) {
          markersRef.current = createSeriesMarkers(candleSeriesRef.current, signalMarkers);
        }
        console.log(`✅ Added ${signalMarkers.length} trade signals to chart`);
      } else {
        if (markersRef.current) {
          markersRef.current.setMarkers([]);
        }
        console.log('ℹ️ No high-confidence signals found');
      }
    } catch (err) {
      console.error('❌ Failed to calculate signals:', err);
    }
  }, [chartReady, chartData, activeTimeframe, annotationConfig.showSignals]);

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading chart: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChartToolbar
        config={annotationConfig}
        onConfigChange={setAnnotationConfig}
        chartMode="candlestick"
        onChartModeChange={() => {}}
      />

      <div className="flex gap-2 mb-4">
        {(['1M', '5M', '15M', '1H'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setActiveTimeframe(tf)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTimeframe === tf
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div ref={chartContainerRef} className="w-full h-[600px] rounded-lg bg-card" />
    </div>
  );
};
