import { Button } from '@/components/ui/button';
import { AnnotationConfig } from '@/types/annotations';
import { Calendar, TrendingUp, Newspaper, Award, BarChart3, AreaChart } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChartToolbarProps {
  config: AnnotationConfig;
  onConfigChange: (config: AnnotationConfig) => void;
  chartMode: 'candlestick' | 'area';
  onChartModeChange: (mode: 'candlestick' | 'area') => void;
}

export function ChartToolbar({
  config,
  onConfigChange,
  chartMode,
  onChartModeChange,
}: ChartToolbarProps) {
  const toggleConfig = (key: keyof AnnotationConfig) => {
    onConfigChange({ ...config, [key]: !config[key] });
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-card/50 border-b border-border">
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={chartMode === 'candlestick' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChartModeChange('candlestick')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Candlestick Chart</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={chartMode === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChartModeChange('area')}
              >
                <AreaChart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Area Chart</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-6 w-px bg-border mx-2" />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={config.showEvents ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleConfig('showEvents')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Events</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={config.showSignals ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleConfig('showSignals')}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Signals</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={config.showNews ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleConfig('showNews')}
              >
                <Newspaper className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle News</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={config.showMilestones ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleConfig('showMilestones')}
              >
                <Award className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Milestones</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
