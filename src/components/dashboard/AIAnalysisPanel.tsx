import { Card } from "@/components/ui/card";
import { useMarketData } from "@/hooks/useMarketData";
import { DataValidationPanel } from "@/components/panels/DataValidationPanel";

interface AIAnalysisPanelProps {
  symbol: string;
}

export const AIAnalysisPanel = ({ symbol }: AIAnalysisPanelProps) => {
  const { snapshot, validation, isLoading, error } = useMarketData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        <span className="text-sm text-gray-400">Loading market data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-red-400">
        <div className="rounded-md bg-red-950/30 border border-red-800 px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {validation && <DataValidationPanel validation={validation} />}
      
      <Card title="Market Analysis">
        <div className="text-sm text-gray-500">
          {snapshot ? `Analyzing ${snapshot.symbol}...` : "No data available"}
        </div>
      </Card>
    </div>
  );
};
