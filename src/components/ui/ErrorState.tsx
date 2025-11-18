import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <Card className="p-6 border-destructive/30 bg-destructive/5">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <p className="text-sm text-destructive font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          size="sm"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Retry
        </Button>
      )}
    </Card>
  );
};
