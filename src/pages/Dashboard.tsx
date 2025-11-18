import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LivePriceHeader } from '@/components/dashboard/LivePriceHeader';
import { CoinglassPanel } from '@/components/dashboard/CoinglassPanel';
import { AIAnalysisPanel } from '@/components/dashboard/AIAnalysisPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, BookmarkPlus, LogOut, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [symbol, setSymbol] = useState('BTC');
  const [inputValue, setInputValue] = useState('BTC');
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const handleSymbolChange = () => {
    const cleanSymbol = inputValue.trim().toUpperCase();
    if (cleanSymbol) {
      setSymbol(cleanSymbol);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSymbolChange();
    }
  };
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const {
          data
        } = await supabase.functions.invoke('fetch-cmc-data', {
          body: {
            symbol: `${symbol}USD`
          }
        });
        if (data) {
          setMarketData(data);
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, [symbol]);
  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };
  return <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-accent">OCAPX</h1>
              <span className="text-sm text-muted-foreground">Trading Dashboard</span>
            </div>
            
            <NavLink 
              to="/watchlist" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-accent font-medium"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Watchlist</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-4">
            {/* Symbol Search */}
            <div className="flex items-center gap-2 max-w-xs">
              <Input placeholder="Enter symbol (BTC, ETH, SOL...)" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} className="font-mono" />
              <Button onClick={handleSymbolChange} size="icon" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Section 1: Live Price Header */}
        <section>
          <LivePriceHeader symbol={symbol} marketData={marketData} />
        </section>

        {/* Section 2: Key Metrics - Power BI Style */}
        <section>
          
        </section>

        {/* Sections 3 & 4: AI Analysis + Coinglass Side by Side */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: AI Analysis */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-1">AI Trading Analyst</h2>
              <p className="text-sm text-muted-foreground">Live AI-powered trade signals and market analysis</p>
            </div>
            <AIAnalysisPanel symbol={symbol} />
          </div>

          {/* Right: Coinglass Intelligence Panel */}
          <div>
            <CoinglassPanel symbol={symbol} />
          </div>
        </section>
      </main>
    </div>;
};
export default Dashboard;