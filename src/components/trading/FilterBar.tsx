import { useState, useMemo } from "react";
import { Search, Calendar, SlidersHorizontal, Check, ChevronsUpDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { useTrackedSymbol } from "@/hooks/useTrackedSymbol";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

export function FilterBar({ symbol, onSymbolChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const { pairs, isLoading } = useTradingPairs();
  const { isTracked, isLoading: isTrackingLoading, toggleTracking } = useTrackedSymbol(symbol);

  const displayName = useMemo(() => {
    const pair = pairs.find(p => p.symbol === symbol);
    return pair?.displayName || symbol;
  }, [pairs, symbol]);

  return (
    <div className="flex items-center gap-3 p-4 bg-card/50 border-b border-border/40 backdrop-blur-sm">
      {/* Symbol Selector with Search */}
      <div className="flex-1 max-w-md space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-background/50 border-border/60 hover:bg-background/70"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{displayName}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search trading pairs..." 
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Loading pairs..." : "No trading pair found."}
                </CommandEmpty>
                <CommandGroup>
                  {pairs.map((pair) => (
                    <CommandItem
                      key={pair.symbol}
                      value={pair.symbol}
                      onSelect={(currentValue) => {
                        onSymbolChange(currentValue.toUpperCase());
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          symbol === pair.symbol ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{pair.displayName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {pair.symbol}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {/* Auto-refresh Tracking Checkbox */}
        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="auto-refresh"
            checked={isTracked}
            disabled={isTrackingLoading}
            onCheckedChange={toggleTracking}
            className="data-[state=checked]:bg-primary"
          />
          <Label
            htmlFor="auto-refresh"
            className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Auto-refresh this symbol (5min)
          </Label>
        </div>
      </div>

      {/* Timeframe Selector */}
      <Select defaultValue="1d">
        <SelectTrigger className="w-32 bg-background/50 border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1h">1 Hour</SelectItem>
          <SelectItem value="4h">4 Hours</SelectItem>
          <SelectItem value="1d">1 Day</SelectItem>
          <SelectItem value="1w">1 Week</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Button variant="outline" size="sm" className="gap-2">
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Date Range</span>
      </Button>

      {/* More Filters */}
      <Button variant="outline" size="sm" className="gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
      </Button>
    </div>
  );
}
