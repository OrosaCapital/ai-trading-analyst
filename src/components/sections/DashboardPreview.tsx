import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { AIAnalysisPanel } from "@/components/dashboard/AIAnalysisPanel";

export const DashboardPreview = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Live <span className="text-accent">Dashboard Preview</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See real-time market data, AI analysis, and trading signals in action
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Center Panel - Chart */}
          <div className="lg:col-span-1">
            <ChartPanel />
          </div>

          {/* Right Panel - AI Analysis */}
          <div className="lg:col-span-1">
            <AIAnalysisPanel symbol="BTC" />
          </div>
        </div>
      </div>
    </section>
  );
};
