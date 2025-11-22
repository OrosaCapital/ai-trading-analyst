import React from 'react';

export const TabbedInfoPanel = () => {
  const tabs = ['Positions', 'Open Orders', 'Order History', 'AI Analysis Log', 'Funding Rates'];
  const activeTab = 'Positions';

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center border-b border-gray-700">
        {tabs.map(tab => (
          <button key={tab} className={`px-4 py-2 text-sm font-semibold ${tab === activeTab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-700/50'}`}>
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-grow p-2">
        <div className="text-gray-500">Data for '{activeTab}' will be displayed here.</div>
      </div>
    </div>
  );
};