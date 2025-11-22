import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRealtimePriceStream } from "@/hooks/useRealtimePriceStream";
import { use24hStats } from "@/hooks/use24hStats";
import { formatPrice, formatVolume } from "@/lib/priceFormatter";

export function MarketDataSidebar() {
  const symbol = "BTCUSDT";
  const { priceData, isConnected } = useRealtimePriceStream(symbol, true);
  const { high, low, volume, isLoading } = use24hStats(symbol);
  const currentPrice = priceData?.price ?? null;
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Market Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div>
          <h3 className="font-semibold">BTC/USD</h3>
          <p className="text-2xl font-bold">
            {currentPrice ? formatPrice(currentPrice) : (isConnected ? "Connecting..." : "WebSocket Offline")}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>24h High</span> <span>{high ? formatPrice(high) : "Loading..."}</span></div>
          <div className="flex justify-between"><span>24h Low</span> <span>{low ? formatPrice(low) : "Loading..."}</span></div>
          <div className="flex justify-between"><span>24h Volume</span> <span>{volume ? formatVolume(volume) : "Loading..."}</span></div>
        </div>
        <div className="flex-grow overflow-y-auto">
          <h3 className="font-semibold pt-4">Market News</h3>
          <ul className="list-disc list-inside space-y-2 pt-2 text-sm">
            <li>Bitcoin surges past 45k on institutional buying.</li>
            <li>Ethereum 2.0 merge date announced.</li>
            <li>New DeFi protocol launches on Solana.</li>
            <li>Regulatory news from the US.</li>
            <li>Altcoin market sees major correction.</li>
            <li>NFT market volume hits new all-time high.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
