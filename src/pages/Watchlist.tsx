import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist, WatchlistItem } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Search, Star, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/priceFormatter';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TradingNavigation } from '@/components/trading/TradingNavigation';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';

const Watchlist = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { watchlist, isLoading, addToWatchlist, removeFromWatchlist, analyzeSymbol, analyzeAllSymbols } = useWatchlist();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/watchlist');
    }
  }, [user, loading, navigate]);

  const handleAddSymbol = async () => {
    if (!symbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }

    setIsSubmitting(true);
    const { error } = await addToWatchlist(symbol, nickname, notes);
    setIsSubmitting(false);

    if (!error) {
      setIsAddDialogOpen(false);
      setSymbol('');
      setNickname('');
      setNotes('');
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  const handleAnalyze = async (item: WatchlistItem) => {
    setAnalyzingId(item.id);
    await analyzeSymbol(item.id, item.symbol);
    setAnalyzingId(null);
  };

  const filteredWatchlist = watchlist.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <TradingNavigation />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-10 h-14">
            <div className="flex items-center gap-4 px-4 flex-1">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Watchlist</h1>
            </div>
            <div className="flex items-center gap-2 px-4">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Symbol
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add to Watchlist</DialogTitle>
                    <DialogDescription>
                      Add a cryptocurrency symbol to track
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="BTC, ETH, SOL..."
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nickname (optional)</Label>
                      <Input
                        id="nickname"
                        placeholder="My favorite coin"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Why you're tracking this..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSymbol} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Symbols</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{watchlist.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {watchlist.length > 0
                      ? formatPrice(
                          watchlist.reduce((sum, item) => sum + (item.current_price || 0), 0) /
                            watchlist.length
                        )
                      : '$0.00'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={analyzeAllSymbols} 
                    disabled={watchlist.length === 0 || isLoading}
                    className="w-full"
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze All
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search symbols or nicknames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm"
              />
            </div>

            {/* Watchlist Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredWatchlist.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Star className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? 'No symbols found' : 'Your watchlist is empty'}
                  </h3>
                  <p className="text-muted-foreground text-center mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : 'Start tracking your favorite cryptocurrencies'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      size="lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Symbol
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredWatchlist.map((item) => (
                  <WatchlistCard
                    key={item.id}
                    item={item}
                    onAnalyze={handleAnalyze}
                    onRemove={removeFromWatchlist}
                    isAnalyzing={analyzingId === item.id}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Watchlist;
