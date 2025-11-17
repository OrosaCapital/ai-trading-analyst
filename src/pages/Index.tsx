import { useState, useRef } from "react";
import { Hero } from "@/components/Hero";
import { AnalystInterface } from "@/components/AnalystInterface";

const Index = () => {
  const [showInterface, setShowInterface] = useState(false);
  const interfaceRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    setShowInterface(true);
    setTimeout(() => {
      interfaceRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero onGetStarted={handleGetStarted} />
      {showInterface && (
        <div ref={interfaceRef}>
          <AnalystInterface />
        </div>
      )}
    </div>
  );
};

export default Index;
