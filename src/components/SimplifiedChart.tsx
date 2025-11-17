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

type Timeframe = '1h' | '15m' | '5m' | '1m';

export function SimplifiedChart({ symbol, priceData, emas }: SimplifiedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const emaSeriesRef = useRef<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15m');

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
      case '5m':
        return convertLogsToCandlesticks(priceData['5m'] || [], 5);
      case '1m':
        return convertLogsToCandlesticks(priceData['1m'] || [], 1);
      default:
        return [];
    }
  };

  // Get EMA data for selected timeframe
  const getEmaData = (): LineData[] => {
    if (!emas) return [];

    const chartData = getChartData();
    const emaValues = emas[selectedTimeframe as '5m' | '15m' | '1h'];
    
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
        return `${(priceData['15m'] || []).length} Valid`;
      case '5m':
        return `${(priceData['5m'] || []).length} Points`;
      case '1m':
        return `${(priceData['1m'] || []).length} Logs`;
      default:
        return 'No data';
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
      height: 600,
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
    });

    const emaSeries = chart.addSeries('Line' as any, {
      color: 'hsl(197, 100%, 54%)',
      lineWidth: 2,
      title: 'EMA 50',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    emaSeriesRef.current = emaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data when timeframe or data changes
  useEffect(() => {
    if (!candleSeriesRef.current || !emaSeriesRef.current) return;

    const chartData = getChartData();
    const emaData = getEmaData();

    if (chartData.length > 0) {
      candleSeriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();
    }

    if (emaData.length > 0) {
      emaSeriesRef.current.setData(emaData);
    } else {
      emaSeriesRef.current.setData([]);
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
          {(['1h', '15m', '5m', '1m'] as Timeframe[]).map(tf => (
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
    </div>
  );
}
