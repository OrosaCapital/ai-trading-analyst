import { SentimentGauge } from "../SentimentGauge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card">
      <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">OCAPX AI Desk</div>
      <div className="flex-1 px-2 py-2">
        <Card className="glass-panel border border-border/50">
          <CardHeader className="pb-2 pt-2">
            <CardTitle className="text-xs">Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <SentimentGauge />
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
