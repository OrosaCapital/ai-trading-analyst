import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookmarkPlus, ArrowLeft } from 'lucide-react';

const Watchlist = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-black text-accent">OCAPX</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <BookmarkPlus className="w-16 h-16 text-accent" />
            </div>
            <CardTitle className="text-3xl">Watchlist Coming Soon</CardTitle>
            <CardDescription className="text-lg">
              Your personalized trading watchlist will be available here. Track your favorite
              symbols and get AI-powered analysis on demand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Watchlist;
