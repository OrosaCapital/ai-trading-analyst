import { Search, Brain, Bell } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Connect Your Symbol",
    description: "Choose any cryptocurrency pair you want to analyze"
  },
  {
    icon: Brain,
    title: "AI Analyzes Markets",
    description: "Our advanced AI processes thousands of data points in real-time"
  },
  {
    icon: Bell,
    title: "Receive Actionable Signals",
    description: "Get clear buy/sell signals with confidence scores and risk levels"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-4 bg-secondary/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--chart-grid))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--chart-grid))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-accent">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to smarter trading decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-accent opacity-30" />
              )}
              
              <div className="text-center relative">
                <div className="mb-6 inline-flex w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent items-center justify-center mx-auto shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-6xl font-black text-accent/10">
                  {index + 1}
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
