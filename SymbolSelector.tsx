import React from 'react';

export const SymbolSelector = () => {
  return (
    <div className="flex items-center">
      <input
        type="text"
        defaultValue="XBTUSDT"
        className="bg-gray-900 border border-gray-600 rounded-md px-3 py-1.5 text-lg font-bold w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};