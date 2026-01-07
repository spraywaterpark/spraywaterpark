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
      
      {/* Analytics Terminal */}
      <div className="w-full bg-slate-900 text-white p-12 md:p-20 rounded-[3rem] relative overflow-hidden flex flex-col items-center text-center shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col items-center gap-10 w-full">
            <div className="flex items-center justify-center gap-3">
              <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Terminal Active</p>
            </div>
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">Management</h2>
            
            <div className="bg-white/5 px-16 py-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl flex flex-col items-center mt-6">
                <p className="text-white/30 font-bold text-xs uppercase tracking-[0.4em] mb-4">Daily Yield</p>
                <p className="text-white text-7xl md:text-9xl font-black tracking-tighter leading-none">₹{stats.revenue.toLocaleString()}</p>
            </div>

            <div className="flex bg-white/5 p-1.5 rounded-2xl backdrop-blur-md border border-white/5 gap-2">
              <button onClick={() => setViewMode('sales')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'sales' ? 'bg-white text-slate-900' : 'text-white/40 hover:text-white'}`}>Daily Sales</button>
              <button onClick={() => setViewMode('visits')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'visits' ? 'bg-white text-slate-900' : 'text-white/40 hover:text-white'}`}>Visit Log</button>
            </div>
        </div>
        <i className="fas fa-water absolute -right-24 -bottom-24 text-white/5 text-[30rem] -rotate-12"></i>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Reservations', value: stats.total, color: 'text-slate-900' },
          { label: 'Adults', value: stats.adults, color: 'text-slate-900' },
          { label: 'Kids', value: stats.kids, color: 'text-slate-900' },
          { label: 'Total Volume', value: stats.adults + stats.kids, color: 'text-slate-900' }
        ].map((m, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center transition-transform hover:-translate-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{m.label}</p>
            <h3 className={`text-5xl font-black ${m.color} tracking-tighter`}>{m.value}</h3>
          </div>
        ))}
      </div>

      <div className="w-full bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
        <div className="p-8 md:p-14 overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] border-b border-slate-50">
                  <th className="py-10 px-6">Ident</th>
                  <th className="py-10 px-6">Guest</th>
                  <th className="py-10 px-6">Schedule</th>
                  <th className="py-10 px-6">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan={4} className="py-40 text-center text-slate-200 font-black uppercase text-sm tracking-widest">No terminal data for this view</td></tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-10 px-6">
                        <div className="text-[9px] font-black text-slate-400 mb-1">{new Date(b.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="font-black text-slate-900 text-lg tracking-tighter uppercase">{b.id}</div>
                      </td>
                      <td className="py-10 px-6">
                         <div className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-tight">{b.name}</div>
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{b.mobile}</div>
                      </td>
                      <td className="py-10 px-6">
                         <div className="text-md font-black text-slate-900 uppercase tracking-widest">{b.date}</div>
                         <div className="text-[9px] text-slate-400 font-black uppercase mt-1.5 px-3 py-1 bg-slate-50 rounded-lg inline-block">{b.time.split(': ')[0]}</div>
                      </td>
                      <td className="py-10 px-6">
                         <div className="text-4xl font-black text-slate-900 tracking-tighter">₹{b.totalAmount}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
