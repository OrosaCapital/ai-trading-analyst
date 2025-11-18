import type { PropsWithChildren } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Topbar } from "./Topbar";

interface AppShellProps extends PropsWithChildren {
  showProgress?: boolean;
  minutesCollected?: number;
  minutesRequired?: number;
  symbol?: string;
}

export function AppShell({ children, showProgress, minutesCollected, minutesRequired, symbol = "" }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-black via-slate-950 to-black text-gray-100">
      <Sidebar symbol={symbol} />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <Topbar 
          showProgress={showProgress}
          minutesCollected={minutesCollected}
          minutesRequired={minutesRequired}
        />
        <main className="flex-1 overflow-auto p-2">{children}</main>
      </div>
    </div>
  );
}
