import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface DataValidationPanelProps {
  message: string;
  progress: number;
}

export const DataValidationPanel = ({ message, progress }: DataValidationPanelProps) => {
  return (
    <Card className="border-2 border-accent/30 glass-strong animate-scale-in">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
          <LoadingSpinner size="lg" className="absolute inset-0 w-16 h-16" />
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
      </CardContent>
    </Card>
  );
};
