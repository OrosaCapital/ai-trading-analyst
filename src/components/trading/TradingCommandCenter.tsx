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
            <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300 pointer-events-none ${
                isFocused ? 'text-primary scale-110' : 'text-muted-foreground'
              }`} />
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
                placeholder="Search crypto pairs..."
                className={`w-full h-14 pl-12 pr-12 rounded-xl font-mono font-bold text-base tracking-wider transition-all duration-300 border-2 ${
                    isFocused 
                    ? 'border-primary shadow-[0_0_30px_hsl(var(--primary)/0.4),0_0_60px_hsl(var(--primary)/0.2)] bg-background' 
                    : 'border-border/50 hover:border-border shadow-lg bg-background'
                }`}
              />
              {searchValue && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Suggestions Dropdown - Fixed positioning with high z-index */}
            {showSuggestions && filteredSymbols.length > 0 && (
              <div className="fixed mt-2 w-[380px] bg-background border-2 border-primary/30 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_hsl(var(--primary)/0.3)] overflow-hidden z-[9999] backdrop-blur-xl"
                style={{
                  top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 8 : 0,
                  left: containerRef.current ? containerRef.current.getBoundingClientRect().left : 0,
                }}
              >
                <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                  {filteredSymbols.map((item, idx) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedIndex === idx
                          ? 'bg-primary/20 border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
                          : 'hover:bg-secondary/50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          selectedIndex === idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.symbol.substring(0, 2)}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-base text-foreground">{item.symbol}</div>
                          <div className="text-xs text-muted-foreground">{item.name}</div>
                        </div>
                      </div>
                      {item.trending && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">Hot</span>
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
