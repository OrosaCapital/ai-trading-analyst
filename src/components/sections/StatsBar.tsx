import { useEffect, useRef, useState } from "react";
import { animateValue } from "@/lib/mockDataGenerators";
import { Card } from "@/components/ui/card";

const stats = [
  { label: "Signals Generated", end: 1200000, suffix: "+" },
  { label: "Accuracy Rate", end: 98.5, suffix: "%" },
  { label: "Active Users", end: 50000, suffix: "+" },
  { label: "Market Coverage", end: 24, suffix: "/7" }
];

export const StatsBar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => 0));
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          
          stats.forEach((stat, index) => {
            animateValue(0, stat.end, 2000, (value) => {
              setAnimatedValues(prev => {
                const newValues = [...prev];
                newValues[index] = value;
                return newValues;
              });
            });
          });
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const formatValue = (value: number, index: number) => {
    const stat = stats[index];
    if (stat.suffix === "%") return value.toFixed(1);
    if (stat.suffix === "/7") return Math.round(value);
    return Math.round(value).toLocaleString();
  };

  return (
    <section ref={sectionRef} className="py-16 px-4">
      <div className="container mx-auto">
        <Card className="glass p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-black mb-2 text-accent">
                  {formatValue(animatedValues[index], index)}
                  {stat.suffix}
                </div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};
