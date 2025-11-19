import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist, WatchlistItem } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookmarkPlus, Plus, Clock, DollarSign, LogOut, Trash2, Eye, MoreVertical, Loader2, TrendingUp, Activity, Sparkles, Search, Star, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { formatPrice } from '@/lib/priceFormatter';

const Watchlist = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
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

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

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
    <div className="min-h-screen bg-background relative">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--cyber-blue) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--cyber-blue) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Navigation Bar */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Star className="w-7 h-7 text-accent animate-pulse" fill="hsl(var(--accent))" />
              <div className="absolute inset-0 blur-lg bg-accent/50 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
                Watchlist
              </h1>
              <p className="text-xs text-muted-foreground">Track your favorite symbols</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')} className="hidden sm:flex">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-accent/30 hover:border-accent/60 transition-all">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-accent font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-accent/30">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-foreground">My Account</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section with Stats */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground via-accent to-primary">
                  My Portfolio
                </h2>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 px-3 py-1">
                  <Activity className="w-3 h-3 mr-1" />
                  {watchlist.length} Active
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Real-time tracking and AI-powered analysis for your crypto portfolio
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={analyzeAllSymbols}
                disabled={watchlist.length === 0 || isLoading}
                variant="outline"
                className="border-primary/30 hover:border-primary hover:bg-primary/10 text-primary"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze All
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-accent to-primary hover:opacity-90 text-background font-bold shadow-lg shadow-accent/30">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Symbol
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-accent/30">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
                      Add to Watchlist
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Track a new cryptocurrency symbol with personalized notes
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="symbol" className="text-foreground font-semibold">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="e.g., BTC, ETH, SOL"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        className="uppercase bg-input border-border/50 focus:border-accent transition-colors"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="nickname" className="text-foreground font-semibold">Nickname (Optional)</Label>
                      <Input
                        id="nickname"
                        placeholder="e.g., Bitcoin, My Top Pick"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="bg-input border-border/50 focus:border-accent transition-colors"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="notes" className="text-foreground font-semibold">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add your trading notes or analysis..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="bg-input border-border/50 focus:border-accent transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddSymbol} 
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-accent to-primary hover:opacity-90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Watchlist
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search Bar */}
          {watchlist.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search symbols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50 focus:border-accent transition-colors"
              />
            </div>
          )}
        </div>

        {/* Watchlist Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
            <p className="text-muted-foreground animate-pulse">Loading your watchlist...</p>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <Card className="text-center py-16 bg-card/50 backdrop-blur-xl border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="relative inline-block mb-6">
                <Star className="w-20 h-20 mx-auto text-accent/30" />
                <div className="absolute inset-0 blur-xl bg-accent/20 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">
                {watchlist.length === 0 ? 'Your Watchlist is Empty' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {watchlist.length === 0 
                  ? 'Start tracking your favorite crypto symbols. Add them to your watchlist to monitor prices and get AI-powered analysis.'
                  : `No symbols match "${searchQuery}". Try a different search term.`
                }
              </p>
              {watchlist.length === 0 && (
                <>
                  <div className="flex flex-wrap gap-2 justify-center mb-8">
                    {['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE'].map((sym) => (
                      <Badge 
                        key={sym}
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent/10 hover:border-accent transition-all hover:scale-105 border-border/50 text-sm px-3 py-1"
                        onClick={() => {
                          setSymbol(sym);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        {sym}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-gradient-to-r from-accent to-primary hover:opacity-90 shadow-lg shadow-accent/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Symbol
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWatchlist.map((item) => (
              <Card 
                key={item.id} 
                className="group relative overflow-hidden bg-card/50 backdrop-blur-xl border-border/50 hover:border-accent/50 transition-all duration-500 hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1"
              >
                {/* Holographic Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-accent group-hover:from-accent group-hover:to-primary transition-all">
                          {item.symbol}
                        </CardTitle>
                        {item.nickname && (
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs font-semibold">
                            {item.nickname}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Added {formatDistanceToNow(new Date(item.added_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/30 hover:border-accent/50 hover:bg-accent/10 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-accent/30 w-48">
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem 
                          onClick={() => navigate(`/symbol/${item.symbol}`)}
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2 text-primary" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAnalyze(item)}
                          className="cursor-pointer"
                          disabled={analyzingId === item.id}
                        >
                          {analyzingId === item.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2 text-accent" />
                          )}
                          Analyze
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem 
                          onClick={() => removeFromWatchlist(item.id, item.symbol)}
                          className="text-destructive cursor-pointer focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 pt-4">
                  {/* Price Display */}
                  {item.current_price ? (
                    <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-accent" />
                          <span className="text-2xl font-bold text-foreground">
                            {formatPrice(item.current_price)}
                          </span>
                        </div>
                        <TrendingUp className="w-5 h-5 text-chart-green" />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm">Price loading...</span>
                      </div>
                    </div>
                  )}

                  {/* Notes Preview */}
                  {item.notes && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/20 border border-border/30">
                      <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                        {item.notes}
                      </CardDescription>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-primary/30 hover:border-primary hover:bg-primary/10 text-primary transition-all"
                      size="sm"
                      onClick={() => navigate(`/symbol/${item.symbol}`)}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Chart
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-accent/30 hover:border-accent hover:bg-accent/10 text-accent transition-all"
                      size="sm"
                      onClick={() => handleAnalyze(item)}
                      disabled={analyzingId === item.id}
                    >
                      {analyzingId === item.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Analyze
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Watchlist;
