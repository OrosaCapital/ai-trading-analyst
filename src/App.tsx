import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { assertEnv } from "./config/env";

assertEnv();

export default function App() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
