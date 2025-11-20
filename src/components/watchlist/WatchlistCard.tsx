import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Eye, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatPrice } from '@/lib/priceFormatter';
import { useRealtimePriceStream } from '@/hooks/useRealtimePriceStream';
import type { WatchlistItem } from '@/hooks/useWatchlist';

interface WatchlistCardProps {
  item: WatchlistItem;
  onAnalyze: (item: WatchlistItem) => Promise<void>;
  onRemove: (id: string, symbol: string) => Promise<void>;
  isAnalyzing: boolean;
}

export function WatchlistCard({ item, onAnalyze, onRemove, isAnalyzing }: WatchlistCardProps) {
  const navigate = useNavigate();
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Real-time price stream
  const { priceData, isConnected } = useRealtimePriceStream(item.symbol, true);
  
  // Use real-time price or fallback to stored price
  const currentPrice = priceData?.price ?? item.current_price;
  const priceChange = priceData?.change24h;
  const isPositive = priceChange !== undefined ? priceChange > 0 : false;

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(item.id, item.symbol);
    setIsRemoving(false);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-200 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {item.symbol.replace('USDT', '')}
              <span className="text-xs text-muted-foreground font-normal">USDT</span>
              {item.nickname && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.nickname}
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Added {formatDistanceToNow(new Date(item.added_at), { addSuffix: true })}
            </p>
          </div>
          
          {/* Connection indicator */}
          {isConnected && (
            <div className="flex items-center gap-1 text-xs text-chart-green">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-green animate-pulse" />
              Live
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price Display */}
        {currentPrice && (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(currentPrice)}
            </span>
            {priceChange !== undefined && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                isPositive ? 'text-chart-green' : 'text-chart-red'
              }`}>
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(priceChange).toFixed(2)}%
              </div>
            )}
          </div>
        )}
        
        {/* Notes */}
        {item.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.notes}
          </p>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/symbol/${item.symbol}`)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            size="sm"
            onClick={() => onAnalyze(item)}
            disabled={isAnalyzing}
            className="flex-1"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            Analyze
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={isRemoving}
            className="px-3"
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-destructive" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
