# FilterBar Component Documentation

## Overview
The FilterBar component provides comprehensive filtering and data customization options for the Trading Dashboard. It allows users to select trading pairs, set timeframes, define custom date ranges, and apply advanced filters to the trading data.

**Location**: `src/components/trading/FilterBar.tsx`

**Last Updated**: November 19, 2025

## Features

### 1. **Symbol Selector**
- Searchable dropdown with all available trading pairs
- Displays formatted pair names (e.g., "BTC/USDT")
- Shows symbol codes for disambiguation
- Real-time search filtering

### 2. **Auto-Refresh Toggle**
- Checkbox to enable/disable automatic symbol tracking
- Refreshes data every 5 minutes when enabled
- Persists tracking preference in the database

### 3. **Timeframe Selector** ✨ NEW
- Dropdown to select chart timeframe
- Available options:
  - `1h` - 1 Hour
  - `4h` - 4 Hours
  - `1d` - 1 Day (default)
  - `1w` - 1 Week
- Updates all charts and technical indicators
- Visual indicator when changed from default

### 4. **Date Range Picker** ✨ NEW
- Dialog with dual calendar interface
- Select custom "from" and "to" dates
- Validates date selection (to date must be after from date)
- Cannot select future dates
- Shows active date range in button label
- Visual indicator (primary border) when active
- Clear option to reset to default range

### 5. **Advanced Filters** ✨ NEW
- Side sheet with additional filtering options
- **Volume Range Filter**:
  - Minimum volume threshold
  - Maximum volume threshold
  - Filters out candles outside the specified range
- **Signal Display Filter**:
  - Toggle to show only candles with trading signals
  - Useful for focusing on actionable opportunities
- Visual indicator (primary border) when filters are active
- Reset option to clear all filters

## Props Interface

```typescript
interface FilterBarProps {
  // Symbol selection
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  
  // Timeframe selection
  timeframe: "1h" | "4h" | "1d" | "1w";
  onTimeframeChange: (timeframe: "1h" | "4h" | "1d" | "1w") => void;
  
  // Date range selection
  dateRange: { from: Date; to: Date } | null;
  onDateRangeChange: (range: { from: Date; to: Date } | null) => void;
  
  // Advanced filters
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
```

## Usage Example

```tsx
import { FilterBar } from "@/components/trading/FilterBar";
import { useState } from "react";

function TradingDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1d");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [filters, setFilters] = useState({
    minVolume: 0,
    maxVolume: Infinity,
    showOnlySignals: false,
  });

  return (
    <FilterBar 
      symbol={symbol} 
      onSymbolChange={setSymbol}
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      filters={filters}
      onFiltersChange={setFilters}
    />
  );
}
```

## State Management

### Controlled Components
All filter states are **controlled** by the parent component (TradingDashboard):
- Parent maintains the source of truth for all filter states
- FilterBar receives current values as props
- FilterBar calls callback functions to update parent state
- Ensures filter states are synchronized across the entire dashboard

### Temporary State Pattern
For complex inputs (date range, filters), FilterBar uses a temporary state pattern:
1. Opens dialog/sheet with current values
2. User modifies values in temporary state
3. User clicks "Apply" → callbacks update parent state
4. User clicks "Cancel/Close" → temporary state discarded
5. This prevents partial/invalid states from affecting the dashboard

## Visual Indicators

### Active State Highlighting
Buttons show visual feedback when filters are active:
- **Date Range**: Primary border color when a custom range is set
- **Filters**: Primary border color when any filter is non-default
- Button labels update to show current selections

### Responsive Design
- Full labels visible on desktop (sm breakpoint and up)
- Icon-only display on mobile
- Maintains functionality across all screen sizes

## Integration Points

### Data Flow
```
User Interaction → FilterBar (temporary state) → 
Callback functions → TradingDashboard (source of truth) → 
Data hooks (useChartData, etc.) → Updated UI
```

### Affected Components
When filter states change, these components update:
- `DayTraderChartContainer` - Main price chart
- `FundingRateChart` - Funding rate visualization
- `KPICard` components - Calculated metrics
- `SessionStatsPanel` - Session statistics
- AI analysis panels - Market insights

## Technical Details

### Dependencies
- `date-fns` - Date formatting and manipulation
- `lucide-react` - Icons
- Shadcn UI components:
  - `Dialog` - Date range picker
  - `Sheet` - Advanced filters panel
  - `Calendar` - Date selection
  - `Select` - Timeframe dropdown
  - `Popover` - Symbol selector dropdown

### Accessibility
- All interactive elements have proper ARIA labels
- Keyboard navigation supported throughout
- Focus management in dialogs and sheets
- Color contrast meets WCAG standards

### Performance Considerations
- Memoized display name calculation
- Debounced search in symbol selector
- Lazy loading of calendar components
- Minimal re-renders through controlled state pattern

## Future Enhancements

Potential additions for future versions:
- Preset date ranges (Last 7 days, Last 30 days, etc.)
- Price range filters
- Technical indicator thresholds
- Save/load filter presets
- Export filtered data
- Multi-symbol comparison mode

## Changelog

### November 19, 2025
- ✨ Added timeframe selector with 1h/4h/1d/1w options
- ✨ Implemented date range picker with dual calendar interface
- ✨ Added advanced filters sheet with volume and signal filters
- 🎨 Added visual indicators for active filters
- 🐛 Fixed dropdown z-index issues
- 📚 Created comprehensive documentation

### Previous Versions
- Symbol selector with search
- Auto-refresh toggle for tracked symbols
- Basic styling and responsive layout
