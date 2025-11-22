import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function TradeExecutionPanel() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Trade</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <Tabs defaultValue="market" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
            <TabsTrigger value="stop">Stop</TabsTrigger>
          </TabsList>
          <TabsContent value="market" className="flex-grow space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="market-amount">Amount</Label>
              <Input id="market-amount" placeholder="0.00" />
            </div>
            <div className="flex gap-2 mt-auto">
              <Button className="w-full bg-green-600 hover:bg-green-700">Buy</Button>
              <Button className="w-full bg-red-600 hover:bg-red-700">Sell</Button>
            </div>
          </TabsContent>
          <TabsContent value="limit" className="flex-grow space-y-4 pt-4">
             <div className="space-y-2">
              <Label htmlFor="limit-price">Limit Price</Label>
              <Input id="limit-price" placeholder="45000.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit-amount">Amount</Label>
              <Input id="limit-amount" placeholder="0.00" />
            </div>
            <div className="flex gap-2 mt-auto">
              <Button className="w-full bg-green-600 hover:bg-green-700">Buy</Button>
              <Button className="w-full bg-red-600 hover:bg-red-700">Sell</Button>
            </div>
          </TabsContent>
           <TabsContent value="stop" className="flex-grow space-y-4 pt-4">
             <div className="space-y-2">
              <Label htmlFor="stop-price">Stop Price</Label>
              <Input id="stop-price" placeholder="44500.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stop-amount">Amount</Label>
              <Input id="stop-amount" placeholder="0.00" />
            </div>
            <div className="flex gap-2 mt-auto">
              <Button className="w-full bg-green-600 hover:bg-green-700">Buy</Button>
              <Button className="w-full bg-red-600 hover:bg-red-700">Sell</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
