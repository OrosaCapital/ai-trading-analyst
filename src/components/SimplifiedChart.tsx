import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';

interface PriceLog {
  timestamp: string;
  price: number;
  volume: number;
}

interface SimplifiedChartProps {
  symbol: string | null;
  priceData: {
    '1m'?: PriceLog[];
    '5m'?: PriceLog[];
    '10m'?: PriceLog[];
    '15m'?: PriceLog[];
    '1h'?: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>;
  } | null;
  emas?: {
    '5m'?: number[];
    '15m'?: number[];
    '1h'?: number[];
  };
}

type Timeframe = '1h' | '15m';

export function SimplifiedChart({ symbol, priceData, emas }: SimplifiedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const emaSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');

  // Convert price logs to candlesticks
  const convertLogsToCandlesticks = (
    logs: PriceLog[],
    intervalMinutes: number
  ): CandlestickData[] => {
    if (!logs || logs.length === 0) return [];

    const intervalMs = intervalMinutes * 60 * 1000;
    const grouped = new Map<number, PriceLog[]>();

    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).getTime();
      const bucketStart = Math.floor(timestamp / intervalMs) * intervalMs;

      if (!grouped.has(bucketStart)) grouped.set(bucketStart, []);
      grouped.get(bucketStart)!.push(log);
    });

    const candles: CandlestickData[] = [];
    grouped.forEach((group, bucketStart) => {
      if (group.length === 0) return;

      candles.push({
        time: Math.floor(bucketStart / 1000) as any,
        open: group[0].price,
        high: Math.max(...group.map(l => l.price)),
        low: Math.min(...group.map(l => l.price)),
        close: group[group.length - 1].price,
      });
    });

    return candles.sort((a, b) => (a.time as number) - (b.time as number));
  };

  // Get chart data for selected timeframe
  const getChartData = (): CandlestickData[] => {
    if (!priceData) return [];

    switch (selectedTimeframe) {
      case '1h':
        return (priceData['1h'] || []).map(candle => ({
          time: candle.time as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
      case '15m':
        return convertLogsToCandlesticks(priceData['15m'] || [], 15);
      default:
        return [];
    }
  };

  // Get EMA data for selected timeframe
  const getEmaData = (): LineData[] => {
    if (!emas) return [];

    const chartData = getChartData();
    const emaValues = emas[selectedTimeframe as '15m' | '1h'];
    
    if (!emaValues || emaValues.length === 0 || chartData.length === 0) return [];

    return chartData.slice(-emaValues.length).map((candle, index) => ({
      time: candle.time,
      value: emaValues[index],
    }));
  };

  // Get timeframe status
  const getTimeframeStatus = (tf: Timeframe): string => {
    if (!priceData) return 'No data';

    switch (tf) {
      case '1h':
        const hourlyData = priceData['1h'] || [];
        if (hourlyData.length === 0) return 'No data';
        const latestCandle = hourlyData[hourlyData.length - 1];
        const emaValue = emas?.['1h']?.[0];
        if (emaValue && latestCandle.close > emaValue) return 'BULLISH';
        if (emaValue && latestCandle.close < emaValue) return 'BEARISH';
        return 'NEUTRAL';
      case '15m':
        const data15m = priceData['15m'] || [];
        if (data15m.length < 2) return 'No data';
        const recent15m = data15m.slice(-2);
        const trend15m = recent15m[1].price > recent15m[0].price;
        return trend15m ? 'UP' : 'DOWN';
      default:
        return 'No data';
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: 'hsl(197, 100%, 44%)',
        },
        grid: {
          vertLines: { color: 'rgba(0, 255, 255, 0.08)' },
          horzLines: { color: 'rgba(0, 255, 255, 0.08)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 650,
        crosshair: {
          mode: 1,
          vertLine: {
            color: 'hsl(75, 100%, 50%)',
            width: 1,
            style: 3,
          },
          horzLine: {
            color: 'hsl(75, 100%, 50%)',
            width: 1,
            style: 3,
          },
        },
        timeScale: {
          borderColor: 'rgba(0, 255, 255, 0.2)',
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 8,
          minBarSpacing: 4,
          rightOffset: 12,
          fixLeftEdge: false,
          fixRightEdge: false,
          lockVisibleTimeRangeOnResize: true,
        },
        rightPriceScale: {
          borderColor: 'rgba(0, 255, 255, 0.2)',
        },
      });

      const candleSeries = chart.addSeries('Candlestick' as any, {
        upColor: 'hsl(75, 100%, 50%)',
        downColor: 'hsl(5, 85%, 60%)',
        borderUpColor: 'hsl(75, 100%, 50%)',
        borderDownColor: 'hsl(5, 85%, 60%)',
        wickUpColor: 'hsl(75, 100%, 50%)',
        wickDownColor: 'hsl(5, 85%, 60%)',
        priceLineVisible: false,
      });

      const emaSeries = chart.addSeries('Line' as any, {
        color: 'hsl(197, 100%, 54%)',
        lineWidth: 2,
        title: 'EMA 50',
      });

      // Add volume histogram series
      const volumeSeries = chart.addSeries('Histogram' as any, {
        color: 'rgba(0, 255, 255, 0.3)',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      } as any);

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      emaSeriesRef.current = emaSeries;
      volumeSeriesRef.current = volumeSeries;

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
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

  // Update chart data when timeframe or data changes
  useEffect(() => {
    if (!candleSeriesRef.current || !emaSeriesRef.current || !volumeSeriesRef.current) return;
    if (!chartRef.current) return;

    try {
      const chartData = getChartData();
      const emaData = getEmaData();

      if (chartData && chartData.length > 0) {
        // Filter out null/invalid candles
        const safeCandles = chartData.filter(
          (c: any) =>
            c &&
            c.time != null &&
            c.open != null &&
            c.high != null &&
            c.low != null &&
            c.close != null
        );

        if (safeCandles.length === 0) return;

        candleSeriesRef.current.setData(safeCandles);
        
        // Show limited visible range based on timeframe
        const visibleBars = selectedTimeframe === '1h' ? 48 : 96;
        const from = Math.max(0, safeCandles.length - visibleBars);
        
        if (chartRef.current && from >= 0 && safeCandles.length > 0) {
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: from,
            to: safeCandles.length - 1
          });
        }

        // Update volume data
        const volumeData = safeCandles
          .map((candle: any) => {
            const rawData = selectedTimeframe === '1h' 
              ? priceData?.['1h']?.find((d: any) => d.time === candle.time)
              : null;
            
            return {
              time: candle.time,
              value: rawData?.volume || 0,
              color: candle.close >= candle.open 
                ? 'rgba(126, 255, 51, 0.4)'
                : 'rgba(255, 77, 77, 0.4)'
            };
          })
          .filter((v: any) => v.time != null && v.value != null);

        if (volumeData.length > 0) {
          volumeSeriesRef.current.setData(volumeData);
        }
      }

      if (emaData && emaData.length > 0) {
        const safeEmaData = emaData.filter((e: any) => e && e.time != null && e.value != null);
        if (safeEmaData.length > 0) {
          emaSeriesRef.current.setData(safeEmaData);
        } else {
          emaSeriesRef.current.setData([]);
        }
      } else {
        emaSeriesRef.current.setData([]);
      }
    } catch (e) {
      console.warn('Chart update skipped:', e);
    }
  }, [selectedTimeframe, priceData, emas]);

  if (!symbol) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Enter a symbol to view chart data</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Timeframe Selector Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['1h', '15m'] as const).map(tf => (
            <button
              key={tf}
              className={`px-6 py-3 rounded-lg border transition-all ${
                selectedTimeframe === tf
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-border/30 text-muted-foreground hover:border-primary/50'
              }`}
              onClick={() => setSelectedTimeframe(tf)}
            >
              <div className="text-sm font-semibold">{tf.toUpperCase()}</div>
              <div className="text-xs opacity-70">{getTimeframeStatus(tf)}</div>
            </button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {symbol}
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full rounded-xl border border-primary/20 bg-card/30 backdrop-blur-sm overflow-hidden"
      />
      
      {/* Zoom Controls Hint */}
      <div className="text-xs text-muted-foreground text-center">
        Scroll to zoom • Drag to pan • Double-click to reset
      </div>
    </div>
  );
}
