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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useTradingPairs } from "@/hooks/useTradingPairs";
import { useTrackedSymbol } from "@/hooks/useTrackedSymbol";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface FilterBarProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  timeframe: "15m" | "1h" | "4h" | "1d" | "1w";
  onTimeframeChange: (timeframe: "15m" | "1h" | "4h" | "1d" | "1w") => void;
  dateRange: { from: Date; to: Date } | null;
  onDateRangeChange: (range: { from: Date; to: Date } | null) => void;
  filters: {
    minVolume: number;
    maxVolume: number;
    showOnlySignals: boolean;
  };
  onFiltersChange: (filters: {
    minVolume: number;
    maxVolume: number;
    showOnlySignals: boolean;
  }) => void;
}

export function FilterBar({ 
  symbol, 
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  dateRange,
  onDateRangeChange,
  filters,
  onFiltersChange
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { pairs, isLoading } = useTradingPairs();
  const { isTracked, isLoading: isTrackingLoading, toggleTracking } = useTrackedSymbol(symbol);

  const displayName = useMemo(() => {
    const pair = pairs.find(p => p.symbol === symbol);
    return pair?.displayName || symbol;
  }, [pairs, symbol]);

  // Date range state for the dialog
  const [tempDateRange, setTempDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  const handleApplyDateRange = () => {
    if (tempDateRange.from && tempDateRange.to) {
      onDateRangeChange({
        from: tempDateRange.from,
        to: tempDateRange.to,
      });
      setDateDialogOpen(false);
    }
  };

  const handleClearDateRange = () => {
    setTempDateRange({ from: undefined, to: undefined });
    onDateRangeChange(null);
    setDateDialogOpen(false);
  };

  // Temporary filters state for the sheet
  const [tempFilters, setTempFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setFiltersOpen(false);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      minVolume: 0,
      maxVolume: Infinity,
      showOnlySignals: false,
    };
    setTempFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    setFiltersOpen(false);
  };

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
          <PopoverContent className="w-[400px] p-0 bg-popover z-50" align="start">
            <Command className="bg-popover">
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
      <Select value={timeframe} onValueChange={onTimeframeChange}>
        <SelectTrigger className="w-32 bg-background/50 border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="15m">15 Min</SelectItem>
          <SelectItem value="1h">1 Hour</SelectItem>
          <SelectItem value="4h">4 Hours</SelectItem>
          <SelectItem value="1d">1 Day</SelectItem>
          <SelectItem value="1w">1 Week</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range Dialog */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-2",
              dateRange && "border-primary text-primary"
            )}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">
              {dateRange 
                ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                : "Date Range"
              }
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] bg-card">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>
              Choose a custom date range to filter the trading data
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={tempDateRange.from}
                  onSelect={(date) => setTempDateRange(prev => ({ ...prev, from: date }))}
                  className="rounded-md border bg-background pointer-events-auto"
                  disabled={(date) => date > new Date()}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={tempDateRange.to}
                  onSelect={(date) => setTempDateRange(prev => ({ ...prev, to: date }))}
                  className="rounded-md border bg-background pointer-events-auto"
                  disabled={(date) => 
                    date > new Date() || 
                    (tempDateRange.from ? date < tempDateRange.from : false)
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClearDateRange}>
                Clear
              </Button>
              <Button 
                onClick={handleApplyDateRange}
                disabled={!tempDateRange.from || !tempDateRange.to}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-2",
              (filters.minVolume > 0 || filters.maxVolume < Infinity || filters.showOnlySignals) 
                && "border-primary text-primary"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-card w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
            <SheetDescription>
              Customize your trading data view with additional filters
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-6">
            {/* Volume Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Volume Range</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="minVolume">Minimum Volume</Label>
                  <Input
                    id="minVolume"
                    type="number"
                    value={tempFilters.minVolume}
                    onChange={(e) => setTempFilters(prev => ({
                      ...prev,
                      minVolume: Number(e.target.value) || 0
                    }))}
                    placeholder="0"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxVolume">Maximum Volume</Label>
                  <Input
                    id="maxVolume"
                    type="number"
                    value={tempFilters.maxVolume === Infinity ? "" : tempFilters.maxVolume}
                    onChange={(e) => setTempFilters(prev => ({
                      ...prev,
                      maxVolume: e.target.value ? Number(e.target.value) : Infinity
                    }))}
                    placeholder="No limit"
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Signal Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Signal Options</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOnlySignals"
                  checked={tempFilters.showOnlySignals}
                  onCheckedChange={(checked) => 
                    setTempFilters(prev => ({ ...prev, showOnlySignals: !!checked }))
                  }
                />
                <Label htmlFor="showOnlySignals" className="cursor-pointer">
                  Show only candles with trading signals
                </Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
                className="flex-1"
              >
                Reset All
              </Button>
              <Button 
                onClick={handleApplyFilters}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
