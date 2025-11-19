import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AdminShell } from "./components/layout/AdminShell";
import { Dashboard } from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import AITrading from "./pages/AITrading";
import TradingDashboard from "./pages/TradingDashboard";
import SymbolDetails from "./pages/SymbolDetails";
import { assertEnv } from "./config/env";

assertEnv();

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/watchlist" element={<AppShell><Watchlist /></AppShell>} />
        <Route path="/ai-trading" element={<AppShell><AITrading /></AppShell>} />
        <Route path="/symbol/:symbolParam" element={<SymbolDetails />} />
        <Route path="/trading" element={<TradingDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
