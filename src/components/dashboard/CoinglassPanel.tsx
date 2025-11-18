import { Zap } from 'lucide-react';

interface CoinglassPanelProps {
  symbol: string;
}

export const CoinglassPanel = ({ symbol }: CoinglassPanelProps) => {
  // Placeholder - will be implemented with coinglass data later
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-accent/5 to-background p-6 border border-border/50">
        <div className="relative z-10">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
            Coinglass Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};
