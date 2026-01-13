import React from 'react';

const AdminLockers: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center space-y-6">

        <h2 className="text-3xl font-black text-slate-800">
          CO & LO MANAGEMENT
        </h2>

        <p className="text-slate-500">
          Locker & Costume system will be built here.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">

          <div className="bg-emerald-100 rounded-xl p-6 shadow text-center font-bold text-emerald-900">
            Issue
          </div>

          <div className="bg-blue-100 rounded-xl p-6 shadow text-center font-bold text-blue-900">
            Return
          </div>

          <div className="bg-amber-100 rounded-xl p-6 shadow text-center font-bold text-amber-900">
            Stock
          </div>

          <div className="bg-purple-100 rounded-xl p-6 shadow text-center font-bold text-purple-900">
            Reports
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminLockers;
