import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export function PositionManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions & History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="positions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="positions">Positions (1)</TabsTrigger>
            <TabsTrigger value="orders">Orders (2)</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
          </TabsList>
          <TabsContent value="positions">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Mark Price</TableHead>
                  <TableHead>Unrealized PnL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>BTC/USD</TableCell>
                  <TableCell>0.5</TableCell>
                  <TableCell>42,000.00</TableCell>
                  <TableCell>45,235.50</TableCell>
                  <TableCell className="text-green-500">+1,617.75 (7.70%)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="orders">
             <p className="text-muted-foreground pt-4">No open orders.</p>
          </TabsContent>
          <TabsContent value="history">
             <p className="text-muted-foreground pt-4">No trade history.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
