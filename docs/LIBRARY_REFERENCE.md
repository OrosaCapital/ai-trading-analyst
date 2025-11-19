# Library API Reference & Version Control

This document serves as the **authoritative reference** for library versions and correct API patterns used in this project. **Always consult this document before writing code that uses these libraries.**

---

## 📑 Table of Contents

### High Priority (Version-Sensitive)
1. [lightweight-charts v5.0.9](#-lightweight-charts-v509)
2. [TanStack Query v5.83.0](#-tanstack-query-v5830)
3. [React Router v6.30.1](#-react-router-v6301)
4. [React Hook Form v7.61.1](#-react-hook-form-v7611)
5. [Recharts v2.15.4](#-recharts-v2154)

### Core Framework
6. [React 18.3.1](#-react-1831)

### UI Components
7. [Radix UI v1.x](#-radix-ui-v1x)
8. [Lucide React v0.462.0](#-lucide-react-v04620)
9. [Sonner v1.7.4](#-sonner-v174)

### Styling & Design
10. [Tailwind CSS v3.4.17](#-tailwind-css-v3417)
11. [class-variance-authority v0.7.1](#-class-variance-authority-v071)
12. [cn() Utility](#-cn-utility-pattern)

### Validation & Forms
13. [Zod v3.25.76](#-zod-v32576)

### Utilities
14. [date-fns v3.6.0](#-date-fns-v360)

### Backend Integration
15. [Supabase JS v2.81.1](#-supabase-js-v2811)
16. [CoinGlass API](#-coinglass-api-integration)

---

## 🚀 Quick Reference

| Library | Version | Critical API Changes | Reference File |
|---------|---------|---------------------|----------------|
| lightweight-charts | ^5.0.9 | Use `chart.addSeries(SeriesType, options)` | `OcapxChart.tsx` |
| TanStack Query | ^5.83.0 | Object syntax: `useQuery({ queryKey, queryFn })` | `useAITradingData.ts` |
| React Router | ^6.30.1 | Use `useNavigate()` not `useHistory()` | `App.tsx` |
| React Hook Form | ^7.61.1 | Controller component for controlled inputs | Forms in components |
| Recharts | ^2.15.4 | Composed component pattern | Check usage |
| Lucide React | ^0.462.0 | Direct icon imports | Throughout |
| Radix UI | ^1.x | Compound component pattern | UI components |
| Tailwind | ^3.4.17 | Use HSL semantic tokens | `index.css` |
| Supabase | ^2.81.1 | Client from `@/integrations/supabase/client` | Throughout |
| CoinGlass API | v4 | See COINGLASS_API.md | Edge Functions |

---

## 🎯 OCAPX Custom Dashboard Architecture

**CRITICAL:** All charts, indicators, and analysis tools in OCAPX are **custom-built** in-house. We do NOT use TradingView, Pine Script, or any third-party charting platforms.

### Custom Components Built with lightweight-charts

All chart visualizations are developed internally using the lightweight-charts library:

- **OcapxChart.tsx**: Main custom trading chart with volume bubbles and sentiment indicators
- **ProfessionalTradingChart.tsx**: Advanced chart with multiple timeframes and AI signals
- **SimplifiedChart.tsx**: Clean, minimal chart for quick analysis
- **StaticTradingChart.tsx**: Static historical chart with annotations
- **FundingRateChart.tsx**: Custom funding rate visualization
- **LiquidationHeatmap.tsx**: Custom liquidation level heatmap
- **OpenInterestBreakdown.tsx**: Custom open interest distribution

### External Data Integration

The dashboard integrates real-time external data:

- **CoinGlass API**: Funding rates, exchange pairs, market coverage, and derivatives data
- **WebSocket Price Stream**: Real-time price updates via Tatum WebSocket
- **Custom Edge Functions**: Data processing, caching, and formatting

**API Documentation:** See [COINGLASS_API.md](COINGLASS_API.md) for complete CoinGlass integration reference.

### Smart Decision-Making Features

- **AI-Powered Analysis**: Custom analysis engine using Lovable AI for market insights
- **Signal Generation**: Custom signal engine analyzing technical indicators and sentiment
- **Real-time Monitoring**: Live price updates and market metric tracking
- **Dashboard Metrics**: Comprehensive market overview with custom visualizations

**Key Principle:** Everything displayed to users is processed through our custom dashboard logic and rendered using our own components. We control the entire data flow from external APIs to visual presentation.

---

## 📊 lightweight-charts v5.0.9

**Package:** `lightweight-charts: ^5.0.9`  
**Official Docs:** https://lightweight-charts.js.org/  
**Important:** This is a standalone open-source charting library, NOT TradingView. All charts and indicators in OCAPX are custom-built using this library.

### ✅ Correct v5 API Patterns

#### Import Pattern
```typescript
// ✅ CORRECT (v5) - Import series types as classes
import { 
  createChart, 
  IChartApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType 
} from 'lightweight-charts';
```

```typescript
// ❌ WRONG (v4) - Missing series type classes
import { createChart, IChartApi } from 'lightweight-charts';
```

#### Adding Candlestick Series
```typescript
// ✅ CORRECT (v5) - Pass series type as first argument
const candleSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#10b981',
  downColor: '#ef4444',
  borderUpColor: '#10b981',
  borderDownColor: '#ef4444',
  wickUpColor: '#10b981',
  wickDownColor: '#ef4444',
});
```

```typescript
// ❌ WRONG (v4) - Method doesn't exist in v5
const candleSeries = chart.addCandlestickSeries({...});
```

#### Adding Line Series
```typescript
// ✅ CORRECT (v5)
const lineSeries = chart.addSeries(LineSeries, {
  color: '#2563eb',
  lineWidth: 2,
});
```

```typescript
// ❌ WRONG (v4)
const lineSeries = chart.addLineSeries({...});
```

#### Adding Histogram Series (Volume)
```typescript
// ✅ CORRECT (v5)
const volumeSeries = chart.addSeries(HistogramSeries, {
  color: '#26a69a',
  priceFormat: { type: 'volume' },
  priceScaleId: '',
});
```

```typescript
// ❌ WRONG (v4)
const volumeSeries = chart.addHistogramSeries({...});
```

#### Setting Markers
```typescript
// ✅ CORRECT (v5) - Must use createSeriesMarkers function
import { createSeriesMarkers } from 'lightweight-charts';

// Create markers primitive
const seriesMarkers = createSeriesMarkers(candleSeries, [
  {
    time: 1234567890,
    position: 'belowBar',
    color: '#10b981',
    shape: 'arrowUp',
    text: 'Buy'
  }
]);

// Update markers later
seriesMarkers.setMarkers([/* new markers */]);

// Clear markers
seriesMarkers.setMarkers([]);
```

```typescript
// ❌ WRONG (v4) - series.setMarkers() doesn't exist in v5
candleSeries.setMarkers([...]); // This will fail!
```

#### TypeScript Refs
```typescript
// ✅ CORRECT - Properly typed refs
import { IChartApi, ISeriesApi } from 'lightweight-charts';

const chartRef = useRef<IChartApi | null>(null);
const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
```

```typescript
// ⚠️ ACCEPTABLE but not ideal - Use when types are complex
const candleSeriesRef = useRef<any>(null);
```

### 🔍 Key Changes from v4 to v5
1. **Series creation:** Use `chart.addSeries(SeriesType, options)` instead of `chart.addSeriesType(options)`
2. **Import series types:** Must import series classes (`CandlestickSeries`, `LineSeries`, etc.)
3. **Markers API changed:** Must use `createSeriesMarkers()` function instead of `series.setMarkers()`
4. **Data methods unchanged:** `setData()`, `update()`, etc. work the same

### 📝 Working Reference Implementation
See `src/components/OcapxChart.tsx`:
- **Line 4:** Correct imports with series types
- **Lines 202-210:** Correct v5 series creation pattern

---

## 🔄 TanStack Query v5.83.0

**Package:** `@tanstack/react-query: ^5.83.0`  
**Official Docs:** https://tanstack.com/query/latest

### ✅ Correct v5 API Patterns

#### useQuery Hook
```typescript
// ✅ CORRECT (v5) - Object syntax
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['trading-data', symbol],
  queryFn: async () => {
    const response = await fetch(`/api/trading-data/${symbol}`);
    return response.json();
  },
  staleTime: 5000,
  enabled: !!symbol,
  retry: 2,
});
```

```typescript
// ❌ WRONG (v4) - Separate arguments
const { data } = useQuery(['trading-data', symbol], fetchData);
```

#### useMutation Hook
```typescript
// ✅ CORRECT (v5)
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (newData) => {
    const response = await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify(newData),
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['trading-data'] });
  },
  onError: (error) => {
    console.error('Mutation failed:', error);
  },
});

// Usage
mutation.mutate({ symbol: 'BTCUSDT' });
```

#### QueryClient Setup
```typescript
// ✅ CORRECT - In App.tsx or main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrap app
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### 🔍 Key Changes from v4 to v5
1. **Object syntax required** for all hooks - no more separate arguments
2. **queryKey must be inside object** - `{ queryKey: [...] }`
3. **Callbacks renamed** - `onSuccess`, `onError` in mutation options
4. **No more isLoading** - Use `isPending` for initial load state (though `isLoading` still works for backward compatibility)

### 📝 Working Reference Implementation
See `src/hooks/useAITradingData.ts` for correct v5 usage patterns.

---

## 🧭 React Router v6.30.1

**Package:** `react-router-dom: ^6.30.1`  
**Official Docs:** https://reactrouter.com/

### ✅ Correct v6 API Patterns

#### Router Setup
```typescript
// ✅ CORRECT (v6) - Uses Routes and Route
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

```typescript
// ❌ WRONG (v5) - Switch doesn't exist in v6
import { BrowserRouter, Switch, Route } from 'react-router-dom';

<Switch>
  <Route path="/" component={Home} />
</Switch>
```

#### Navigation
```typescript
// ✅ CORRECT (v6) - useNavigate hook
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/trading');
    // Or with state
    navigate('/trading', { state: { from: 'home' } });
    // Or go back
    navigate(-1);
  };
  
  return <button onClick={handleClick}>Go to Trading</button>;
}
```

```typescript
// ❌ WRONG (v5) - useHistory doesn't exist in v6
import { useHistory } from 'react-router-dom';

const history = useHistory();
history.push('/trading');
```

#### URL Parameters
```typescript
// ✅ CORRECT (v6) - useParams hook
import { useParams } from 'react-router-dom';

function UserProfile() {
  const { id } = useParams();
  
  return <div>User ID: {id}</div>;
}
```

#### Query Parameters
```typescript
// ✅ CORRECT (v6) - useSearchParams hook
import { useSearchParams } from 'react-router-dom';

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const query = searchParams.get('q');
  
  const updateQuery = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };
  
  return <div>Search: {query}</div>;
}
```

#### Link Component
```typescript
// ✅ CORRECT (v6) - Uses 'to' prop
import { Link } from 'react-router-dom';

<Link to="/trading">Go to Trading</Link>
<Link to="/trading" state={{ from: 'home' }}>With State</Link>
```

### 🔍 Key Changes from v5 to v6
1. **Routes instead of Switch** - `<Routes>` replaces `<Switch>`
2. **element prop instead of component** - `element={<Component />}` not `component={Component}`
3. **useNavigate instead of useHistory** - New navigation API
4. **Nested routes** - Can be declared anywhere in component tree
5. **No more exact prop** - Routes match exactly by default

### 📝 Working Reference Implementation
See `src/App.tsx` (lines 16-22) for correct v6 router setup.

---

## 📝 React Hook Form v7.61.1

**Package:** `react-hook-form: ^7.61.1`  
**Official Docs:** https://react-hook-form.com/

### ✅ Correct v7 API Patterns

#### Basic Form Setup
```typescript
// ✅ CORRECT (v7) - With TypeScript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof formSchema>;

function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = (data: FormData) => {
    console.log(data);
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
      
      <input {...form.register('password')} type="password" />
      {form.formState.errors.password && (
        <span>{form.formState.errors.password.message}</span>
      )}
      
      <button type="submit" disabled={form.formState.isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

#### With Form Component (shadcn/ui pattern)
```typescript
// ✅ CORRECT - Using Form components from shadcn/ui
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll never share your email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}
```

#### Controller for Custom Components
```typescript
// ✅ CORRECT - Using Controller for custom components
import { Controller, useForm } from 'react-hook-form';
import { Select } from '@/components/ui/select';

function FormWithSelect() {
  const { control, handleSubmit } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="currency"
        control={control}
        render={({ field }) => (
          <Select {...field}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </Select>
        )}
      />
    </form>
  );
}
```

### 🔍 Key Patterns
1. **register()** - For simple native inputs
2. **Controller** - For custom/controlled components
3. **zodResolver** - For schema validation with Zod
4. **formState** - Access errors, isSubmitting, isDirty, etc.

### 📝 Working Reference Implementation
See `src/components/ui/form.tsx` for Form component patterns.

---

## 📊 Recharts v2.15.4

**Package:** `recharts: ^2.15.4`  
**Official Docs:** https://recharts.org/

### ✅ Correct v2 API Patterns

#### Line Chart
```typescript
// ✅ CORRECT (v2) - Composed component pattern
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
];

function MyLineChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### Area Chart with Multiple Series
```typescript
// ✅ CORRECT - Multiple data series
import { AreaChart, Area } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="time" />
    <YAxis />
    <Tooltip />
    <Area 
      type="monotone" 
      dataKey="buy" 
      stackId="1"
      stroke="hsl(var(--chart-green))" 
      fill="hsl(var(--chart-green))" 
      fillOpacity={0.6}
    />
    <Area 
      type="monotone" 
      dataKey="sell" 
      stackId="1"
      stroke="hsl(var(--chart-red))" 
      fill="hsl(var(--chart-red))" 
      fillOpacity={0.6}
    />
  </AreaChart>
</ResponsiveContainer>
```

#### Bar Chart
```typescript
// ✅ CORRECT - Bar chart pattern
import { BarChart, Bar } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="value" fill="hsl(var(--primary))" />
  </BarChart>
</ResponsiveContainer>
```

#### Custom Tooltip
```typescript
// ✅ CORRECT - Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {`${payload[0].name}: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

<LineChart data={data}>
  <Tooltip content={<CustomTooltip />} />
</LineChart>
```

### 🔍 Key Patterns
1. **ResponsiveContainer** - Always wrap charts for responsive sizing
2. **Composed components** - Build charts by composing smaller components
3. **dataKey** - Specify which data field to use for each axis/series
4. **Use semantic colors** - `hsl(var(--primary))` not `#ff0000`

### 📝 Working Reference Implementation
Search for Recharts usage in dashboard components.

---

## ⚛️ React 18.3.1

**Package:** `react: ^18.3.1`  
**Official Docs:** https://react.dev/

### ✅ Correct React 18 Patterns

#### Component Definition
```typescript
// ✅ CORRECT - Functional component with TypeScript
interface MyComponentProps {
  title: string;
  count?: number;
  onUpdate?: (value: number) => void;
}

function MyComponent({ title, count = 0, onUpdate }: MyComponentProps) {
  const [value, setValue] = useState(count);
  
  useEffect(() => {
    console.log('Component mounted');
    
    return () => {
      console.log('Component will unmount');
    };
  }, []);
  
  return <div>{title}: {value}</div>;
}

export default MyComponent;
```

#### useState Hook
```typescript
// ✅ CORRECT - With TypeScript types
import { useState } from 'react';

// Simple state
const [count, setCount] = useState<number>(0);

// Object state
interface User {
  name: string;
  email: string;
}
const [user, setUser] = useState<User | null>(null);

// Array state
const [items, setItems] = useState<string[]>([]);
```

#### useEffect Hook
```typescript
// ✅ CORRECT - Proper cleanup and dependencies
import { useEffect } from 'react';

// Run once on mount
useEffect(() => {
  console.log('Component mounted');
  
  return () => {
    console.log('Cleanup on unmount');
  };
}, []); // Empty deps = run once

// Run when dependencies change
useEffect(() => {
  if (userId) {
    fetchUserData(userId);
  }
}, [userId]); // Re-run when userId changes

// With cleanup for subscriptions
useEffect(() => {
  const subscription = dataStream.subscribe(handleData);
  
  return () => {
    subscription.unsubscribe();
  };
}, [dataStream]);
```

#### useRef Hook
```typescript
// ✅ CORRECT - Proper ref typing
import { useRef, useEffect } from 'react';

// DOM element ref
const divRef = useRef<HTMLDivElement>(null);

// Mutable value ref
const countRef = useRef<number>(0);

// Chart API ref
const chartRef = useRef<IChartApi | null>(null);

useEffect(() => {
  if (divRef.current) {
    // Access DOM element
    divRef.current.scrollIntoView();
  }
}, []);
```

#### useMemo and useCallback
```typescript
// ✅ CORRECT - Memoization patterns
import { useMemo, useCallback } from 'react';

// Expensive calculation
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Callback that doesn't change
const handleClick = useCallback((id: string) => {
  console.log('Clicked:', id);
  doSomething(id);
}, [doSomething]);
```

### 🔍 React 18 Key Features
1. **Concurrent features** - Automatic batching, transitions
2. **StrictMode** - Causes double-mount in dev (expected behavior)
3. **useEffect cleanup** - Always include cleanup for side effects
4. **No class components** - Use functional components with hooks

### ❌ Common Mistakes
```typescript
// ❌ WRONG - Conditional hooks
if (condition) {
  useState(0); // Never do this!
}

// ❌ WRONG - Missing dependencies
useEffect(() => {
  doSomething(value);
}, []); // Should include [value]

// ❌ WRONG - Not cleaning up
useEffect(() => {
  const interval = setInterval(tick, 1000);
  // Missing return cleanup!
}, []);
```

---

## 🎨 Radix UI v1.x

**Package:** Multiple `@radix-ui/react-*` packages  
**Official Docs:** https://www.radix-ui.com/primitives

### ✅ Correct Radix UI Patterns

#### Dialog Component
```typescript
// ✅ CORRECT - Composed component pattern
import * as Dialog from '@radix-ui/react-dialog';

function MyDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button>Open Dialog</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg">
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>
            Dialog description text
          </Dialog.Description>
          <Dialog.Close asChild>
            <button>Close</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

#### Select Component
```typescript
// ✅ CORRECT - Select pattern
import * as Select from '@radix-ui/react-select';

<Select.Root value={value} onValueChange={setValue}>
  <Select.Trigger className="inline-flex items-center">
    <Select.Value placeholder="Select an option" />
    <Select.Icon />
  </Select.Trigger>
  
  <Select.Portal>
    <Select.Content className="bg-background border rounded-lg shadow-lg">
      <Select.Viewport className="p-1">
        <Select.Item value="option1" className="px-2 py-1">
          <Select.ItemText>Option 1</Select.ItemText>
        </Select.Item>
        <Select.Item value="option2" className="px-2 py-1">
          <Select.ItemText>Option 2</Select.ItemText>
        </Select.Item>
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

#### Popover Component
```typescript
// ✅ CORRECT - Popover pattern
import * as Popover from '@radix-ui/react-popover';

<Popover.Root>
  <Popover.Trigger asChild>
    <button>Open Popover</button>
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content className="bg-background border p-4 rounded-lg shadow-lg">
      <Popover.Arrow className="fill-background" />
      Content goes here
      <Popover.Close />
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

### 🔍 Key Patterns
1. **Compound components** - Use Root, Trigger, Content pattern
2. **asChild prop** - Merge props with child element
3. **Portal** - Render content outside DOM hierarchy
4. **Unstyled** - Radix provides behavior, you add styles

### 📝 Working Reference Implementation
See `src/components/ui/*` for wrapped Radix components (shadcn/ui pattern).

---

## 🎨 Lucide React v0.462.0

**Package:** `lucide-react: ^0.462.0`  
**Official Docs:** https://lucide.dev/

### ✅ Correct Lucide Icon Patterns

#### Basic Icon Usage
```typescript
// ✅ CORRECT - Direct icon imports
import { Home, User, Settings, ChevronRight } from 'lucide-react';

function MyComponent() {
  return (
    <div>
      <Home className="w-6 h-6" />
      <User className="w-6 h-6 text-primary" />
      <Settings size={24} color="hsl(var(--primary))" />
      <ChevronRight className="w-4 h-4" strokeWidth={3} />
    </div>
  );
}
```

#### Icon Props
```typescript
// ✅ CORRECT - Available props
import { Star } from 'lucide-react';

<Star 
  size={24}                              // Number (default: 24)
  color="hsl(var(--primary))"           // String (default: currentColor)
  strokeWidth={2}                        // Number (default: 2)
  absoluteStrokeWidth={false}            // Boolean (default: false)
  className="text-yellow-500"            // String
/>
```

#### Dynamic Icon Loading
```typescript
// ✅ CORRECT - Dynamic icon component
import { icons } from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: keyof typeof icons;
}

function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const LucideIcon = icons[name];
  return <LucideIcon {...props} />;
}

// Usage
<DynamicIcon name="Home" size={24} />
```

### ❌ Common Mistakes
```typescript
// ❌ WRONG - Don't import all icons
import * as Icons from 'lucide-react'; // Imports everything!

// ❌ WRONG - Don't use string-based selection
import { Icon } from 'lucide-react';
<Icon name="home" /> // Doesn't work this way

// ❌ WRONG - Don't import from wrong path
import { Home } from 'lucide'; // Should be 'lucide-react'
```

### 🔍 Key Patterns
1. **Tree-shakeable** - Only imported icons are bundled
2. **Direct imports** - Import specific icons you need
3. **Customizable** - Use size, color, strokeWidth props
4. **CSS styling** - Use className for Tailwind styling

---

## 🔔 Sonner v1.7.4

**Package:** `sonner: ^1.7.4`  
**Official Docs:** https://sonner.emilkowal.ski/

### ✅ Correct Sonner Patterns

#### Setup
```typescript
// ✅ CORRECT - Add Toaster to app root
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      <YourAppContent />
      <Toaster />
    </>
  );
}
```

#### Basic Toast Usage
```typescript
// ✅ CORRECT - Import and use toast
import { toast } from 'sonner';

function MyComponent() {
  const handleClick = () => {
    // Basic toast
    toast('Event has been created');
    
    // Success toast
    toast.success('Profile updated successfully');
    
    // Error toast
    toast.error('Failed to save changes');
    
    // Warning toast
    toast.warning('This action cannot be undone');
    
    // Info toast
    toast.info('New features available');
  };
  
  return <button onClick={handleClick}>Show Toast</button>;
}
```

#### Toast with Description
```typescript
// ✅ CORRECT - Toast with additional info
toast('Event Created', {
  description: 'Your event has been scheduled for tomorrow',
  duration: 5000,
});
```

#### Toast with Action
```typescript
// ✅ CORRECT - Interactive toast
toast('Event Created', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
});
```

#### Promise Toast
```typescript
// ✅ CORRECT - Show loading/success/error states
toast.promise(
  fetch('/api/save'),
  {
    loading: 'Saving...',
    success: 'Saved successfully',
    error: 'Failed to save',
  }
);
```

### 🔍 Key Patterns
1. **Simple API** - Just call `toast()` with a message
2. **Type variants** - success, error, warning, info
3. **Automatic dismiss** - Toasts auto-dismiss after duration
4. **Promise handling** - Built-in loading states

### 📝 Working Reference Implementation
See `src/components/ui/sonner.tsx` for Toaster setup.

---

## 🎨 Tailwind CSS v3.4.17

**Package:** `tailwindcss: ^3.4.17`  
**Official Docs:** https://tailwindcss.com/

### ✅ Correct Tailwind Patterns

#### Using Semantic Tokens
```typescript
// ✅ CORRECT - Use CSS variables from index.css
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <button className="bg-primary text-primary-foreground">
    Click Me
  </button>
</div>

// ✅ CORRECT - In custom CSS
.my-component {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}
```

```typescript
// ❌ WRONG - Direct color values
<div className="bg-white text-black"> // Never use direct colors!
<div className="bg-blue-500"> // Don't use Tailwind color scale directly!
<div style={{ color: '#ff0000' }}> // Never inline colors!
```

#### Responsive Design
```typescript
// ✅ CORRECT - Mobile-first responsive classes
<div className="w-full md:w-1/2 lg:w-1/3">
  <div className="p-4 md:p-6 lg:p-8">
    <h2 className="text-xl md:text-2xl lg:text-3xl">
      Responsive Title
    </h2>
  </div>
</div>
```

#### Dark Mode
```typescript
// ✅ CORRECT - Dark mode variants
<div className="bg-background dark:bg-background">
  <p className="text-foreground dark:text-foreground">
    Automatically themed text
  </p>
</div>

// Note: When using semantic tokens, dark mode is handled automatically
// by CSS variables in index.css
```

#### Common Utility Patterns
```typescript
// ✅ CORRECT - Flexbox
<div className="flex items-center justify-between gap-4">

// ✅ CORRECT - Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// ✅ CORRECT - Positioning
<div className="relative">
  <div className="absolute top-0 right-0">

// ✅ CORRECT - Spacing
<div className="p-4 m-2 space-y-4">
```

### 🔍 Critical Rules
1. **ALWAYS use semantic tokens** - Never direct colors
2. **All colors must be HSL** - `hsl(var(--variable-name))`
3. **Mobile-first** - Start with mobile, add md:, lg: breakpoints
4. **Use CSS variables** - Define in `index.css`, use via Tailwind

### 📝 Working Reference Implementation
See `src/index.css` for semantic token definitions.  
See `tailwind.config.ts` for theme configuration.

---

## 🎭 class-variance-authority v0.7.1

**Package:** `class-variance-authority: ^0.7.1`  
**Official Docs:** https://cva.style/docs

### ✅ Correct CVA Patterns

#### Basic Button Variants
```typescript
// ✅ CORRECT - Define component variants
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Extract type for props
type ButtonProps = VariantProps<typeof buttonVariants>;

// Use in component
function Button({ variant, size, className, ...props }: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
```

#### Compound Variants
```typescript
// ✅ CORRECT - Compound variants for specific combinations
const cardVariants = cva("rounded-lg border", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground",
      elevated: "bg-card text-card-foreground shadow-lg",
    },
    size: {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  compoundVariants: [
    {
      variant: "elevated",
      size: "lg",
      className: "shadow-xl",
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});
```

### 🔍 Key Patterns
1. **Base styles** - First argument is always applied
2. **Variants** - Define different style options
3. **defaultVariants** - Set default variant values
4. **compoundVariants** - Special styles for variant combinations
5. **Type safety** - Use `VariantProps<typeof variants>` for TypeScript

### 📝 Working Reference Implementation
See `src/components/ui/button.tsx` for complete button variants example.

---

## 🔧 cn() Utility Pattern

**Packages:** `clsx: ^2.1.1` + `tailwind-merge: ^2.6.0`

### ✅ Correct cn() Usage

#### Utility Definition
```typescript
// ✅ CORRECT - Define in lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### Basic Usage
```typescript
// ✅ CORRECT - Merge classes intelligently
import { cn } from '@/lib/utils';

// Conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)}>

// Override classes
<Button 
  className={cn(
    "bg-primary",  // Default
    variant === "secondary" && "bg-secondary"  // Override
  )}
/>
```

#### In Component Props
```typescript
// ✅ CORRECT - Accept and merge className prop
interface CardProps {
  className?: string;
  children: React.ReactNode;
}

function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      {children}
    </div>
  );
}

// Usage - additional classes merge correctly
<Card className="shadow-lg max-w-md" />
```

#### Complex Merging
```typescript
// ✅ CORRECT - Merge with CVA
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

const variants = cva("base", {
  variants: { size: { sm: "text-sm", lg: "text-lg" } }
});

<div className={cn(
  variants({ size: "sm" }),
  "additional-class",
  condition && "conditional-class",
  className
)} />
```

### 🔍 Why cn()?
1. **Intelligent merging** - Later Tailwind classes override earlier ones
2. **Conditional classes** - Handles falsy values gracefully
3. **Array support** - Can pass arrays of classes
4. **Type-safe** - Full TypeScript support

### ❌ Don't Do This
```typescript
// ❌ WRONG - Manual class concatenation
className={`base ${isActive ? 'active' : ''} ${className}`}

// ❌ WRONG - Using clsx without tailwind-merge
import clsx from 'clsx';
className={clsx("p-4", "p-6")} // Both classes apply! Use cn() instead
```

---

## ✅ Zod v3.25.76

**Package:** `zod: ^3.25.76`  
**Official Docs:** https://zod.dev/

### ✅ Correct Zod Patterns

#### Basic Schema Definition
```typescript
// ✅ CORRECT - Define schema with validations
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.number().min(18, "Must be 18 or older").optional(),
  role: z.enum(["user", "admin"]),
});

// Infer TypeScript type from schema
type User = z.infer<typeof userSchema>;

// Validate data
const result = userSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // Typed as User
} else {
  console.error(result.error.errors);
}
```

#### Form Schema with React Hook Form
```typescript
// ✅ CORRECT - Zod with React Hook Form
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // form is now fully typed and validated
}
```

#### Complex Schema Patterns
```typescript
// ✅ CORRECT - Nested objects and arrays
const orderSchema = z.object({
  id: z.string().uuid(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    })
  ).min(1, "Order must contain at least one item"),
  total: z.number().positive(),
  status: z.enum(["pending", "processing", "completed", "cancelled"]),
  createdAt: z.date(),
});

type Order = z.infer<typeof orderSchema>;
```

#### Custom Validations
```typescript
// ✅ CORRECT - Custom validation logic
const profileSchema = z.object({
  bio: z.string()
    .min(10, "Bio must be at least 10 characters")
    .max(500, "Bio must not exceed 500 characters"),
  website: z.string().url("Must be a valid URL").or(z.literal("")),
  age: z.number().refine((age) => age >= 18 && age <= 120, {
    message: "Age must be between 18 and 120",
  }),
});
```

### 🔍 Key Patterns
1. **Type inference** - Use `z.infer<typeof schema>` for TypeScript types
2. **safeParse** - Returns result object with success flag
3. **Custom messages** - Add validation error messages
4. **refinements** - Use `.refine()` for custom validation logic
5. **Transforms** - Use `.transform()` to modify validated data

---

## 📅 date-fns v3.6.0

**Package:** `date-fns: ^3.6.0`  
**Official Docs:** https://date-fns.org/

### ✅ Correct date-fns Patterns

#### Basic Date Formatting
```typescript
// ✅ CORRECT - Import specific functions
import { format, formatDistance, formatRelative } from 'date-fns';

// Format date
const formatted = format(new Date(), 'yyyy-MM-dd');
// "2024-11-17"

const fullDate = format(new Date(), 'MMMM do, yyyy');
// "November 17th, 2024"

// Relative time
const relative = formatDistance(new Date(2024, 0, 1), new Date(), {
  addSuffix: true,
});
// "10 months ago"

// Relative formatting
const relativeFormat = formatRelative(new Date(2024, 11, 15), new Date());
// "last Friday at 12:00 AM"
```

#### Date Manipulation
```typescript
// ✅ CORRECT - Date arithmetic
import { addDays, subDays, addHours, startOfDay, endOfDay } from 'date-fns';

const tomorrow = addDays(new Date(), 1);
const yesterday = subDays(new Date(), 1);
const inThreeHours = addHours(new Date(), 3);

const dayStart = startOfDay(new Date());
const dayEnd = endOfDay(new Date());
```

#### Date Comparison
```typescript
// ✅ CORRECT - Compare dates
import { isBefore, isAfter, isEqual, isSameDay, isWithinInterval } from 'date-fns';

const date1 = new Date(2024, 0, 1);
const date2 = new Date(2024, 11, 31);

isBefore(date1, date2); // true
isAfter(date1, date2);  // false
isSameDay(date1, date2); // false

isWithinInterval(new Date(), {
  start: date1,
  end: date2,
}); // true if current date is in 2024
```

#### Parsing Dates
```typescript
// ✅ CORRECT - Parse date strings
import { parse, parseISO } from 'date-fns';

// Parse ISO string
const date1 = parseISO('2024-11-17T10:30:00.000Z');

// Parse custom format
const date2 = parse('17/11/2024', 'dd/MM/yyyy', new Date());
```

### 🔍 Key Patterns
1. **Immutable** - All functions return new dates, don't mutate
2. **Tree-shakeable** - Import only functions you need
3. **Type-safe** - Full TypeScript support
4. **Pure functions** - No side effects

### ❌ Common Mistakes
```typescript
// ❌ WRONG - Don't mutate dates
const date = new Date();
date.setDate(date.getDate() + 1); // Mutation! Use addDays instead

// ❌ WRONG - Don't import everything
import * as dateFns from 'date-fns'; // Imports entire library!
```

---

## 🗄️ Supabase JS v2.81.1

**Package:** `@supabase/supabase-js: ^2.81.1`  
**Official Docs:** https://supabase.com/docs/reference/javascript/

### ✅ Correct Supabase Patterns

#### Client Import
```typescript
// ✅ CORRECT - Import from integration file
import { supabase } from '@/integrations/supabase/client';

// ❌ WRONG - Never create client manually
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key); // Don't do this!
```

#### Query Data
```typescript
// ✅ CORRECT - Select queries
// Simple select
const { data, error } = await supabase
  .from('users')
  .select('*');

// With filters
const { data, error } = await supabase
  .from('trades')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .order('created_at', { ascending: false })
  .limit(10);

// With relations
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    author:users(name, email),
    comments(*)
  `);
```

#### Insert Data
```typescript
// ✅ CORRECT - Insert operations
// Single insert
const { data, error } = await supabase
  .from('trades')
  .insert({
    symbol: 'BTCUSDT',
    price: 50000,
    quantity: 0.5,
  })
  .select()
  .single();

// Multiple inserts
const { data, error } = await supabase
  .from('trades')
  .insert([
    { symbol: 'BTCUSDT', price: 50000 },
    { symbol: 'ETHUSDT', price: 3000 },
  ])
  .select();
```

#### Update and Delete
```typescript
// ✅ CORRECT - Update
const { data, error } = await supabase
  .from('users')
  .update({ status: 'active' })
  .eq('id', userId)
  .select();

// ✅ CORRECT - Delete
const { error } = await supabase
  .from('trades')
  .delete()
  .eq('id', tradeId);
```

#### Authentication
```typescript
// ✅ CORRECT - Auth operations
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
const { error } = await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

#### Realtime Subscriptions
```typescript
// ✅ CORRECT - Subscribe to changes
const channel = supabase
  .channel('trades-channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'trades',
    },
    (payload) => {
      console.log('New trade:', payload.new);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

#### Edge Functions
```typescript
// ✅ CORRECT - Call edge functions
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' },
});
```

### 🔍 Key Patterns
1. **Import from integration** - Always use pre-configured client
2. **Error handling** - Always check error object
3. **Type safety** - Use generated types from `types.ts`
4. **select() after mutations** - Add `.select()` to get returned data

---

## 🔍 COMPREHENSIVE PRE-COMMIT CHECKLIST

Before committing any code, verify the following based on what you're working with:

### 📊 Charts (lightweight-charts, Recharts)
- [ ] **lightweight-charts**: Imports include series type classes (`CandlestickSeries`, `LineSeries`, etc.)
- [ ] **lightweight-charts**: Uses `chart.addSeries(SeriesType, options)` format (not v4 methods)
- [ ] **lightweight-charts**: No unnecessary `(chart as any)` type casts
- [ ] **Recharts**: Wrapped in `ResponsiveContainer`
- [ ] **Recharts**: Uses semantic color tokens (not direct colors)
- [ ] **Charts**: Refs properly typed when possible
- [ ] **Charts**: Compare against working implementation

### 🔄 Data Fetching (TanStack Query)
- [ ] Uses v5 object syntax: `useQuery({ queryKey, queryFn })`
- [ ] Query keys are arrays: `queryKey: ['resource', id]`
- [ ] Mutations properly invalidate related queries
- [ ] Error handling included
- [ ] Loading states handled

### 🧭 Routing (React Router)
- [ ] Uses `useNavigate()` not `useHistory()`
- [ ] Uses `<Routes>` not `<Switch>`
- [ ] Route elements use `element={<Component />}` not `component={Component}`
- [ ] Path parameters accessed via `useParams()`
- [ ] Query parameters use `useSearchParams()`

### 📝 Forms (React Hook Form + Zod)
- [ ] Form uses `zodResolver` for validation
- [ ] Schema properly typed with `z.infer<typeof schema>`
- [ ] Controller used for custom/controlled components
- [ ] Error messages displayed properly
- [ ] Loading states handled during submission

### ⚛️ React Patterns
- [ ] No conditional hook calls
- [ ] useEffect includes proper cleanup functions
- [ ] Dependencies array is correct (no missing deps)
- [ ] No direct DOM manipulation
- [ ] Refs properly typed

### 🎨 Styling (Tailwind + CVA)
- [ ] **CRITICAL**: Uses semantic tokens from `index.css` (e.g., `hsl(var(--primary))`)
- [ ] **CRITICAL**: NO direct color values (`text-white`, `bg-black`, `#ff0000`)
- [ ] **CRITICAL**: All colors are HSL format
- [ ] Uses `cn()` utility for class merging
- [ ] CVA variants properly defined with base styles
- [ ] Responsive classes use mobile-first approach
- [ ] Dark mode handled via semantic tokens

### 🎨 UI Components (Radix UI)
- [ ] Uses compound component pattern (Root, Trigger, Content)
- [ ] Uses `asChild` prop when needed
- [ ] Portal used for overlays
- [ ] Accessibility props included

### 🎨 Icons (Lucide React)
- [ ] Icons imported directly: `import { Home } from 'lucide-react'`
- [ ] NOT imported from wrong path
- [ ] Size and styling props used correctly
- [ ] Dynamic icons use proper pattern if needed

### ✅ Validation (Zod)
- [ ] Schema defined with proper types
- [ ] Custom error messages provided
- [ ] Type inferred with `z.infer<typeof schema>`
- [ ] Integrated with React Hook Form correctly

### 🗄️ Backend (Supabase)
- [ ] Imports from `@/integrations/supabase/client`
- [ ] NEVER creates client manually
- [ ] Error handling included
- [ ] Uses `.select()` after mutations to get returned data
- [ ] Realtime subscriptions properly cleaned up

### 🔔 Notifications (Sonner)
- [ ] Toaster component added to app root
- [ ] Uses `toast()` from `sonner`
- [ ] Appropriate toast type used (success, error, etc.)

### 📅 Dates (date-fns)
- [ ] Imports specific functions (not entire library)
- [ ] Uses immutable operations (doesn't mutate dates)
- [ ] Proper format strings used

### 🔧 General Code Quality
- [ ] TypeScript compiles with no errors
- [ ] No console errors in browser
- [ ] Proper imports from correct packages
- [ ] No unused imports or variables
- [ ] Code is formatted and readable
- [ ] Comments added for complex logic

### 🧪 Testing
- [ ] Tested in browser before committing
- [ ] Verified functionality works as expected
- [ ] Checked responsive behavior if applicable
- [ ] Verified dark mode if applicable

---

## 🛠️ Adding New Libraries

When adding a new major library to the project, update this document with:

1. **Library name and version** (from package.json)
2. **Common API patterns** (with examples)
3. **Do's and Don'ts** (correct vs incorrect usage)
4. **Working reference file** (where it's correctly implemented)
5. **Migration notes** (if upgrading from older version)

### Template for New Library Entry:
```markdown
## 📦 Library Name vX.Y.Z

**Package:** `library-name: ^X.Y.Z`  
**Official Docs:** [URL]

### ✅ Correct API Patterns
[Code examples]

### ❌ Common Mistakes
[Anti-patterns to avoid]

### 📝 Working Reference Implementation
See `src/path/to/file.tsx` for correct usage.
```

---

## 🌐 CoinGlass API Integration

**Package:** CoinGlass API v4  
**Documentation:** [COINGLASS_API.md](COINGLASS_API.md)  
**Base URL:** `https://open-api-v4.coinglass.com`

### Overview

CoinGlass is the primary external API for fetching cryptocurrency futures market data including funding rates, exchange pairs, and market coverage statistics.

### Implemented Edge Functions

1. **fetch-coinglass-coins** - Get supported trading symbols
2. **fetch-exchange-pairs** - Get all trading pairs across exchanges
3. **fetch-funding-history** - Historical funding rate data (OHLC)
4. **fetch-current-funding** - Real-time funding rates

### Usage Pattern

All CoinGlass data is accessed through Supabase Edge Functions:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Fetch current funding rate
const { data } = await supabase.functions.invoke('fetch-current-funding', {
  body: { 
    symbol: 'BTC',
    exchange: 'Binance'
  }
});
```

### UI Components Using CoinGlass

- **Sidebar.tsx** - Live funding rate display
- **FundingRateChart.tsx** - Historical funding rate chart
- **ExchangeCoverage.tsx** - Exchange pairs coverage stats

### Important Notes

- **Symbol Format**: Use base symbols without quote currency (e.g., "BTC" not "BTCUSDT")
- **Rate Limiting**: Implement caching and avoid excessive requests
- **Authentication**: API key stored in Supabase secrets as `COINGLASS_API_KEY`
- **Auto-refresh**: Funding rates refresh every 8 hours

**Complete Reference:** See [COINGLASS_API.md](COINGLASS_API.md) for detailed endpoint documentation, response formats, error handling, and implementation examples.

---

## 🔄 Version Update Protocol

When upgrading a library version:

1. **Update this document first** with new API patterns
2. **Mark deprecated patterns** with clear warnings
3. **Update all implementations** to use new patterns
4. **Test thoroughly** before committing
5. **Document breaking changes** in this file

---

**Last Updated:** 2025-11-19  
**Maintained By:** Development Team

**Note:** This is a living document. Always keep it updated when library versions change or new libraries are added.

**API Reference:** For external API integration details, see [COINGLASS_API.md](COINGLASS_API.md).
