import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function OrderBook() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Price (USD)</span>
          <span>Amount (BTC)</span>
          <span>Total</span>
        </div>
        <div className="space-y-2 mt-2">
          {/* Bids */}
          {[...Array(15)].map((_, i) => (
            <div key={i} className="flex justify-between items-center text-red-500">
              <span>45,234.87</span>
              <span>0.123</span>
              <span>5,564.34</span>
            </div>
          ))}
          <div className="py-2 text-center text-lg font-bold">
            45,235.50
          </div>
          {/* Asks */}
          {[...Array(15)].map((_, i) => (
            <div key={i} className="flex justify-between items-center text-green-500">
              <span>45,236.12</span>
              <span>0.456</span>
              <span>20,628.78</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
