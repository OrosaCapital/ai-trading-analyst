import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { useProfessionalChartData } from '@/hooks/useProfessionalChartData';
import { calculateTradeSignal, ChartDataForSignal } from '@/lib/signalEngine';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

interface ProfessionalTradingChartProps {
  symbol: string;
}

type Timeframe = '1H' | '15M' | '5M' | '1M';

export const ProfessionalTradingChart = ({ symbol }: ProfessionalTradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1H');
  const { chartData, isLoading, error } = useProfessionalChartData(symbol);
  
  const [tradeSignal, setTradeSignal] = useState<ReturnType<typeof calculateTradeSignal> | null>(null);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'hsl(var(--background))' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--border))' },
        horzLines: { color: 'hsl(var(--border))' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      timeScale: {
        borderColor: 'hsl(var(--border))',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'hsl(var(--border))',
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
    });
    
    // Main candlestick series
    const candleSeries = chart.addSeries('Candlestick', {
      upColor: '#00ff88',
      downColor: '#ff0055',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff0055',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff0055',
      borderVisible: true,
      priceLineVisible: true,
    });
    
    // 50 EMA line
    const emaSeries = chart.addSeries('Line', {
      color: '#ffa500',
      lineWidth: 3,
      title: '50 EMA',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    
    // Volume histogram
    const volumeSeries = chart.addSeries('Histogram', {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });
    
    // RSI indicator (separate pane)
    const rsiSeries = chart.addSeries('Line', {
      color: '#2962ff',
      lineWidth: 2,
      priceScaleId: 'rsi',
      scaleMargins: {
        top: 0.85,
        bottom: 0.05,
      },
    });
    
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    emaSeriesRef.current = emaSeries;
    volumeSeriesRef.current = volumeSeries;
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);
  
  // Update chart data when chartData or timeframe changes
  useEffect(() => {
    if (!chartData || !candleSeriesRef.current || !emaSeriesRef.current || !volumeSeriesRef.current || !rsiSeriesRef.current) return;
    
    const timeframeKey = activeTimeframe === '1H' ? '1h' : activeTimeframe === '15M' ? '15m' : activeTimeframe === '5M' ? '5m' : '1m';
    const candles = activeTimeframe === '1H' ? chartData.candles1h : 
                   activeTimeframe === '15M' ? chartData.candles15m : 
                   activeTimeframe === '5M' ? chartData.candles5m : 
                   chartData.candles1m;
    
    const indicators = chartData.indicators[timeframeKey === '1h' || timeframeKey === '15m' ? timeframeKey : '15m'];
    
    // Set candle data
    const candleData = candles.map(c => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(candleData);
    
    // Set EMA data
    const emaData = indicators.ema50.map((value, i) => ({
      time: candles[i]?.time as any,
      value,
    })).filter(d => d.time && d.value);
    emaSeriesRef.current.setData(emaData);
    
    // Set volume data
    const volumeData = candles.map(c => ({
      time: c.time as any,
      value: c.volume,
      color: c.close >= c.open ? '#00ff8844' : '#ff005544',
    }));
    volumeSeriesRef.current.setData(volumeData);
    
    // Set RSI data
    const rsiData = indicators.rsi.map((value, i) => ({
      time: candles[i]?.time as any,
      value,
    })).filter(d => d.time && d.value);
    rsiSeriesRef.current.setData(rsiData);
    
    // Add support/resistance lines
    if (chartRef.current) {
      chartData.levels.support.forEach(price => {
        candleSeriesRef.current?.createPriceLine({
          price,
          color: '#00ff88',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Support',
        });
      });
      
      chartData.levels.resistance.forEach(price => {
        candleSeriesRef.current?.createPriceLine({
          price,
          color: '#ff0055',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Resistance',
        });
      });
      
      // Add liquidity sweep markers
      const markers = chartData.liquiditySweeps.map(sweep => ({
        time: sweep.time as any,
        position: (sweep.type === 'high' ? 'aboveBar' : 'belowBar') as any,
        color: '#ffeb3b',
        shape: 'circle' as any,
        text: 'L',
        size: 2 as any,
      }));
      candleSeriesRef.current.setMarkers(markers);
    }
    
    // Calculate trade signal for current timeframe
    if (activeTimeframe === '1H' || activeTimeframe === '15M') {
      const latestPrice1h = chartData.candles1h[chartData.candles1h.length - 1]?.close || 0;
      const latestPrice15m = chartData.candles15m[chartData.candles15m.length - 1]?.close || 0;
      const latestVolume = candles[candles.length - 1]?.volume || 0;
      
      const signalData: ChartDataForSignal = {
        price1h: latestPrice1h,
        ema501h: chartData.indicators['1h'].ema50,
        rsi1h: chartData.indicators['1h'].rsi,
        price15m: latestPrice15m,
        ema5015m: chartData.indicators['15m'].ema50,
        rsi15m: chartData.indicators['15m'].rsi,
        currentVolume: latestVolume,
        volumeSMA: indicators.volumeSMA,
        coinglassSentiment: chartData.coinglass.overallSentiment,
      };
      
      const signal = calculateTradeSignal(signalData);
      setTradeSignal(signal);
    }
  }, [chartData, activeTimeframe]);
  
  // Apply Coinglass sentiment background tint
  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    
    const sentiment = chartData.coinglass.overallSentiment;
    let bgColor = 'hsl(var(--background))';
    
    if (sentiment === 'bullish') {
      bgColor = '#0a1f0f'; // Dark green tint
    } else if (sentiment === 'bearish') {
      bgColor = '#1f0a0a'; // Dark red tint
    }
    
    chartRef.current.applyOptions({
      layout: {
        background: { color: bgColor },
      },
    });
  }, [chartData]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] text-destructive">
        Error loading chart: {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Coinglass 4H Data Panel */}
      {chartData && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-background/50 rounded-lg border border-border">
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Funding Rate
            </div>
            <div className={`text-lg font-bold ${chartData.coinglass.fundingRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(chartData.coinglass.fundingRate * 100).toFixed(4)}%
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Open Interest
            </div>
            <div className="text-lg font-bold">
              ${chartData.coinglass.openInterest.toFixed(2)}B
              <span className={`text-sm ml-2 ${chartData.coinglass.oiChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {chartData.coinglass.oiChange > 0 ? '+' : ''}{chartData.coinglass.oiChange.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Liquidations 24h
            </div>
            <div className="text-lg font-bold">
              <span className="text-red-500">${chartData.coinglass.liquidations.longs.toFixed(1)}M</span>
              {' / '}
              <span className="text-green-500">${chartData.coinglass.liquidations.shorts.toFixed(1)}M</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Long/Short Ratio
            </div>
            <div className="text-lg font-bold">
              {chartData.coinglass.longShortRatio.toFixed(2)}
            </div>
          </div>
        </div>
      )}
      
      {/* Timeframe Selector & Signal Display */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['1H', '15M', '5M', '1M'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                activeTimeframe === tf
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {/* Trade Signal Display */}
        {tradeSignal && (
          <div className={`px-8 py-4 rounded-xl text-3xl font-bold shadow-2xl ${
            tradeSignal.signal === 'BUY' ? 'bg-green-500/90 text-white animate-pulse' :
            tradeSignal.signal === 'SELL' ? 'bg-red-500/90 text-white animate-pulse' :
            'bg-gray-500/90 text-white'
          }`}>
            {tradeSignal.signal}
          </div>
        )}
      </div>
      
      {/* Signal Details */}
      {tradeSignal && tradeSignal.signal !== 'NO TRADE' && (
        <div className="p-4 bg-background/50 rounded-lg border border-border">
          <div className="text-sm font-semibold mb-2">Signal Reasons:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {tradeSignal.reasons.map((reason, i) => (
              <li key={i}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}
      
      {tradeSignal && tradeSignal.signal === 'NO TRADE' && (
        <div className="p-4 bg-background/50 rounded-lg border border-destructive">
          <div className="text-sm font-semibold mb-2 text-destructive">Failed Conditions:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {tradeSignal.failedConditions.map((condition, i) => (
              <li key={i}>• {condition}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Chart Container */}
      <div ref={chartContainerRef} className="rounded-xl overflow-hidden border border-border" />
    </div>
  );
};
