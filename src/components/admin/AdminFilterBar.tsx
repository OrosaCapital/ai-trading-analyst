import { Search, RefreshCw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminFilterBar() {
  return (
    <div className="flex items-center gap-3 p-4 bg-card/50 border-b border-border/40 backdrop-blur-sm">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search systems, logs, metrics..."
          className="pl-10 bg-background/50 border-border/60"
        />
      </div>

      {/* Time Range Selector */}
      <Select defaultValue="1h">
        <SelectTrigger className="w-32 bg-background/50 border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="15m">15 Minutes</SelectItem>
          <SelectItem value="1h">1 Hour</SelectItem>
          <SelectItem value="24h">24 Hours</SelectItem>
          <SelectItem value="7d">7 Days</SelectItem>
        </SelectContent>
      </Select>

      {/* Refresh */}
      <Button variant="outline" size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>

      {/* Filters */}
      <Button variant="outline" size="sm" className="gap-2">
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
      </Button>
    </div>
  );
}
