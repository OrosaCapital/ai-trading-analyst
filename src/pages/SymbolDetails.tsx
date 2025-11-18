import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import {
  Coins,
  TrendingUp,
  Activity,
  Search,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity as ActivityIcon,
  Gauge,
  LineChart,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { normalizeSymbol, addUsdSuffix } from "@/lib/symbolUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSymbolData } from "@/hooks/useSymbolData";
import { TechMetricCard } from "@/components/symbol/TechMetricCard";
import { SymbolAIChat } from "@/components/symbol/SymbolAIChat";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function SymbolDetails() {
  const { symbolParam } = useParams<{ symbolParam: string }>();
  const navigate = useNavigate();
  const [searchSymbol, setSearchSymbol] = useState("");
  const normalizedSymbol = normalizeSymbol(symbolParam || "BTC");
  const tradingSymbol = addUsdSuffix(normalizedSymbol);
  
  const { data, isLoading, error } = useSymbolData(tradingSymbol);

  const handleSymbolSearch = () => {
    if (searchSymbol.trim()) {
      navigate(`/symbol/${searchSymbol.trim().toUpperCase()}`);
      setSearchSymbol("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSymbolSearch();
    }
  };

  const getAIDecisionColor = () => {
    if (data.aiDecision === "BUY") return "text-emerald-400";
    if (data.aiDecision === "SELL") return "text-red-400";
    return "text-yellow-400";
  };

  const getAIDecisionBadge = () => {
    if (data.aiDecision === "BUY") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    if (data.aiDecision === "SELL") return "bg-red-500/20 text-red-400 border-red-500/50";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
  };

  return (
    <AppShell symbol={tradingSymbol}>
      <div className="space-y-4">
        {/* Hero Header - Iron Man Style */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card/90 to-card/70 backdrop-blur-xl border-primary/30 shadow-2xl">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 animate-pulse" />
          
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              {/* Symbol info */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                    <Coins className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    {normalizedSymbol}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">{tradingSymbol}</p>
                </div>
              </div>

              {/* Search input */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter symbol (e.g., BTC, ETH)"
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-64 bg-background/50 backdrop-blur-sm border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button onClick={handleSymbolSearch} size="icon" className="bg-primary/20 hover:bg-primary/30 border border-primary/50">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Live price display */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">CMC Rank</p>
                <p className="text-2xl font-bold text-primary">
                  {data.rank ? `#${data.rank}` : "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Price</p>
                <p className="text-3xl font-bold text-foreground">
                  {data.currentPrice ? `$${data.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">24h Change</p>
                <p className={`text-2xl font-bold ${data.priceChange24h && data.priceChange24h > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.priceChange24h ? `${data.priceChange24h > 0 ? "+" : ""}${data.priceChange24h.toFixed(2)}%` : "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">24h Volume</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.volume24h ? `$${(data.volume24h / 1e9).toFixed(2)}B` : "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Market Cap</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.marketCap ? `$${(data.marketCap / 1e9).toFixed(2)}B` : "--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Circulating Supply</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.circulatingSupply ? `${(data.circulatingSupply / 1e6).toFixed(2)}M` : "--"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Market Analyst Chat */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <div className="relative p-6">
            <SymbolAIChat symbolData={{ symbol: normalizedSymbol, ...data }} />
          </div>
        </Card>

        {/* Real-time Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TechMetricCard
            title="Funding Rate"
            value={typeof data.fundingRate === 'number' ? `${(data.fundingRate * 100).toFixed(4)}` : null}
            unit="%"
            icon={<Target className="h-5 w-5" />}
            isLoading={isLoading}
            trend={data.fundingRateTrend === "up" ? "up" : data.fundingRateTrend === "down" ? "down" : "neutral"}
            highlight={Math.abs(data.fundingRate || 0) > 0.01}
          />
          
          <TechMetricCard
            title="Open Interest"
            value={typeof data.openInterest === 'number' ? `$${(data.openInterest / 1e6).toFixed(2)}M` : null}
            change={data.openInterestChange}
            icon={<BarChart3 className="h-5 w-5" />}
            isLoading={isLoading}
          />
          
          <TechMetricCard
            title="Long/Short Ratio"
            value={typeof data.longShortRatio === 'number' ? data.longShortRatio.toFixed(2) : null}
            icon={<PieChart className="h-5 w-5" />}
            isLoading={isLoading}
            trend={typeof data.longShortRatio === 'number' && data.longShortRatio > 1 ? "up" : "down"}
          />
          
          <TechMetricCard
            title="24h Liquidations"
            value={typeof data.liquidations24h === 'number' ? `$${(data.liquidations24h / 1e6).toFixed(2)}M` : null}
            icon={<ActivityIcon className="h-5 w-5" />}
            isLoading={isLoading}
            highlight={(data.liquidations24h || 0) > 100e6}
          />
        </div>

        {/* Technical Indicators */}
        <Card className="p-6 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-xl border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <LineChart className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Technical Indicators</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TechMetricCard
              title="RSI (14)"
              value={typeof data.rsi === 'number' ? data.rsi.toFixed(2) : null}
              icon={<Gauge className="h-5 w-5" />}
              isLoading={isLoading}
              trend={typeof data.rsi === 'number' && data.rsi > 70 ? "up" : typeof data.rsi === 'number' && data.rsi < 30 ? "down" : "neutral"}
              highlight={typeof data.rsi === 'number' && (data.rsi > 70 || data.rsi < 30)}
            />
            
            <TechMetricCard
              title="Taker Buy Volume"
              value={typeof data.takerBuyVolume === 'number' ? `$${(data.takerBuyVolume / 1e6).toFixed(2)}M` : null}
              icon={<TrendingUp className="h-5 w-5" />}
              isLoading={isLoading}
            />
            
            <TechMetricCard
              title="Taker Sell Volume"
              value={typeof data.takerSellVolume === 'number' ? `$${(data.takerSellVolume / 1e6).toFixed(2)}M` : null}
              icon={<TrendingDown className="h-5 w-5" />}
              isLoading={isLoading}
            />
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
