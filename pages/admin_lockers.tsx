import React from 'react';

const AdminLockers: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black">CO & LO MANAGEMENT</h2>
          <p className="text-emerald-100 text-sm font-bold mt-1">
            Locker & Costume Control Panel
          </p>
        </div>
      </div>

      {/* MAIN MODULE PLACEHOLDER */}
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 mb-4">
          Locker & Costume System
        </h3>

        <p className="text-slate-500 mb-8">
          Yahin se locker issue, return, pricing, reports, receipt history aur stock control ka pura system banega.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h4 className="font-black text-slate-800 mb-2">🔐 Locker Management</h4>
            <p className="text-sm text-slate-500">
              Issue / Return • Availability • Reports
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h4 className="font-black text-slate-800 mb-2">👕 Costume Management</h4>
            <p className="text-sm text-slate-500">
              Stock • Pricing • History • Reports
            </p>
         
