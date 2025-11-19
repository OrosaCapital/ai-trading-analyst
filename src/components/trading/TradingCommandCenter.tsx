import { useState, useRef, useEffect } from "react";
import { Search, TrendingUp, Sparkles, X } from "lucide-react";

interface TradingCommandCenterProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  currentPrice?: number;
}

export function TradingCommandCenter({
  symbol,
  onSymbolChange,
  currentPrice,
}: TradingCommandCenterProps) {
  const [searchValue, setSearchValue] = useState(symbol);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const popularSymbols = [
    { symbol: "BTCUSDT", name: "Bitcoin", trending: true },
    { symbol: "ETHUSDT", name: "Ethereum", trending: true },
    { symbol: "SOLUSDT", name: "Solana", trending: true },
    { symbol: "BNBUSDT", name: "BNB", trending: false },
    { symbol: "XRPUSDT", name: "Ripple", trending: false },
    { symbol: "ADAUSDT", name: "Cardano", trending: false },
  ];

  const filteredSymbols = searchValue.length > 0
    ? popularSymbols.filter(s => 
        s.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
        s.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : popularSymbols;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && filteredSymbols[selectedIndex]) {
        onSymbolChange(filteredSymbols[selectedIndex].symbol);
        setSearchValue(filteredSymbols[selectedIndex].symbol);
      } else {
        onSymbolChange(searchValue);
      }
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSymbols.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectSymbol = (sym: string) => {
    setSearchValue(sym);
    onSymbolChange(sym);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchValue("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    setSearchValue(symbol);
  }, [symbol]);

  return (
    <div className="relative glass-panel border-b border-border/50 p-3 shadow-elevated z-[100]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left - Symbol Search and Price */}
        <div className="flex items-center gap-2 flex-1">
          <div ref={containerRef} className="relative max-w-md w-full group z-[100]">
            <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''}`}>
              <div className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
                isFocused ? 'opacity-100' : 'opacity-0'
              } bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl`} />
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 transition-all duration-300 pointer-events-none ${
                isFocused ? 'text-primary' : 'text-muted-foreground/60'
              }`}>
                <Search className="h-4 w-4" />
                <span className="text-xs font-mono tracking-widest opacity-50">|</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value.toUpperCase());
                  setShowSuggestions(true);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setIsFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  setIsFocused(false);
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="ENTER SYMBOL..."
                className={`relative w-full h-11 pl-14 pr-11 rounded-lg font-mono font-semibold text-sm tracking-[0.15em] uppercase transition-all duration-200 backdrop-blur-sm ${
                  isFocused 
                    ? 'bg-background/80 border border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.15)] text-foreground placeholder:text-muted-foreground/40' 
                    : 'bg-background/40 border border-border/30 hover:border-border/50 hover:bg-background/60 text-foreground/90 placeholder:text-muted-foreground/30'
                }`}
              />
              {searchValue && (
                <button
                  onClick={handleClear}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded flex items-center justify-center transition-all duration-200 ${
                    isFocused ? 'text-primary/70 hover:text-primary hover:bg-primary/10' : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            {/* Suggestions Dropdown - Fixed positioning with high z-index */}
            {showSuggestions && filteredSymbols.length > 0 && (
              <div className="fixed mt-1 w-[380px] bg-background/95 backdrop-blur-xl border border-primary/30 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_hsl(var(--primary)/0.2)] overflow-hidden z-[9999]"
                style={{
                  top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 4 : 0,
                  left: containerRef.current ? containerRef.current.getBoundingClientRect().left : 0,
                }}
              >
                <div className="p-1.5 space-y-0.5 max-h-[360px] overflow-y-auto">
                  {filteredSymbols.map((item, idx) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-150 group ${
                        selectedIndex === idx
                          ? 'bg-primary/15 border border-primary/50'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-md flex items-center justify-center font-bold text-[10px] tracking-wider transition-colors ${
                          selectedIndex === idx ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground group-hover:bg-muted'
                        }`}>
                          {item.symbol.substring(0, 2)}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-sm text-foreground tracking-wide">{item.symbol}</div>
                          <div className="text-[10px] text-muted-foreground/70 tracking-wider uppercase">{item.name}</div>
                        </div>
                      </div>
                      {item.trending && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold text-primary tracking-wider">HOT</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Current Price Display */}
          {currentPrice && (
            <div className="flex items-center gap-2 px-3 py-2 glass rounded-lg border border-primary/20">
              <div className="text-left">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-1">Price</div>
                <div className="text-lg font-bold text-primary glow-primary leading-none">
                  ${currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
