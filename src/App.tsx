import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AdminShell } from "./components/layout/AdminShell";
import { Dashboard } from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import TradingDashboard from "./pages/TradingDashboard";
import AdvancedTrading from "./pages/AdvancedTrading";
import SymbolDetails from "./pages/SymbolDetails";
import Auth from "./pages/Auth";
import DataFlowVisualization from "./pages/DataFlowVisualization";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<RoleProtectedRoute requiredRole="superuser"><Dashboard /></RoleProtectedRoute>} />
        <Route path="/data-flow" element={<RoleProtectedRoute requiredRole="superuser"><DataFlowVisualization /></RoleProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
        <Route path="/symbol/:symbolParam" element={<SymbolDetails />} />
        <Route path="/trading" element={<TradingDashboard />} />
        <Route path="/advanced-trading" element={<AdvancedTrading />} />
      </Routes>
    </BrowserRouter>
  );
}
