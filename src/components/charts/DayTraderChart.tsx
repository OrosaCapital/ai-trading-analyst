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
    console.log('DayTraderChart received:', candles?.length, 'candles for', symbol);
    if (!containerRef.current || !candles || candles.length === 0) return;

    try {

    if (priceChartRef.current) priceChartRef.current.remove();
    if (macdChartRef.current) macdChartRef.current.remove();
    if (rsiChartRef.current) rsiChartRef.current.remove();

    const container = containerRef.current;
    const priceContainer = container.querySelector('#price-chart') as HTMLDivElement;
    const macdContainer = container.querySelector('#macd-chart') as HTMLDivElement;
    const rsiContainer = container.querySelector('#rsi-chart') as HTMLDivElement;

    if (!priceContainer || !macdContainer || !rsiContainer) return;

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--chart-grid))' },
        horzLines: { color: 'hsl(var(--chart-grid))' },
      },
      rightPriceScale: { borderColor: 'hsl(var(--border))' },
      timeScale: { 
        borderColor: 'hsl(var(--border))', 
        rightOffset: 5, 
        barSpacing: 8,
        timeVisible: true,
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
    };

    const priceChart = createChart(priceContainer, {
      ...chartOptions,
      width: priceContainer.clientWidth,
      height: priceContainer.clientHeight,
    });
    priceChartRef.current = priceChart;

    const macdChart = createChart(macdContainer, {
      ...chartOptions,
      width: macdContainer.clientWidth,
      height: macdContainer.clientHeight,
    });
    macdChartRef.current = macdChart;

    const rsiChart = createChart(rsiContainer, {
      ...chartOptions,
      width: rsiContainer.clientWidth,
      height: rsiContainer.clientHeight,
    });
    rsiChartRef.current = rsiChart;

    // Filter out null/invalid candles
    const safeCandles = candles.filter(
      (c) =>
        c &&
        c.time != null &&
        c.open != null &&
        c.high != null &&
        c.low != null &&
        c.close != null &&
        c.volume != null
    );

    if (safeCandles.length === 0) {
      console.warn('No valid candles after filtering');
      return;
    }

    const candleSeries = priceChart.addSeries(CandlestickSeries, {
      upColor: 'hsl(150, 100%, 45%)',      // Bright green for bullish
      downColor: 'hsl(0, 85%, 60%)',       // Bright red for bearish
      borderUpColor: 'hsl(150, 100%, 45%)',
      borderDownColor: 'hsl(0, 85%, 60%)',
      wickUpColor: 'hsl(150, 100%, 45%)',
      wickDownColor: 'hsl(0, 85%, 60%)',
    });

    // Add volume first so it renders behind EMAs
    const volumeSeries = priceChart.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
    });
    
    // Configure volume scale to be at bottom 20% of chart
    priceChart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,    // Volume starts at 80% down
        bottom: 0,   // Volume ends at bottom
      },
    });

    // EMAs with bright, distinct colors for high visibility - added after volume to render on top
    const ema9Series = priceChart.addSeries(LineSeries, { 
      color: 'hsl(30, 100%, 60%)',  // Orange/Amber - Fast EMA
      lineWidth: 3,
      lastValueVisible: true,
      priceLineVisible: false,
    });
    const ema21Series = priceChart.addSeries(LineSeries, { 
      color: 'hsl(180, 70%, 50%)',  // Cyan - Medium EMA
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
    });
    const ema50Series = priceChart.addSeries(LineSeries, { 
      color: 'hsl(270, 60%, 55%)',  // Purple - Slow EMA
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
    });
    const vwapSeries = priceChart.addSeries(LineSeries, { 
      color: 'hsl(270, 100%, 65%)',  // Cyber purple
      lineWidth: 2 
    });

    const prevHighSeries = priceChart.addSeries(LineSeries, {
      color: 'hsla(var(--cyber-cyan), 0.4)',
      lineWidth: 1,
      lineStyle: 2,
    });

    const prevLowSeries = priceChart.addSeries(LineSeries, {
      color: 'hsla(var(--cyber-pink), 0.4)',
      lineWidth: 1,
      lineStyle: 2,
    });

    const macdLineSeries = macdChart.addSeries(LineSeries, { color: 'hsl(var(--foreground))', lineWidth: 2 });
    const macdSignalSeries = macdChart.addSeries(LineSeries, { color: 'hsl(var(--muted-foreground))', lineWidth: 2 });
    const macdHistSeries = macdChart.addSeries(HistogramSeries, {});

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

    // Calculate indicator data
    const prices = safeCandles.map(c => c.close);
    const ema9 = calculateEMA(prices, 9);
    const ema21 = calculateEMA(prices, 21);
    const ema50 = calculateEMA(prices, 50);
    const rsi = calculateRSI(prices, 14);
    const vwapData = calculateVWAP(safeCandles);
    const { prevHigh, prevLow } = getPreviousDayLevels(safeCandles);
    const { macdLine, signalLine, histogram } = calculateMACD(safeCandles);
    const volumeSeriesData = calculateVolumeSeries(safeCandles);

    // Add candle data
    const formattedCandles = safeCandles.map(c => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    candleSeries.setData(formattedCandles);

    const safeVolumeData = volumeSeriesData.filter(v => v && v.time != null && v.value != null);
    if (safeVolumeData.length > 0) {
      volumeSeries.setData(safeVolumeData.map(v => ({ 
        time: v.time as any, 
        value: v.value, 
        color: v.color 
      })));
    }

    // Add EMA data
    if (ema9 && ema9.length > 0) {
      const ema9Data = safeCandles.slice(8).map((c, i) => ({ time: c.time as any, value: ema9[i + 8] }))
        .filter(e => e && e.value != null);
      if (ema9Data.length > 0) ema9Series.setData(ema9Data);
    }
    if (ema21 && ema21.length > 0) {
      const ema21Data = safeCandles.slice(20).map((c, i) => ({ time: c.time as any, value: ema21[i + 20] }))
        .filter(e => e && e.value != null);
      if (ema21Data.length > 0) ema21Series.setData(ema21Data);
    }
    if (ema50 && ema50.length > 0) {
      const ema50Data = safeCandles.slice(49).map((c, i) => ({ time: c.time as any, value: ema50[i + 49] }))
        .filter(e => e && e.value != null);
      if (ema50Data.length > 0) ema50Series.setData(ema50Data);
    }

    // Add VWAP
    if (vwapData && vwapData.length > 0) {
      const safeVwap = vwapData.filter(v => v && v.time != null && v.value != null);
      if (safeVwap.length > 0) {
        vwapSeries.setData(safeVwap.map(v => ({ time: v.time as any, value: v.value })));
      }
    }

    // Add previous day levels
    if (prevHigh != null && prevLow != null) {
      const timeRange = safeCandles.map(c => c.time);
      prevHighSeries.setData(timeRange.map(t => ({ time: t as any, value: prevHigh })));
      prevLowSeries.setData(timeRange.map(t => ({ time: t as any, value: prevLow })));
    }

    if (macdLine && macdLine.length > 0) {
      const safeMacd = macdLine.filter(m => m && m.time != null && m.value != null);
      if (safeMacd.length > 0) macdLineSeries.setData(safeMacd.map(m => ({ time: m.time as any, value: m.value })));
    }
    if (signalLine && signalLine.length > 0) {
      const safeSignal = signalLine.filter(s => s && s.time != null && s.value != null);
      if (safeSignal.length > 0) macdSignalSeries.setData(safeSignal.map(s => ({ time: s.time as any, value: s.value })));
    }
    if (histogram && histogram.length > 0) {
      const safeHist = histogram.filter(h => h && h.time != null && h.value != null);
      if (safeHist.length > 0) macdHistSeries.setData(safeHist.map(h => ({ time: h.time as any, value: h.value, color: h.color })));
    }

    if (rsi && rsi.length > 0) {
      const rsiData = safeCandles.slice(14).map((c, i) => ({ time: c.time as any, value: rsi[i] }))
        .filter(r => r.value != null);
      
      if (rsiData.length > 0) {
        rsiSeries.setData(rsiData);

        const ob = rsiData.map(r => ({ time: r.time, value: 70 }));
        const os = rsiData.map(r => ({ time: r.time, value: 30 }));
        const mid = rsiData.map(r => ({ time: r.time, value: 50 }));

        rsiOverbought.setData(ob);
        rsiOversold.setData(os);
        rsiMidline.setData(mid);
      }
    }

    const syncCharts = (sourceChart: IChartApi, targetCharts: IChartApi[]) => {
      try {
        sourceChart.timeScale().subscribeVisibleTimeRangeChange(range => {
          if (range && range.from != null && range.to != null) {
            targetCharts.forEach(chart => {
              try {
                if (chart && chart.timeScale) {
                  chart.timeScale().setVisibleRange(range);
                }
              } catch (e) {
                console.warn('Chart sync skipped:', e);
              }
            });
          }
        });
      } catch (e) {
        console.warn('Chart sync setup skipped:', e);
      }
    };

    syncCharts(priceChart, [macdChart, rsiChart]);
    syncCharts(macdChart, [priceChart, rsiChart]);
    syncCharts(rsiChart, [priceChart, macdChart]);

    if (safeCandles.length > 0) {
      const lastCandle = safeCandles[safeCandles.length - 1];
      const firstVisibleCandle = safeCandles[Math.max(0, safeCandles.length - 120)];
      
      if (lastCandle && firstVisibleCandle && lastCandle.time != null && firstVisibleCandle.time != null) {
        try {
          const from = firstVisibleCandle.time as any;
          const to = lastCandle.time as any;
          priceChart.timeScale().setVisibleRange({ from, to });
        } catch (e) {
          console.warn('Set visible range skipped:', e);
        }
      }
    }

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
      try {
        if (priceChartRef.current) {
          priceChartRef.current.remove();
          priceChartRef.current = null;
        }
      } catch (e) {
        console.warn('Price chart already disposed:', e);
      }
      try {
        if (macdChartRef.current) {
          macdChartRef.current.remove();
          macdChartRef.current = null;
        }
      } catch (e) {
        console.warn('MACD chart already disposed:', e);
      }
      try {
        if (rsiChartRef.current) {
          rsiChartRef.current.remove();
          rsiChartRef.current = null;
        }
      } catch (e) {
        console.warn('RSI chart already disposed:', e);
      }
    };
    } catch (e) {
      console.warn('Chart initialization skipped:', e);
    }
  }, [candles, symbol]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col gap-2">
      <div id="price-chart" className="flex-[7] min-h-0 rounded-lg border border-border/50 overflow-hidden" />
      <div className="flex gap-2 flex-[3]">
        <div id="macd-chart" className="flex-1 min-h-0 rounded-lg border border-border/50 overflow-hidden" />
        <div id="rsi-chart" className="flex-1 min-h-0 rounded-lg border border-border/50 overflow-hidden" />
      </div>
    </div>
  );
});

DayTraderChart.displayName = 'DayTraderChart';
