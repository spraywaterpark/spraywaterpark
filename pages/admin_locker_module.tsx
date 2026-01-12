import React from 'react';

const AdminLockerModule: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 text-white">

      <h1 className="text-4xl font-black mb-2">
        Locker & Costume Manager
      </h1>

      <p className="text-white/70 mb-10">
        Independent control module (Safe from ticket system)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="font-black text-xl mb-4">Pricing Control</h2>
          <p className="text-white/60 text-sm">Configure locker & costume rates</p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="font-black text-xl mb-4">Receipts & Reports</h2>
          <p className="text-white/60 text-sm">Issued / Returned / Collection summary</p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="font-black text-xl mb-4">Search System</h2>
          <p className="text-white/60 text-sm">Find receipt, customer, locker</p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="font-black text-xl mb-4">Future Tools</h2>
          <p className="text-white/60 text-sm">Reserved for upgrades</p>
        </div>

      </div>

    </div>
  );
};

export default AdminLockerModule;

