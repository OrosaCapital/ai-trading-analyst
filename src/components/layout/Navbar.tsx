import { NavLink } from "../NavLink";
import { Terminal, LayoutDashboard, ListChecks, Settings, Activity } from "lucide-react";

export function Navbar() {
  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/watchlist", label: "Watchlist", icon: ListChecks },
    { to: "/ai-trading", label: "AI Trading", icon: Activity },
  ];

  return (
    <nav className="flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/50">
            <Terminal className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            ADMIN PANEL
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
