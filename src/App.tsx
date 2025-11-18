import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import AITrading from "./pages/AITrading";
import { assertEnv } from "./config/env";

assertEnv();

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/ai-trading" element={<AITrading />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
