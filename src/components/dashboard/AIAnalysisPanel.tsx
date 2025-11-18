import { Card } from "@/components/ui/card";
import { useMarketData } from "@/hooks/useMarketData";
import { DataValidationPanel } from "@/components/panels/DataValidationPanel";

interface AIAnalysisPanelProps {
  symbol: string;
}

export const AIAnalysisPanel = ({ symbol }: AIAnalysisPanelProps) => {
  const { snapshot, validation, isLoading, error } = useMarketData();

  return (
    <div className="space-y-4">
      <DataValidationPanel validation={validation} isLoading={isLoading} error={error} />
      
      <Card title="Market Analysis">
        <div className="text-sm text-gray-500">
          {snapshot ? `Analyzing ${snapshot.symbol}...` : "No data available"}
        </div>
      </Card>
    </div>
  );
};
