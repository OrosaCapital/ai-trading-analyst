# Library API Reference & Version Control

This document serves as the **authoritative reference** for library versions and correct API patterns used in this project. **Always consult this document before writing code that uses these libraries.**

---

## 📊 lightweight-charts v5.0.9

**Package:** `lightweight-charts: ^5.0.9`  
**Official Docs:** https://tradingview.github.io/lightweight-charts/

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
// ✅ CORRECT (v5) - setMarkers() API is the same
candleSeries.setMarkers([
  {
    time: 1234567890,
    position: 'belowBar',
    color: '#10b981',
    shape: 'arrowUp',
    text: 'Buy'
  }
]);
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
3. **No API method changes:** `setMarkers()`, `setData()`, etc. remain the same

### 📝 Working Reference Implementation
See `src/components/OcapxChart.tsx`:
- **Line 4:** Correct imports with series types
- **Lines 202-210:** Correct v5 series creation pattern

---

## 🔍 PRE-COMMIT CHECKLIST

Before committing any code that uses libraries from this reference, verify:

### For lightweight-charts Code:
- [ ] Imports include series type classes (`CandlestickSeries`, `LineSeries`, etc.)
- [ ] Uses `chart.addSeries(SeriesType, options)` format
- [ ] Does NOT use v4 methods like `chart.addCandlestickSeries()`
- [ ] No unnecessary `(chart as any)` type casts
- [ ] Refs are properly typed when possible
- [ ] Compare against working implementation (`OcapxChart.tsx`)

### General Checks:
- [ ] Verified library version in `package.json`
- [ ] Checked this reference document for correct patterns
- [ ] Tested in browser before committing
- [ ] No console errors related to library API

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

## 📚 Additional Libraries

### React 18.3.1
- Uses concurrent features
- StrictMode causes double-mount in development (expected behavior)
- Use `useEffect` cleanup functions properly

### TanStack Query v5
- `useQuery` with object syntax: `useQuery({ queryKey: [...], queryFn: ... })`
- `useMutation` for data modifications

### Tailwind CSS
- Use semantic tokens from `index.css` (e.g., `hsl(var(--primary))`)
- Never use direct colors like `text-white`, `bg-black` in components
- All colors must be HSL format

---

## 🔄 Version Update Protocol

When upgrading a library version:

1. **Update this document first** with new API patterns
2. **Mark deprecated patterns** with clear warnings
3. **Update all implementations** to use new patterns
4. **Test thoroughly** before committing
5. **Document breaking changes** in this file

---

**Last Updated:** 2025-11-17  
**Maintained By:** Development Team

**Note:** This is a living document. Always keep it updated when library versions change or new libraries are added.
