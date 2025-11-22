import React from 'react';

export const MainChart = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
        {['1M', '5M', '15M', '1H', '4H', '1D'].map(tf => (
          <button key={tf} className={`px-3 py-1 text-sm rounded-md ${tf === '15M' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{tf}</button>
        ))}
      </div>
      <div className="flex-grow bg-gray-900/70 rounded border border-gray-700 flex items-center justify-center"><span className="text-gray-600 text-4xl font-mono">Main Trading Chart</span></div>
    </div>
  );
};