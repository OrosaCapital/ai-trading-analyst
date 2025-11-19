import type { PropsWithChildren } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Topbar } from "./Topbar";

interface AdminShellProps extends PropsWithChildren {
  showProgress?: boolean;
  minutesCollected?: number;
  minutesRequired?: number;
}

export function AdminShell({ children, showProgress, minutesCollected, minutesRequired }: AdminShellProps) {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-black via-slate-950 to-black text-gray-100">
      <Sidebar symbol="" />
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
