import React from 'react';

export const ContextChart = ({ timeframe, label }: { timeframe: string; label: string }) => {
  return (
    <div className="flex-1 bg-gray-900/70 rounded border border-gray-700 flex items-center justify-center relative">
      <div className="absolute top-1 left-2 text-xs font-bold text-gray-400">{timeframe}</div>
      <div className="absolute bottom-1 right-2 text-xs text-gray-500">{label}</div>
      <svg className="w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M0 40 L10 30 L20 35 L30 20 L40 25 L50 10 L60 15 L70 5 L80 10 L90 20 L100 15" fill="none" stroke="#4ade80" strokeWidth="2"/></svg>
      <span className="text-gray-600 text-lg font-mono">Chart</span>
    </div>
  );
};