import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries } from 'lightweight-charts';
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

  useEffect(() => {
    if (!chartContainerRef.current) return;

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
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return;

    const formattedCandles = candles.map(c => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    candleSeriesRef.current.setData(formattedCandles);

    if (signals.length > 0) {
      const markers = signals.map(signal => ({
        time: signal.time as any,
        position: signal.position,
        color: signal.color,
        shape: signal.shape,
        text: signal.text,
      }));
      (candleSeriesRef.current as any).setMarkers(markers);
    }
  }, [candles, signals]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};
