import React from 'react';
import { SymbolSelector } from '@/components/adv-trading/SymbolSelector';
import { LiveHeaderBar } from '@/components/adv-trading/LiveHeaderBar';
import { ContextChart } from '@/components/adv-trading/ContextChart';
import { MainChart } from '@/components/adv-trading/MainChart';
import { ExecutionPanel } from '@/components/adv-trading/ExecutionPanel';
import { TabbedInfoPanel } from '@/components/adv-trading/TabbedInfoPanel';

/**
 * Advanced Trading Dashboard Page
 * This layout is designed for high-information density, modularity, and clarity.
 * It uses a CSS grid to partition the screen into logical zones.
 */
export default function AdvTradingPage() {
  return (
    <div className="bg-gray-900 text-gray-200 h-screen w-full flex flex-col p-2 gap-2 font-sans">
      {/* ZONE 1: HEADER */}
      <header className="flex items-center gap-4 bg-gray-800/50 p-2 rounded-md border border-gray-700">
        <SymbolSelector />
        <LiveHeaderBar />
      </header>

      {/* Main Content Grid */}
      <main className="flex-grow grid grid-cols-12 grid-rows-3 gap-2">
      <main className="flex-grow grid grid-cols-12 gap-2">
        {/* ZONE 2: CONTEXT PANEL (Left) */}
        <aside className="col-span-2 row-span-3 bg-gray-800/50 rounded-md border border-gray-700 p-2 flex flex-col gap-2">
        <aside className="col-span-2 bg-gray-800/50 rounded-md border border-gray-700 p-2 flex flex-col gap-2">
          <h2 className="text-sm font-bold text-gray-400 px-1">Multi-Timeframe Context</h2>
          <ContextChart timeframe="4H" label="Trend Context" />
          <ContextChart timeframe="1H" label="Market Structure" />
          <ContextChart timeframe="5M" label="Entry Timing" />
        </aside>

        {/* ZONE 3 & 4: MAIN CHART & EXECUTION */}
        <section className="col-span-10 row-span-3 grid grid-cols-10 gap-2">
          <div className="col-span-8 bg-gray-800/50 rounded-md border border-gray-700 p-2">
            <MainChart />
          </div>
          <div className="col-span-2 bg-gray-800/50 rounded-md border border-gray-700 p-2">
            <ExecutionPanel />
          </div>
        {/* ZONE 3: MAIN CHART PANEL */}
        <section className="col-span-8 bg-gray-800/50 rounded-md border border-gray-700 p-2">
          <MainChart />
        </section>
        {/* ZONE 4: EXECUTION PANEL */}
        <section className="col-span-2 bg-gray-800/50 rounded-md border border-gray-700 p-2">
          <ExecutionPanel />
        </section>
      </main>

      {/* ZONE 5: TABBED INFORMATION PANEL */}
      <footer className="h-[250px] bg-gray-800/50 rounded-md border border-gray-700 p-2">
        <TabbedInfoPanel />
      </footer>
    </div>
  );
}