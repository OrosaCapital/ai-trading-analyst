import { useEffect, useRef } from "react";
import { createChart, IChartApi } from "lightweight-charts";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sentiment: number;
  rsi: number;
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

interface ChartData {
  candles: Candle[];
  indicators: {
    ema50: IndicatorPoint[];
    ema200: IndicatorPoint[];
  };
  volumeBubbles: VolumeBubble[];
}

interface OcapxChartProps {
  symbol?: string;
  data?: ChartData;
  isLoading?: boolean;
}

// Sentiment-based color mapping (0-10 scale)
const getSentimentColor = (sentiment: number): { up: string; down: string } => {
  if (sentiment <= 1) return { up: 'rgba(76, 255, 163, 0.9)', down: 'rgba(76, 255, 163, 0.7)' }; // MAX FEAR - bright green
  if (sentiment <= 3) return { up: 'rgba(152, 255, 246, 0.9)', down: 'rgba(152, 255, 246, 0.7)' }; // FEAR - cyan
  if (sentiment <= 4) return { up: 'rgba(59, 130, 246, 0.9)', down: 'rgba(59, 130, 246, 0.7)' }; // CAUTION - blue
  if (sentiment <= 6) return { up: 'rgba(234, 179, 8, 0.9)', down: 'rgba(234, 179, 8, 0.7)' }; // NEUTRAL - yellow
  if (sentiment <= 7) return { up: 'rgba(249, 115, 22, 0.9)', down: 'rgba(249, 115, 22, 0.7)' }; // GREED - orange
  if (sentiment <= 9) return { up: 'rgba(239, 68, 68, 0.9)', down: 'rgba(239, 68, 68, 0.7)' }; // EXTREME GREED - red
  return { up: 'rgba(236, 72, 153, 0.9)', down: 'rgba(236, 72, 153, 0.7)' }; // MAX EUPHORIA - pink
};

export const OcapxChart = ({ symbol = "BTCUSD", data, isLoading }: OcapxChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.7)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(152, 255, 246, 0.5)',
          width: 1,
          style: 3,
          labelBackgroundColor: 'rgba(152, 255, 246, 0.2)',
        },
        horzLine: {
          color: 'rgba(152, 255, 246, 0.5)',
          width: 1,
          style: 3,
          labelBackgroundColor: 'rgba(152, 255, 246, 0.2)',
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    chartRef.current = chart;

    // Prepare candlestick data with sentiment-based coloring
    const candlestickData = data.candles.map(candle => {
      const colors = getSentimentColor(candle.sentiment);
      return {
        time: candle.time as any,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        color: candle.close >= candle.open ? colors.up : colors.down,
      };
    });

    // Add candlestick series using addSeries
    const candlestickSeries = (chart as any).addSeries('candlestick', {
      upColor: 'rgba(152, 255, 246, 0.9)',
      downColor: 'rgba(255, 71, 133, 0.9)',
      borderVisible: true,
      wickVisible: true,
    });
    
    candlestickSeries.setData(candlestickData);

    // Add EMA 50
    const ema50Data = data.indicators.ema50.map(point => ({
      time: point.time as any,
      value: point.value,
    }));
    
    const ema50Series = (chart as any).addSeries('line', {
      color: 'rgba(76, 175, 80, 0.8)',
      lineWidth: 2,
      title: 'EMA 50',
    });
    ema50Series.setData(ema50Data);

    // Add EMA 200
    const ema200Data = data.indicators.ema200.map(point => ({
      time: point.time as any,
      value: point.value,
    }));
    
    const ema200Series = (chart as any).addSeries('line', {
      color: 'rgba(255, 255, 255, 0.6)',
      lineWidth: 2,
      title: 'EMA 200',
    });
    ema200Series.setData(ema200Data);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="relative w-full h-full">
        <div className="glass-strong rounded-xl overflow-hidden p-6 h-[500px]">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-primary/10 rounded w-1/4"></div>
            <div className="h-64 bg-primary/10 rounded shimmer"></div>
            <div className="grid grid-cols-4 gap-4">
              <div className="h-16 bg-primary/10 rounded"></div>
              <div className="h-16 bg-primary/10 rounded"></div>
              <div className="h-16 bg-primary/10 rounded"></div>
              <div className="h-16 bg-primary/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative w-full h-full">
        <div className="glass-strong rounded-xl overflow-hidden p-6 h-[500px] flex items-center justify-center">
          <p className="text-muted-foreground">Select a symbol to view chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div className="glass-strong rounded-xl overflow-hidden border border-primary/20 shadow-[0_0_30px_rgba(152,255,246,0.15)]">
        {/* Chart Header */}
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gradient">{symbol}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Sentiment-Based Analysis • {data.candles.length} Candles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow"></div>
              <span className="text-xs font-medium">MOCK DATA</span>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="p-4">
          <div ref={chartContainerRef} className="w-full" />
        </div>

        {/* Chart Legend */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-xs text-muted-foreground">EMA 50</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-white/60"></div>
            <span className="text-xs text-muted-foreground">EMA 200</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-xs text-muted-foreground">Fear</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-xs text-muted-foreground">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-xs text-muted-foreground">Greed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Bubbles Indicator */}
      {data.volumeBubbles.length > 0 && (
        <div className="absolute top-20 right-6 glass rounded-lg px-4 py-3 border border-border/30 animate-fade-in">
          <p className="text-xs font-medium text-muted-foreground mb-2">Volume Spikes</p>
          <div className="flex flex-col gap-2">
            {data.volumeBubbles.slice(0, 3).map((bubble, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    bubble.type === 'buy' ? 'bg-green-500 glow-success' : 'bg-red-500 glow-error'
                  }`}
                ></div>
                <span className="text-xs uppercase">{bubble.type}</span>
                <span className="text-xs text-muted-foreground ml-auto">{bubble.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
