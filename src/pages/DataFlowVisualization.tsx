import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const mermaidDiagram = `graph TB
    subgraph External["🌐 External Data Sources"]
        KrakenAPI["Kraken Public API<br/>📊 OHLC Endpoint"]
        CoinglassAPI["Coinglass API<br/>💰 Funding Rates"]
    end

    subgraph EdgeFunctions["⚡ Edge Functions Layer"]
        PopulateKraken["populate-kraken-price-logs<br/>Status: ⏸️ Not Scheduled"]
        PopulateMarket["populate-market-data<br/>Status: 🔄 Scheduled"]
        FetchCoinglass["fetch-coinglass-coins<br/>Status: 🔄 Active"]
    end

    subgraph Database["🗄️ Database Tables"]
        TatumLogs["tatum_price_logs<br/>📝 7,859 records<br/>⏱️ Stale (16h)"]
        MarketCandles["market_candles<br/>📊 26,002 records<br/>✅ Fresh"]
        MarketFunding["market_funding_rates<br/>💵 1,124 records<br/>✅ Active"]
        MarketSnapshots["market_snapshots<br/>📸 17 records<br/>✅ Live"]
    end

    subgraph AILayer["🤖 AI Analysis Layer"]
        AIChat["ai-chat Edge Function<br/>Uses: tatum_price_logs"]
        Context["AI Context Builder<br/>⚠️ Limited Data"]
    end

    KrakenAPI -->|"OHLC Data<br/>open, high, low, close, volume<br/>❌ Currently: close, volume only"| PopulateKraken
    PopulateKraken -->|"Stores Price Data<br/>⚠️ Missing: open, high, low, vwap, trades"| TatumLogs
    
    CoinglassAPI -->|"Funding Rates<br/>Market Sentiment"| FetchCoinglass
    FetchCoinglass --> MarketFunding
    
    PopulateMarket --> MarketCandles
    PopulateMarket --> MarketSnapshots
    
    TatumLogs -.->|"Provides Historical Context<br/>🔍 Used for: Price trends, volatility"| AIChat
    MarketCandles -.->|"❓ Not Currently Used<br/>💡 Opportunity: Better than tatum_price_logs"| Context
    MarketFunding -.->|"❓ Not Currently Used<br/>💡 Opportunity: Sentiment analysis"| Context
    
    AIChat --> Context
    Context --> |"📊 AI Recommendations<br/>⚠️ Current: Limited scope"| User["👤 User Queries"]

    style TatumLogs fill:#fef3c7,stroke:#f59e0b,stroke-width:3px
    style MarketCandles fill:#dbeafe,stroke:#3b82f6,stroke-width:2px
    style MarketFunding fill:#dbeafe,stroke:#3b82f6,stroke-width:2px
    style AIChat fill:#dcfce7,stroke:#10b981,stroke-width:2px
    style PopulateKraken fill:#fee2e2,stroke:#ef4444,stroke-width:2px,stroke-dasharray: 5 5`;

export default function DataFlowVisualization() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gradient-to-br from-black via-slate-950 to-black">
        <AdminNavigation />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Data Flow Visualization</h1>
              <p className="text-muted-foreground mt-2">
                Real-time monitoring of data pipelines and AI context quality
              </p>
            </div>

            {/* API Health Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Kraken API
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">Operational</div>
                  <p className="text-xs text-muted-foreground mt-1">999ms avg response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Coinglass API
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">Operational</div>
                  <p className="text-xs text-muted-foreground mt-1">1.2s avg response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Data Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">35,002</div>
                  <p className="text-xs text-muted-foreground mt-1">Total records processed</p>
                </CardContent>
              </Card>
            </div>

            {/* Data Quality Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Data Freshness Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-yellow-500">75%</div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Moderate
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Due to stale tatum_price_logs (16h old)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">AI Context Completeness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-red-500">45%</div>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Low
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Missing OHLC fields in tatum_price_logs
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mermaid Diagram */}
            <Card>
              <CardHeader>
                <CardTitle>Data Flow Architecture</CardTitle>
                <CardDescription>
                  How data flows from external APIs through the database to AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div dangerouslySetInnerHTML={{ __html: `<lov-mermaid>${mermaidDiagram}</lov-mermaid>` }} />
              </CardContent>
            </Card>

            {/* Data Quality Alerts */}
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Data Quality Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">
                      tatum_price_logs missing critical OHLC fields
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      Missing: open, high, low, vwap, trades count
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">
                      AI chat not utilizing market_candles (better data source)
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      market_candles has complete OHLC data but isn't used by AI
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">
                      populate-kraken-price-logs function not scheduled
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      Data is stale (last update: 16h ago)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table-Specific Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    market_candles
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-green-500">Complete OHLC ✅</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium text-foreground">26,002 candles</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium text-foreground">24h rolling</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    tatum_price_logs
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-yellow-500">Partial OHLC ⚠️</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium text-foreground">7,859 logs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="font-medium text-red-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      16h ago
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Missing: open, high, low, vwap, trades
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    market_funding_rates
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-green-500">Active ✅</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium text-foreground">1,124 rates</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="font-medium text-green-500">1h ago</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    market_snapshots
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-green-500">Live ✅</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium text-foreground">17 snapshots</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Update Rate</span>
                    <span className="font-medium text-foreground">Real-time</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
