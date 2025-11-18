import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DataAccumulationProgressProps {
  message: string;
  progress: number;
}

export const DataAccumulationProgress = ({ message, progress }: DataAccumulationProgressProps) => {
  return (
    <Card className="border-2 border-accent/30 glass-strong animate-scale-in p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 relative">
        <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
        <Loader2 className="absolute inset-0 w-16 h-16 text-accent animate-spin" />
      </div>
      <h3 className="text-2xl font-bold text-accent mb-2">Collecting Market Data</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-accent to-chart-green transition-all duration-500 glow-accent"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Minimum 15 minutes required for accurate analysis</p>
    </Card>
  );
};
