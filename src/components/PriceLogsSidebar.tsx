import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface PriceLog {
  timestamp: string;
  price: number;
  volume: number;
}

interface PriceLogsSidebarProps {
  logs1m: PriceLog[];
  logs5m: PriceLog[];
  logs10m: PriceLog[];
  logs15m: PriceLog[];
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const PriceLogsSidebar = ({ logs1m, logs5m, logs10m, logs15m }: PriceLogsSidebarProps) => {
  return (
    <div className="w-64 glass-strong border-l border-primary/30 p-4 space-y-4 overflow-y-auto max-h-[600px]">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-primary font-bold text-lg">Live Price Logs</h3>
      </div>
      
      {/* 1m Logs */}
      <div className="log-section animate-fade-in">
        <Badge variant="outline" className="mb-2 border-chart-green text-chart-green">1 Minute</Badge>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {logs1m.slice(-5).reverse().map((log, i) => (
            <div key={i} className="flex justify-between text-xs hover:bg-primary/5 p-1 rounded transition-colors">
              <span className="text-muted-foreground">{formatTime(log.timestamp)}</span>
              <span className="text-chart-green font-mono font-semibold">${log.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 5m Logs */}
      <div className="log-section animate-fade-in" style={{ animationDelay: '100ms' }}>
        <Badge variant="outline" className="mb-2 border-primary text-primary">5 Minute</Badge>
        <div className="space-y-1">
          {logs5m.slice(-3).reverse().map((log, i) => (
            <div key={i} className="flex justify-between text-xs hover:bg-primary/5 p-1 rounded transition-colors">
              <span className="text-muted-foreground">{formatTime(log.timestamp)}</span>
              <span className="text-primary font-mono font-semibold">${log.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 10m Logs */}
      <div className="log-section animate-fade-in" style={{ animationDelay: '200ms' }}>
        <Badge variant="outline" className="mb-2 border-accent text-accent">10 Minute</Badge>
        <div className="space-y-1">
          {logs10m.slice(-2).reverse().map((log, i) => (
            <div key={i} className="flex justify-between text-xs hover:bg-accent/5 p-1 rounded transition-colors">
              <span className="text-muted-foreground">{formatTime(log.timestamp)}</span>
              <span className="text-accent font-mono font-semibold">${log.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 15m Logs */}
      <div className="log-section animate-fade-in" style={{ animationDelay: '300ms' }}>
        <Badge variant="outline" className="mb-2 border-destructive text-destructive">15 Minute</Badge>
        <div className="space-y-1">
          {logs15m.slice(-2).reverse().map((log, i) => (
            <div key={i} className="flex justify-between text-xs hover:bg-destructive/5 p-1 rounded transition-colors">
              <span className="text-muted-foreground">{formatTime(log.timestamp)}</span>
              <span className="text-destructive font-mono font-semibold">${log.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
