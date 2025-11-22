import React from 'react';

const Stat = ({ label, value, className = '' }: { label: string; value: string; className?: string }) => (
  <div className="flex flex-col px-3 border-l border-gray-700">
    <span className="text-xs text-gray-400">{label}</span>
    <span className={`text-sm font-semibold ${className}`}>{value}</span>
  </div>
);

export const LiveHeaderBar = () => {
  return (
    <div className="flex items-center">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">Last Price</span>
        <span className="text-xl font-bold text-green-400">$68,123.45</span>
      </div>
      <Stat label="24h Change" value="+1,234.56 (+1.82%)" className="text-green-400" />
      <Stat label="24h High" value="$69,420.00" />
      <Stat label="24h Low" value="$67,015.50" />
      <Stat label="24h Volume" value="2,150.75 BTC" />
    </div>
  );
};