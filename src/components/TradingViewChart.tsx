import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart = memo(({ symbol }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Load TradingView widget script if not already loaded
    const loadScript = () => {
      return new Promise<void>((resolve) => {
        if (window.TradingView) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const initWidget = async () => {
      await loadScript();

      if (!containerRef.current || !window.TradingView) return;

      // Clean up previous widget
      if (widgetRef.current) {
        containerRef.current.innerHTML = '';
      }

      // Convert symbol format (BTCUSDT -> BTCUSD or keep as is)
      const tvSymbol = symbol.includes('USDT') ? symbol.replace('USDT', 'USD') : symbol;

      // Create new TradingView widget
      widgetRef.current = new window.TradingView.widget({
        container_id: containerRef.current.id,
        width: '100%',
        height: '100%',
        symbol: `BINANCE:${tvSymbol}`,
        interval: '60',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: 'rgba(0, 0, 0, 0)',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        gridColor: 'rgba(42, 46, 57, 0.3)',
        hide_side_toolbar: false,
        allow_symbol_change: true,
        studies: [
          'RSI@tv-basicstudies',
          'MASimple@tv-basicstudies',
        ],
        disabled_features: [
          'use_localstorage_for_settings',
          'header_widget',
        ],
        enabled_features: [
          'study_templates',
        ],
      });
    };

    initWidget();

    return () => {
      if (widgetRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
        widgetRef.current = null;
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-full glass-panel rounded-lg border border-border/50 overflow-hidden">
      <div
        id={`tradingview_${symbol}`}
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
