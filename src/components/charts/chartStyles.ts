import { ColorType } from 'lightweight-charts';

const lightColors = {
  background: '#FFFFFF',
  textColor: '#000000',
  gridColor: '#EAEAEA',
  borderColor: '#EAEAEA',
  upColor: '#26a69a',
  downColor: '#ef5350',
  ema9Color: '#FFC107',
  ema21Color: '#2196F3',
  ema50Color: '#9C27B0',
  vwapColor: '#FF6D00',
  prevHighColor: 'rgba(33, 150, 243, 0.4)',
  prevLowColor: 'rgba(233, 30, 99, 0.4)',
  rsiLineColor: '#FFC107',
  rsiOverboughtColor: 'rgba(239, 83, 80, 0.5)',
  rsiOversoldColor: 'rgba(38, 166, 154, 0.5)',
  rsiMidlineColor: 'rgba(158, 158, 158, 0.5)',
  macdLineColor: '#2196F3',
  macdSignalColor: '#FF6D00',
};

const darkColors = {
  background: 'transparent',
  textColor: 'hsl(var(--foreground))',
  gridColor: 'hsl(var(--chart-grid))',
  borderColor: 'hsl(var(--border))',
  upColor: '#26a69a',
  downColor: '#ef5350',
  ema9Color: '#FFC107',
  ema21Color: '#2196F3',
  ema50Color: '#9C27B0',
  vwapColor: '#FF6D00',
  prevHighColor: 'rgba(33, 150, 243, 0.4)',
  prevLowColor: 'rgba(233, 30, 99, 0.4)',
  rsiLineColor: '#FFC107',
  rsiOverboughtColor: 'rgba(239, 83, 80, 0.5)',
  rsiOversoldColor: 'rgba(38, 166, 154, 0.5)',
  rsiMidlineColor: 'rgba(158, 158, 158, 0.5)',
  macdLineColor: '#2196F3',
  macdSignalColor: '#FF6D00',
};

export const getChartOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return {
    layout: {
      background: { type: ColorType.Solid, color: colors.background },
      textColor: colors.textColor,
    },
    grid: {
      vertLines: { color: colors.gridColor },
      horzLines: { color: colors.gridColor },
    },
    rightPriceScale: { borderColor: colors.borderColor },
    timeScale: { 
      borderColor: colors.borderColor, 
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
};

export const candlestickSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return {
    upColor: colors.upColor,
    downColor: colors.downColor,
    borderUpColor: colors.upColor,
    borderDownColor: colors.downColor,
    wickUpColor: colors.upColor,
    wickDownColor: colors.downColor,
  };
};

export const volumeSeriesOptions = {
  priceScaleId: 'volume',
  priceFormat: { type: 'volume' },
};

export const ema9SeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { 
    color: colors.ema9Color,
    lineWidth: 3,
    lastValueVisible: true,
    priceLineVisible: false,
  };
};

export const ema21SeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { 
    color: colors.ema21Color,
    lineWidth: 2,
    lastValueVisible: true,
    priceLineVisible: false,
  };
};

export const ema50SeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { 
    color: colors.ema50Color,
    lineWidth: 2,
    lastValueVisible: true,
    priceLineVisible: false,
  };
};

export const vwapSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { 
    color: colors.vwapColor,
    lineWidth: 2 
  };
};

export const prevHighSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return {
    color: colors.prevHighColor,
    lineWidth: 1,
    lineStyle: 2,
  };
};

export const prevLowSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return {
    color: colors.prevLowColor,
    lineWidth: 1,
    lineStyle: 2,
  };
};

export const macdLineSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { color: colors.macdLineColor, lineWidth: 2 };
};

export const macdSignalSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { color: colors.macdSignalColor, lineWidth: 2 };
};

export const macdHistSeriesOptions = {};

export const rsiSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { color: colors.rsiLineColor, lineWidth: 2 };
};

export const rsiOverboughtSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { 
    color: colors.rsiOverboughtColor, 
    lineWidth: 1,
    lineStyle: 2,
  };
};

export const rsiOversoldSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { 
    color: colors.rsiOversoldColor, 
    lineWidth: 1,
    lineStyle: 2,
  };
};

export const rsiMidlineSeriesOptions = (theme: 'light' | 'dark' = 'dark') => {
  const colors = theme === 'light' ? lightColors : darkColors;
  return { 
    color: colors.rsiMidlineColor, 
    lineWidth: 1,
    lineStyle: 2,
  };
};

