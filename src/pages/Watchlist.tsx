import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookmarkPlus, Plus, TrendingUp, TrendingDown, Clock, DollarSign, Activity, LogOut, Trash2, Eye, MoreVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const Watchlist = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { watchlist, isLoading, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const getDecisionBadge = (decision?: string) => {
    if (!decision) return null;
    
    const config: Record<string, { variant: 'default' | 'destructive' | 'secondary', icon: any, className: string }> = {
      'LONG': { variant: 'default', icon: TrendingUp, className: 'bg-chart-green text-white' },
      'SHORT': { variant: 'destructive', icon: TrendingDown, className: 'bg-chart-red text-white' },
      'NO TRADE': { variant: 'secondary', icon: Activity, className: 'bg-muted text-muted-foreground' }
    };

    const { variant, icon: Icon, className } = config[decision as keyof typeof config] || config['NO TRADE'];
    
    return (
      <Badge variant={variant} className={`gap-1 ${className}`}>
        <Icon className="w-3 h-3" />
        {decision}
      </Badge>
    );
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-black text-accent">Watchlist</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Trading Watchlist</h2>
            <p className="text-muted-foreground">
              Track your favorite crypto symbols and get AI-powered analysis
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Symbol
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Symbol to Watchlist</DialogTitle>
                <DialogDescription>
                  Add a cryptocurrency symbol to track and analyze
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    placeholder="BTC, ETH, SOL..."
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input
                    id="nickname"
                    placeholder="My Bitcoin Position"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Trading notes, strategy, entry points..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSymbol} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                  Add to Watchlist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Watchlist Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : watchlist.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <BookmarkPlus className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No symbols in your watchlist</h3>
                <p className="text-muted-foreground mb-6">
                  Start by adding your favorite cryptocurrencies to track and analyze
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Symbol
                </Button>
              </div>
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Popular symbols to get started:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['BTC', 'ETH', 'SOL', 'ADA', 'DOT'].map((sym) => (
                    <Button
                      key={sym}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSymbol(sym);
                        setIsAddDialogOpen(true);
                      }}
                    >
                      {sym}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-accent">
                        {item.symbol}
                      </h3>
                      {item.nickname && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.nickname}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard?symbol=${item.symbol}`)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => removeFromWatchlist(item.id, item.symbol)}
                          className="cursor-pointer text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Current Price */}
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    {formatPrice(item.current_price)}
                  </div>

                  {/* Latest Analysis */}
                  {item.last_decision ? (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Latest Signal</span>
                        {getDecisionBadge(item.last_decision)}
                      </div>
                      
                      {item.last_confidence && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{Math.round(item.last_confidence)}%</span>
                          </div>
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent transition-all"
                              style={{ width: `${item.last_confidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {item.last_analysis_time && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.last_analysis_time), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                      No analysis available yet
                    </div>
                  )}

                  {/* Notes Preview */}
                  {item.notes && (
                    <div className="text-sm text-muted-foreground border-t border-border pt-3">
                      <p className="line-clamp-2">{item.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/dashboard?symbol=${item.symbol}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        navigate(`/dashboard?symbol=${item.symbol}`);
                        toast.info('Navigate to dashboard to run analysis');
                      }}
                    >
                      <Activity className="w-4 h-4 mr-2" />
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
