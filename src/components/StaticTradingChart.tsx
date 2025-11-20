import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { MockCandle } from '@/data/mockCandles';
import { MockSignal } from '@/data/mockSignals';

interface StaticTradingChartProps {
  candles: MockCandle[];
  signals: MockSignal[];
}

export const StaticTradingChart = ({ candles, signals }: StaticTradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const markersRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--chart-grid))' },
        horzLines: { color: 'hsl(var(--chart-grid))' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(var(--chart-green))',
      downColor: 'hsl(var(--chart-red))',
      borderUpColor: 'hsl(var(--chart-green))',
      borderDownColor: 'hsl(var(--chart-red))',
      wickUpColor: 'hsl(var(--chart-green))',
      wickDownColor: 'hsl(var(--chart-red))',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        chart.remove();
      } catch (e) {
        console.warn('Chart cleanup skipped:', e);
      }
    };
    } catch (e) {
      console.warn('Chart initialization skipped:', e);
    }
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !candles || !candles.length) return;

    try {
      // Filter out null/invalid candles
      const safeCandles = candles.filter(
        (c) =>
          c &&
          c.time != null &&
          c.open != null &&
          c.high != null &&
          c.low != null &&
          c.close != null
      );

      if (safeCandles.length === 0) return;

      const formattedCandles = safeCandles.map(c => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      }));

      candleSeriesRef.current.setData(formattedCandles);

      if (signals && signals.length > 0) {
        const safeSignals = signals.filter(s => s && s.time != null);
        
        if (safeSignals.length > 0) {
          const markers = safeSignals.map(signal => ({
            time: signal.time as any,
            position: signal.position,
            color: signal.color,
            shape: signal.shape,
            text: signal.text,
          }));
          
          // V5 API: Use createSeriesMarkers instead of series.setMarkers
          if (markersRef.current) {
            markersRef.current.setMarkers(markers);
          } else {
            markersRef.current = createSeriesMarkers(candleSeriesRef.current, markers);
          }
        }
      } else if (markersRef.current) {
        // Clear markers if no signals
        markersRef.current.setMarkers([]);
      }
    } catch (e) {
      console.warn('Chart update skipped:', e);
    }
  }, [candles, signals]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};
