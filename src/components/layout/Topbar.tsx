import { useState, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMarketStore } from '@/store/useMarketStore';

export const Topbar = () => {
  const navigate = useNavigate();
  const { symbol, setSymbol } = useMarketStore();
  const [inputValue, setInputValue] = useState(symbol);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  });

  const handleSymbolChange = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed && trimmed !== symbol) {
      setSymbol(trimmed);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSymbolChange();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl">TradingAI</span>
          </Link>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter symbol (e.g., BTC, ETH)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSymbolChange} size="sm">
              Search
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <Link to="/watchlist">
              <Button variant="ghost" size="sm" className="gap-2">
                <ListTodo className="w-4 h-4" />
                Watchlist
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <User className="w-4 h-4 mr-2" />
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
