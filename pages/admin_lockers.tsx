import React, { useState } from 'react';

const AdminLockers: React.FC = () => {
  const [tab, setTab] = useState<'issue' | 'return' | 'stock' | 'reports'>('issue');

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-10 space-y-8">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-800">CO & LO MANAGEMENT</h2>
        <p className="text-slate-500 text-sm mt-1">Locker & Costume Control Panel</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 flex-wrap">
        <TabButton label="Issue" active={tab === 'issue'} onClick={() => setTab('issue')} />
        <TabButton label="Return" active={tab === 'return'} onClick={() => setTab('return')} />
        <TabButton label="Stock" active={tab === 'stock'} onClick={() => setTab('stock')} />
        <TabButton label="Reports" active={tab === 'reports'} onClick={() => setTab('reports')} />
      </div>

      {/* Content Area */}
      <div className="bg-slate-50 rounded-2xl p-8 min-h-[250px] border border-slate-200">

        {tab === 'issue' && (
          <div className="text-center space-y-2">
            <h3 className="font-black text-xl">Issue Panel</h3>
            <p className="text-slate-500">Locker & costume issuing will be built here</p>
          </div>
        )}

        {tab === 'return' && (
          <div className="text-center space-y-2">
            <h3 className="font-black text-xl">Return Panel</h3>
            <p className="text-slate-500">Receipt based return system will be built here</p>
          </div>
        )}

        {tab === 'stock' && (
          <div className="text-center space-y-2">
            <h3 className="font-black text-xl">Stock Panel</h3>
            <p className="text-slate-500">Live locker & costume stock status</p>
          </div>
        )}

        {tab === 'reports' && (
          <div className="text-center space-y-2">
            <h3 className="font-black text-xl">Reports Panel</h3>
            <p className="text-slate-500">Daily & summary reports</p>
          </div>
        )}

      </div>
    </div>
  );
};

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all border 
      ${active
        ? 'bg-emerald-500 text-white border-emerald-500 shadow'
        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
      }`}
  >
    {label}
  </button>
);

export default AdminLockers;
