import { MainChart } from "../components/charts/MainChart";
import { SymbolSummaryPanel } from "../components/panels/SymbolSummaryPanel";
import { DataValidationPanel } from "../components/panels/DataValidationPanel";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { useMarketData } from "../hooks/useMarketData";

export function Dashboard() {
  const { snapshot, validation, isLoading, error } = useMarketData();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">ADMIN TESTING PANEL</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MainChart snapshot={snapshot} />
        </div>
        <div className="space-y-4">
          <SymbolSummaryPanel snapshot={snapshot} />
          <DataValidationPanel validation={validation} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
