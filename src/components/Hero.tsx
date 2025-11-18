import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--chart-grid))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--chart-grid))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* New Release Badge */}
        <div className="inline-flex items-center gap-2 mb-8 animate-bounce">
          <div className="bg-accent px-4 py-2 rounded-lg font-bold text-accent-foreground">
            NEW!
          </div>
          <div className="text-4xl font-bold tracking-tight">RELEASE</div>
        </div>

        {/* Main Heading */}
        <h1 className="text-7xl md:text-8xl font-black mb-6 tracking-tight">
          <span className="text-accent drop-shadow-[0_0_40px_hsl(var(--accent)/0.8)]">
            OCAPX
          </span>
        </h1>

        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
          AI TRADING ANALYST
        </h2>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
          Advanced AI-powered trading analysis with real-time sentiment analysis, volume bubbles, and trade signals
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full">
            <TrendingUp className="w-5 h-5 text-chart-green" />
            <span className="text-sm font-medium">Market Cycle Analysis</span>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Volume Bubbles</span>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full">
            <BarChart3 className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium">Pro Trade Signals</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-full font-bold shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.7)] transition-all"
          >
            Launch Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            onClick={onGetStarted}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 rounded-full font-bold"
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};
