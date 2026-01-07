import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';

const AdminPortal: React.FC<{ 
  bookings: Booking[], 
  settings: AdminSettings,
  onUpdateSettings: (newSettings: AdminSettings) => void;
  syncId: string;
  onSyncSetup: () => void;
}> = ({ bookings, settings, onUpdateSettings, syncId, onSyncSetup }) => {
  const [viewMode, setViewMode] = useState<'sales' | 'visits'>('sales');
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    let list = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return viewMode === 'sales' 
      ? list.filter(b => b.createdAt.split('T')[0] === todayStr)
      : list.filter(b => b.date === todayStr);
  }, [bookings, viewMode, todayStr]);

  const stats = useMemo(() => ({
    revenue: filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0),
    adults: filteredBookings.reduce((sum, b) => sum + b.adults, 0),
    kids: filteredBookings.reduce((sum, b) => sum + b.kids, 0),
    total: filteredBookings.length
  }), [filteredBookings]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 animate-smart flex flex-col items-center w-full space-y-12">
      
      {/* Management Hero */}
      <div className="w-full bg-slate-900 text-white p-12 md:p-24 rounded-[4rem] relative overflow-hidden flex flex-col items-center text-center shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col items-center gap-10 w-full">
            <div className="flex items-center justify-center gap-4">
              <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">Terminal Securely Active</p>
            </div>
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">Management</h2>
            
            <div className="bg-white/5 px-20 py-12 rounded-[3.5rem] border border-white/10 backdrop-blur-xl flex flex-col items-center mt-8">
                <p className="text-white/30 font-bold text-xs uppercase tracking-[0.5em] mb-6">Aggregate Daily Revenue</p>
                <p className="text-white text-7xl md:text-9xl font-black tracking-tighter leading-none">₹{stats.revenue.toLocaleString()}</p>
            </div>

            <div className="flex bg-white/5 p-2 rounded-[1.5rem] backdrop-blur-md border border-white/5 gap-2 mt-4">
              <button onClick={() => setViewMode('sales')} className={`px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'sales' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white'}`}>Sales Log</button>
              <button onClick={() => setViewMode('visits')} className={`px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'visits' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white'}`}>Visit Schedule</button>
            </div>
        </div>
        <i className="fas fa-water absolute -right-32 -bottom-32 text-white/5 text-[35rem] -rotate-12"></i>
      </div>

      {/* Metrics Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Reservations', value: stats.total, color: 'text-slate-900' },
          { label: 'Adult Entries', value: stats.adults, color: 'text-slate-900' },
          { label: 'Kid Entries', value: stats.kids, color: 'text-slate-900' },
          { label: 'Total Headcount', value: stats.adults + stats.kids, color: 'text-blue-600' }
        ].map((m, i) => (
          <div key={i} className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center transition-transform hover:-translate-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">{m.label}</p>
            <h3 className={`text-6xl font-black ${m.color} tracking-tighter`}>{m.value}</h3>
          </div>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="w-full bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-24">
        <div className="p-10 md:p-16 overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="text-[11px] font-black uppercase text-slate-400 tracking-[0.5em] border-b border-slate-50">
                  <th className="py-12 px-8">Ident ID</th>
                  <th className="py-12 px-8">Guest Profile</th>
                  <th className="py-12 px-8">Schedule</th>
                  <th className="py-12 px-8">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan={4} className="py-48 text-center text-slate-200 font-black uppercase text-sm tracking-[0.8em]">No terminal records found</td></tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="py-12 px-8">
                        <div className="text-[9px] font-black text-slate-300 mb-2 uppercase tracking-widest">{new Date(b.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="font-black text-slate-900 text-xl tracking-tighter uppercase group-hover:text-blue-600 transition-colors">{b.id}</div>
                      </td>
                      <td className="py-12 px-8">
                         <div className="font-black text-slate-800 text-2xl uppercase tracking-tighter leading-none mb-2">{b.name}</div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.mobile}</div>
                      </td>
                      <td className="py-12 px-8">
                         <div className="text-lg font-black text-slate-900 uppercase tracking-tighter">{b.date}</div>
                         <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{b.time.split(': ')[0]}</span>
                         </div>
                      </td>
                      <td className="py-12 px-8">
                         <div className="text-5xl font-black text-slate-900 tracking-tighter">₹{b.totalAmount}</div>
                         <div className="mt-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">Confirmed</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>
      
      <div className="pb-10 text-slate-300 font-black text-[11px] uppercase tracking-[0.8em] text-center">
         SYSTEM NODE: JAIPUR_ADMIN_01
      </div>
    </div>
  );
};

export default AdminPortal;
