import { useState } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TradingCommandCenterProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  timeframe: string;
  onTimeframeChange: (timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d") => void;
  currentPrice?: number;
}

const QUICK_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT", "XRPUSDT"];

export function TradingCommandCenter({
  symbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  currentPrice,
}: TradingCommandCenterProps) {
  const [searchValue, setSearchValue] = useState(symbol);

  const handleSearch = () => {
    onSymbolChange(searchValue.toUpperCase());
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Left - Symbol Search & Quick Access */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter symbol (e.g., BTCUSDT)"
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} size="sm">
              Search
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {QUICK_SYMBOLS.map((sym) => (
              <Button
                key={sym}
                variant={symbol === sym ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSearchValue(sym);
                  onSymbolChange(sym);
                }}
                className="text-xs"
              >
                {sym.replace("USDT", "")}
              </Button>
            ))}
          </div>
        </div>

        {/* Center - Current Price */}
        {currentPrice && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{symbol}</div>
              <div className="text-2xl font-bold text-foreground">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        )}

        {/* Right - Timeframe Selector */}
        <Tabs value={timeframe} onValueChange={(v) => onTimeframeChange(v as any)}>
          <TabsList>
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="5m">5M</TabsTrigger>
            <TabsTrigger value="15m">15M</TabsTrigger>
            <TabsTrigger value="1h">1H</TabsTrigger>
            <TabsTrigger value="4h">4H</TabsTrigger>
            <TabsTrigger value="1d">1D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
