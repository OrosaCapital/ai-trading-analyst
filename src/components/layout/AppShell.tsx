import type { PropsWithChildren } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-black via-slate-950 to-black text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <Topbar />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
