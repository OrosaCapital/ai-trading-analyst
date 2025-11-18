import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LiquidationHeatmap } from "@/components/LiquidationHeatmap";
import { FundingRateChart } from "@/components/FundingRateChart";
import { OpenInterestBreakdown } from "@/components/OpenInterestBreakdown";
import { Activity, BarChart3, Flame, TrendingUp } from "lucide-react";

interface AdvancedAnalyticsTabsProps {
  symbol: string;
}

export function AdvancedAnalyticsTabs({ symbol }: AdvancedAnalyticsTabsProps) {
  return (
    <Card className="h-full">
      <Tabs defaultValue="liquidations" className="h-full flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="liquidations" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Liquidation Heatmap
          </TabsTrigger>
          <TabsTrigger value="funding" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Funding Rate History
          </TabsTrigger>
          <TabsTrigger value="oi" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Open Interest
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Order Flow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liquidations" className="flex-1 px-4 pb-4 mt-4">
          <LiquidationHeatmap symbol={symbol} />
        </TabsContent>

        <TabsContent value="funding" className="flex-1 px-4 pb-4 mt-4">
          <FundingRateChart symbol={symbol} />
        </TabsContent>

        <TabsContent value="oi" className="flex-1 px-4 pb-4 mt-4">
          <OpenInterestBreakdown symbol={symbol} />
        </TabsContent>

        <TabsContent value="flow" className="flex-1 px-4 pb-4 mt-4">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-sm">Order Flow Analysis</div>
              <div className="text-xs mt-2">Coming soon...</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
