import { Search, Calendar, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

export function FilterBar({ symbol, onSymbolChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card/50 border-b border-border/40 backdrop-blur-sm">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search symbol..."
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          className="pl-10 bg-background/50 border-border/60"
        />
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
