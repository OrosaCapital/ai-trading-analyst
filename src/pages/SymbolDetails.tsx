import { useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Coins, TrendingUp, Activity } from "lucide-react";
import { normalizeSymbol, addUsdSuffix } from "@/lib/symbolUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SymbolDetails() {
  const { symbolParam } = useParams<{ symbolParam: string }>();
  const normalizedSymbol = normalizeSymbol(symbolParam || "BTC");
  const tradingSymbol = addUsdSuffix(normalizedSymbol);

  return (
    <AppShell symbol={tradingSymbol}>
      <div className="space-y-4">
        {/* Symbol Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{normalizedSymbol}</h1>
                <p className="text-sm text-muted-foreground">{tradingSymbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Select a symbol to begin</p>
            </div>
          </div>
        </Card>

        {/* Chart Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Price Chart</h2>
          </div>
          <div className="h-[400px] flex items-center justify-center border border-border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">Chart will be integrated here</p>
          </div>
        </Card>

        {/* AI Signals Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI Trading Signals</h2>
          </div>
          <div className="h-[200px] flex items-center justify-center border border-border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">AI signals will appear here</p>
          </div>
        </Card>

        {/* Metrics Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {["Funding Rate", "Open Interest", "Long/Short Ratio", "24h Liquidations"].map((metric) => (
                  <div key={metric} className="p-4 border border-border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground mb-2">{metric}</p>
                    <p className="text-2xl font-bold text-foreground">--</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="metrics" className="mt-4">
              <div className="h-[300px] flex items-center justify-center border border-border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Detailed metrics charts will be added here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-4">
              <div className="h-[300px] flex items-center justify-center border border-border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Advanced analytics will be added here</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppShell>
  );
}
