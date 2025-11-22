import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import logo from "@/assets/cannabiscardz-logo.jpg";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToQuestionnaire = () => {
    if (location.pathname === '/') {
      document.getElementById('questionnaire-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('questionnaire-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const scrollToSection = (id: string) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="CannabisCardz Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('how-it-works')} className="text-foreground hover:text-primary transition-colors font-medium">
              How It Works
            </button>
            <button onClick={() => scrollToSection('qualifying-conditions')} className="text-foreground hover:text-primary transition-colors font-medium">
              Qualifying Conditions
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-foreground hover:text-primary transition-colors font-medium">
              Pricing
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-foreground hover:text-primary transition-colors font-medium">
              FAQ
            </button>
            <a href="tel:18557182273" className="text-foreground hover:text-primary transition-colors font-medium">
              📞 1-855-718-2273
            </a>
            
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">Hi, {profile?.first_name || 'there'}</span>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={handleSignOut}
                  variant="ghost"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="outline"
                >
                  Login
                </Button>
                <Button 
                  onClick={scrollToQuestionnaire}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Start Assessment
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <nav className="flex flex-col gap-6 mt-8">
                  <button 
                    onClick={() => {
                      scrollToSection('how-it-works');
                      setMobileMenuOpen(false);
                    }} 
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    How It Works
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('qualifying-conditions');
                      setMobileMenuOpen(false);
                    }} 
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    Qualifying Conditions
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('pricing');
                      setMobileMenuOpen(false);
                    }} 
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    Pricing
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('faq');
                      setMobileMenuOpen(false);
                    }} 
                    className="text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    FAQ
                  </button>
                  <a href="tel:18557182273" className="text-foreground hover:text-primary transition-colors font-medium">
                    📞 1-855-718-2273
                  </a>
                  
                  <div className="pt-4 border-t border-border space-y-3">
                    {user ? (
                      <>
                        <p className="text-sm text-muted-foreground">Hi, {profile?.first_name || 'there'}</p>
                        <Button
                          onClick={() => {
                            navigate('/dashboard');
                            setMobileMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Dashboard
                        </Button>
                        <Button 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="w-full"
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          onClick={() => {
                            navigate('/auth');
                            setMobileMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Login
                        </Button>
                        <Button 
                          onClick={() => {
                            scrollToQuestionnaire();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Start Assessment
                        </Button>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <Button 
              onClick={scrollToQuestionnaire}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              Start
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
