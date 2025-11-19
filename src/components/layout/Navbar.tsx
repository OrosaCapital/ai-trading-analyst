import { NavLink } from "../NavLink";
import { Terminal, LayoutDashboard, ListChecks, Settings, Activity, Coins } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useDashboardVersion } from "@/hooks/useDashboardVersion";

export function Navbar() {
  const location = useLocation();
  const { version } = useDashboardVersion();
  
  const navItems = [
    { to: "/", label: "Admin Dashboard", icon: LayoutDashboard },
    { to: "/watchlist", label: "Watchlist", icon: ListChecks },
    { to: "/symbol/BTC", label: "Symbol Details", icon: Coins },
    { to: "/trading", label: "Trading Dashboard", icon: Activity },
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith("/symbol/")) {
      return "SYMBOL DETAILS";
    }
    switch (location.pathname) {
      case "/":
        return "ADMIN PANEL";
      case "/trading":
        return `TRADING DASHBOARD v${version}`;
      case "/watchlist":
        return "WATCHLIST";
      default:
        return "OCAPX AI";
    }
  };

  return (
    <nav className="flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/50">
            <Terminal className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50"
              activeClassName="bg-muted text-foreground"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-500">ONLINE</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </nav>
  );
}
