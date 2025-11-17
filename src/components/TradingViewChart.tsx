import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart = ({ symbol = "BTCUSD" }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Load TradingView widget script if not already loaded
    const loadTradingViewWidget = () => {
      if (window.TradingView) {
        initWidget();
      } else {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => initWidget();
        document.head.appendChild(script);
      }
    };

    const initWidget = () => {
      if (containerRef.current && window.TradingView) {
        // Clear previous widget if exists
        if (widgetRef.current) {
          containerRef.current.innerHTML = "";
        }

        widgetRef.current = new window.TradingView.widget({
          symbol: symbol,
          interval: "D",
          timezone: "exchange",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "hsl(215, 25%, 12%)",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          backgroundColor: "hsl(215, 25%, 12%)",
          gridColor: "hsl(217, 25%, 20%)",
          studies: [
            {
              id: "MAExp@tv-basicstudies",
              inputs: { length: 50 },
              styles: {
                plot_0: {
                  color: "hsl(152, 100%, 50%)",
                  linewidth: 2,
                  plottype: "line",
                },
              },
            },
            {
              id: "MAExp@tv-basicstudies",
              inputs: { length: 200 },
              styles: {
                plot_0: {
                  color: "#ffffff",
                  linewidth: 2,
                  plottype: "line",
                },
              },
            },
          ],
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "hsl(152, 100%, 50%)",
            "mainSeriesProperties.candleStyle.downColor": "hsl(0, 72%, 51%)",
            "mainSeriesProperties.candleStyle.borderUpColor": "hsl(152, 100%, 50%)",
            "mainSeriesProperties.candleStyle.borderDownColor": "hsl(0, 72%, 51%)",
            "mainSeriesProperties.candleStyle.wickUpColor": "hsl(152, 100%, 50%)",
            "mainSeriesProperties.candleStyle.wickDownColor": "hsl(0, 72%, 51%)",
            "paneProperties.background": "hsl(215, 25%, 12%)",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "hsl(217, 25%, 20%)",
            "paneProperties.horzGridProperties.color": "hsl(217, 25%, 20%)",
            "scalesProperties.textColor": "hsl(215, 15%, 65%)",
            "scalesProperties.lineColor": "hsl(217, 25%, 25%)",
          },
          disabled_features: ["use_localstorage_for_settings"],
          enabled_features: ["study_templates"],
          loading_screen: { backgroundColor: "hsl(215, 25%, 12%)" },
          width: "100%",
          height: "100%",
        });
      }
    };

    loadTradingViewWidget();

    return () => {
      if (widgetRef.current && widgetRef.current.remove) {
        widgetRef.current.remove();
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[600px] bg-background rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        id={`tradingview-widget-${symbol}`}
        className="w-full h-full"
      />
    </div>
  );
};