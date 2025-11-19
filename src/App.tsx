import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AdminShell } from "./components/layout/AdminShell";
import { Dashboard } from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import AITrading from "./pages/AITrading";
import TradingDashboard from "./pages/TradingDashboard";
import SymbolDetails from "./pages/SymbolDetails";
import Auth from "./pages/Auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { assertEnv } from "./config/env";

assertEnv();

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<RoleProtectedRoute requiredRole="superuser"><Dashboard /></RoleProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><AppShell><Watchlist /></AppShell></ProtectedRoute>} />
        <Route path="/ai-trading" element={<ProtectedRoute><AppShell><AITrading /></AppShell></ProtectedRoute>} />
        <Route path="/symbol/:symbolParam" element={<SymbolDetails />} />
        <Route path="/trading" element={<TradingDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
