import { Card } from "@/components/ui/card";

const sentiments = [
  { label: "MAX EUPHORIA", color: "bg-sentiment-euphoria" },
  { label: "EXTREME GREED", color: "bg-sentiment-extreme-greed" },
  { label: "HIGH GREED", color: "bg-sentiment-high-greed" },
  { label: "GREED", color: "bg-sentiment-greed" },
  { label: "MILD GREED", color: "bg-sentiment-mild-greed" },
  { label: "NEUTRAL", color: "bg-sentiment-neutral" },
  { label: "MILD CAUTION", color: "bg-sentiment-mild-caution" },
  { label: "CAUTION", color: "bg-sentiment-caution" },
  { label: "CONCERN", color: "bg-sentiment-concern" },
  { label: "FEAR", color: "bg-sentiment-fear" },
  { label: "MAX FEAR", color: "bg-sentiment-max-fear" },
];

export const SentimentLegend = () => {
  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-xl font-bold mb-4">Market Sentiment Index</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sentiments.map((sentiment) => (
          <div key={sentiment.label} className="flex items-center gap-3">
            <div className={`w-16 h-8 rounded ${sentiment.color}`} />
            <span className="text-sm font-medium text-foreground">{sentiment.label}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        The emotional cycle index maps market psychology from extreme fear (best buying opportunities) 
        to extreme euphoria (high risk zones). Based on RSI, funding rates, volume patterns, and open interest.
      </p>
    </Card>
  );
};
