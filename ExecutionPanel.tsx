import React from 'react';

export const ExecutionPanel = () => {
  return (
    <div className="w-full h-full flex flex-col gap-2">
      <h2 className="text-sm font-bold text-gray-400 px-1">Trade Execution</h2>
      
      {/* Order Entry Placeholder */}
      <div className="flex-1 bg-gray-900/70 rounded border border-gray-700 p-2">
        <div className="text-center text-gray-500 py-4">Order Entry Form</div>
        <button className="w-full bg-green-600 hover:bg-green-500 py-2 rounded-md font-bold">BUY / LONG</button>
        <button className="w-full bg-red-600 hover:bg-red-500 py-2 rounded-md font-bold mt-2">SELL / SHORT</button>
      </div>

      {/* Order Book Placeholder */}
      <div className="flex-1 bg-gray-900/70 rounded border border-gray-700 p-2">
        <div className="text-center text-gray-500">Order Book</div>
      </div>

      {/* Recent Trades Placeholder */}
      <div className="flex-1 bg-gray-900/70 rounded border border-gray-700 p-2">
        <div className="text-center text-gray-500">Recent Trades</div>
      </div>
    </div>
  );
};