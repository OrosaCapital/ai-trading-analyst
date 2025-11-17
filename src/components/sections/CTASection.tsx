import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      
      <div className="container mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-black mb-6">
          Ready to Trade
          <span className="text-accent"> Smarter?</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Join thousands of traders using AI-powered insights to make better decisions
        </p>

        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xl px-12 py-8 rounded-full font-bold shadow-[0_0_40px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.7)] transition-all hover:scale-105"
        >
          Start Trading Now
          <ArrowRight className="ml-3 w-6 h-6" />
        </Button>

        <p className="mt-8 text-muted-foreground">
          No credit card required • Free trial available
        </p>
      </div>
    </section>
  );
};
