import { TradingViewChart } from "./TradingViewChart";

interface OcapxChartProps {
  symbol?: string;
}

export const OcapxChart = ({ symbol = "BTCUSD" }: OcapxChartProps) => {
  return (
    <div className="relative w-full h-full">
      <div className="glass-strong rounded-xl overflow-hidden p-2">
        <TradingViewChart symbol={symbol} />
      </div>
    </div>
  );
};
