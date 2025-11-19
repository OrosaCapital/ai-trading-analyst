import { useEffect, useRef, memo } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import type { Candle } from '@/lib/indicators';
import { calculateEMA, calculateRSI } from '@/lib/indicators';
import { calculateVWAP, getPreviousDayLevels, calculateMACD, calculateVolumeSeries } from '@/lib/dayTraderIndicators';

interface DayTraderChartProps {
  symbol: string;
  candles: Candle[];
  containerId: string;
}

export const DayTraderChart = memo(({ symbol, candles, containerId }: DayTraderChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const priceChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !candles || candles.length === 0) return;

    // Clear previous charts
    if (priceChartRef.current) priceChartRef.current.remove();
    if (macdChartRef.current) macdChartRef.current.remove();
    if (rsiChartRef.current) rsiChartRef.current.remove();

    const container = containerRef.current;
    const priceContainer = container.querySelector('#price-chart') as HTMLDivElement;
    const macdContainer = container.querySelector('#macd-chart') as HTMLDivElement;
    const rsiContainer = container.querySelector('#rsi-chart') as HTMLDivElement;

    if (!priceContainer || !macdContainer || !rsiContainer) return;

    // Theme colors from design system
    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--border))' },
        horzLines: { color: 'hsl(var(--border))' },
      },
      rightPriceScale: { borderColor: 'hsl(var(--border))' },
      timeScale: { 
        borderColor: 'hsl(var(--border))', 
        rightOffset: 5, 
        barSpacing: 8,
        timeVisible: true,
      },
    };

    // Initialize Price Chart
    const priceChart = createChart(priceContainer, {
      ...chartOptions,
      width: priceContainer.clientWidth,
      height: priceContainer.clientHeight,
    });
    priceChartRef.current = priceChart;

    // Initialize MACD Chart
    const macdChart = createChart(macdContainer, {
      ...chartOptions,
      width: macdContainer.clientWidth,
      height: macdContainer.clientHeight,
    });
    macdChartRef.current = macdChart;

    // Initialize RSI Chart
    const rsiChart = createChart(rsiContainer, {
      ...chartOptions,
      width: rsiContainer.clientWidth,
      height: rsiContainer.clientHeight,
    });
    rsiChartRef.current = rsiChart;

    // Add series to Price Chart
    const candleSeries = priceChart.addSeries(CandlestickSeries, {
      upColor: 'hsl(var(--chart-green))',
      downColor: 'hsl(var(--chart-red))',
      borderUpColor: 'hsl(var(--chart-green))',
      borderDownColor: 'hsl(var(--chart-red))',
      wickUpColor: 'hsl(var(--chart-green))',
      wickDownColor: 'hsl(var(--chart-red))',
    });

    const ema9Series = priceChart.addSeries(LineSeries, { color: 'hsl(var(--chart-yellow))', lineWidth: 2 });
    const ema21Series = priceChart.addSeries(LineSeries, { color: 'hsl(var(--chart-orange))', lineWidth: 2 });
    const ema50Series = priceChart.addSeries(LineSeries, { color: 'hsl(var(--chart-blue))', lineWidth: 2 });
    const vwapSeries = priceChart.addSeries(LineSeries, { color: 'hsl(var(--cyber-purple))', lineWidth: 2 });

    const volumeSeries = priceChart.addSeries(HistogramSeries, {
      priceScaleId: '',
      priceFormat: { type: 'volume' },
    });

    const prevHighSeries = priceChart.addSeries(LineSeries, {
      color: 'rgba(0, 255, 255, 0.4)',
      lineWidth: 1,
      lineStyle: 2,
    });

    const prevLowSeries = priceChart.addSeries(LineSeries, {
      color: 'rgba(255, 0, 255, 0.4)',
      lineWidth: 1,
      lineStyle: 2,
    });

    // Add series to MACD Chart
    const macdLineSeries = macdChart.addSeries(LineSeries, { color: 'hsl(var(--foreground))', lineWidth: 2 });
    const macdSignalSeries = macdChart.addSeries(LineSeries, { color: 'hsl(var(--muted-foreground))', lineWidth: 2 });
    const macdHistSeries = macdChart.addSeries(HistogramSeries, {});

    // Add series to RSI Chart
    const rsiSeries = rsiChart.addSeries(LineSeries, { color: 'hsl(var(--chart-orange))', lineWidth: 2 });
    const rsiOverbought = rsiChart.addSeries(LineSeries, { 
      color: 'hsla(var(--chart-red), 0.5)', 
      lineWidth: 1,
      lineStyle: 2,
    });
    const rsiOversold = rsiChart.addSeries(LineSeries, { 
      color: 'hsla(var(--chart-green), 0.5)', 
      lineWidth: 1,
      lineStyle: 2,
    });
    const rsiMidline = rsiChart.addSeries(LineSeries, { 
      color: 'hsla(var(--muted-foreground), 0.5)', 
      lineWidth: 1,
      lineStyle: 2,
    });

    // Calculate indicators
    const prices = candles.map(c => c.close);
    const ema9 = calculateEMA(prices, 9);
    const ema21 = calculateEMA(prices, 21);
    const ema50 = calculateEMA(prices, 50);
    const vwap = calculateVWAP(candles);
    const volumeData = calculateVolumeSeries(candles);
    const { prevHigh, prevLow } = getPreviousDayLevels(candles);
    const { macdLine, signalLine, histogram } = calculateMACD(candles);
    const rsi = calculateRSI(prices, 14);

    // Set data for Price Chart (cast time as any for v5 compatibility)
    candleSeries.setData(candles.map(c => ({ 
      time: c.time as any, 
      open: c.open, 
      high: c.high, 
      low: c.low, 
      close: c.close 
    })));

    if (ema9.length > 0) {
      ema9Series.setData(candles.slice(8).map((c, i) => ({ time: c.time as any, value: ema9[i + 8] })));
    }
    if (ema21.length > 0) {
      ema21Series.setData(candles.slice(20).map((c, i) => ({ time: c.time as any, value: ema21[i + 20] })));
    }
    if (ema50.length > 0) {
      ema50Series.setData(candles.slice(49).map((c, i) => ({ time: c.time as any, value: ema50[i + 49] })));
    }

    vwapSeries.setData(vwap.map(v => ({ time: v.time as any, value: v.value })));
    volumeSeries.setData(volumeData.map(v => ({ time: v.time as any, value: v.value, color: v.color })));

    if (prevHigh !== null && prevLow !== null) {
      prevHighSeries.setData(candles.map(c => ({ time: c.time as any, value: prevHigh })));
      prevLowSeries.setData(candles.map(c => ({ time: c.time as any, value: prevLow })));
    }

    // Set data for MACD Chart
    macdLineSeries.setData(macdLine.map(m => ({ time: m.time as any, value: m.value })));
    macdSignalSeries.setData(signalLine.map(s => ({ time: s.time as any, value: s.value })));
    macdHistSeries.setData(histogram.map(h => ({ time: h.time as any, value: h.value, color: h.color })));

    // Set data for RSI Chart
    if (rsi.length > 0) {
      const rsiData = candles.slice(14).map((c, i) => ({ time: c.time as any, value: rsi[i + 14] }));
      rsiSeries.setData(rsiData);

      const ob = rsiData.map(r => ({ time: r.time, value: 70 }));
      const os = rsiData.map(r => ({ time: r.time, value: 30 }));
      const mid = rsiData.map(r => ({ time: r.time, value: 50 }));

      rsiOverbought.setData(ob);
      rsiOversold.setData(os);
      rsiMidline.setData(mid);
    }

    // Sync time scales
    const syncCharts = (sourceChart: IChartApi, targetCharts: IChartApi[]) => {
      sourceChart.timeScale().subscribeVisibleTimeRangeChange(range => {
        if (range) {
          targetCharts.forEach(chart => chart.timeScale().setVisibleRange(range));
        }
      });
    };

    syncCharts(priceChart, [macdChart, rsiChart]);
    syncCharts(macdChart, [priceChart, rsiChart]);
    syncCharts(rsiChart, [priceChart, macdChart]);

    // Set initial visible range
    if (candles.length > 0) {
      const from = candles[Math.max(0, candles.length - 120)].time as any;
      const to = candles[candles.length - 1].time as any;
      priceChart.timeScale().setVisibleRange({ from, to });
    }

    // Handle resize
    const handleResize = () => {
      if (priceChartRef.current && priceContainer) {
        priceChartRef.current.applyOptions({ 
          width: priceContainer.clientWidth,
          height: priceContainer.clientHeight,
        });
      }
      if (macdChartRef.current && macdContainer) {
        macdChartRef.current.applyOptions({ 
          width: macdContainer.clientWidth,
          height: macdContainer.clientHeight,
        });
      }
      if (rsiChartRef.current && rsiContainer) {
        rsiChartRef.current.applyOptions({ 
          width: rsiContainer.clientWidth,
          height: rsiContainer.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceChart.remove();
      macdChart.remove();
      rsiChart.remove();
    };
  }, [candles, symbol]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col gap-2">
      <div id="price-chart" className="flex-[7] min-h-[400px] rounded-lg border border-border/50 overflow-hidden" />
      <div className="flex gap-2 flex-[3]">
        <div id="macd-chart" className="flex-1 min-h-[150px] rounded-lg border border-border/50 overflow-hidden" />
        <div id="rsi-chart" className="flex-1 min-h-[150px] rounded-lg border border-border/50 overflow-hidden" />
      </div>
    </div>
  );
});

DayTraderChart.displayName = 'DayTraderChart';
