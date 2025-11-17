import { Target, BarChart3, TrendingUp, Bell, Activity, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "AI Signal Detection",
    description: "Advanced ML algorithms identify high-probability trades with 98.5% accuracy"
  },
  {
    icon: BarChart3,
    title: "Multi-Timeframe Analysis",
    description: "Analyze 1M to 1D timeframes simultaneously for complete market picture"
  },
  {
    icon: TrendingUp,
    title: "Market Sentiment",
    description: "Real-time sentiment analysis from social media, news, and market data"
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified instantly when key signals trigger or conditions are met"
  },
  {
    icon: Activity,
    title: "Volume Bubbles",
    description: "Visualize unusual volume spikes and institutional activity instantly"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second data updates and analysis powered by cutting-edge infrastructure"
  }
];

export const FeaturesGrid = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful Features for
            <span className="text-accent"> Pro Traders</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to make informed trading decisions in one powerful dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 glass hover:bg-accent/5 transition-all duration-300 hover:scale-105 group"
            >
              <div className="mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
