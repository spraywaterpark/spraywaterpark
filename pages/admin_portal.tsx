import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';
import { cloudSync } from '../services/cloud_sync';

interface AdminPanelProps {
  bookings: Booking[];
  settings: AdminSettings;
  onUpdateSettings: (s: AdminSettings) => void;
  syncId: string | null;
  onSyncSetup: (id: string) => void;
}

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings, syncId, onSyncSetup }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'sync'>('bookings');
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => { setDraft(settings); }, [settings]);
  
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, [bookings]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    let list = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (viewMode === 'sales_today') {
      return list.filter(b => b.createdAt.split('T')[0] === todayStr);
    }
    if (viewMode === 'visit_today') {
      return list.filter(b => b.date === todayStr);
    }
    return list;
  }, [bookings, viewMode, todayStr]);

  const viewStats = useMemo(() => {
    return {
      totalRev: filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0),
      totalAdults: filteredBookings.reduce((sum, b) => sum + b.adults, 0),
      totalKids: filteredBookings.reduce((sum, b) => sum + b.kids, 0),
      totalTickets: filteredBookings.length
    };
  }, [filteredBookings]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12 animate-fade flex flex-col items-center w-full">
      {/* Dashboard Header - CENTERED */}
      <div className="w-full blue-gradient text-white p-14 md:p-24 rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(27,37,89,0.3)] relative overflow-hidden border-8 border-white flex flex-col items-center text-center">
        <div className="relative z-10 flex flex-col items-center gap-12 w-full">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.8)]"></span>
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white/60 text-center">Terminal Status: Online</p>
            </div>
            <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none mb-14 text-center">
              Management
            </h2>
            
            <div className="bg-white/10 px-24 py-14 rounded-[4rem] border border-white/20 backdrop-blur-3xl shadow-3xl flex flex-col items-center text-center">
                <p className="text-blue-200 font-bold text-xs uppercase tracking-[0.5em] mb-6 text-center">Total Daily Revenue</p>
                <p className="text-white text-8xl md:text-9xl font-black tracking-tighter leading-none text-center">₹{viewStats.totalRev.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex bg-white/5 p-3 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-inner flex-wrap justify-center gap-2">
            <button onClick={() => setViewMode('sales_today')} className={`px-12 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center ${viewMode === 'sales_today' ? 'bg-white text-[#1B2559] shadow-2xl scale-[1.05]' : 'text-white/40 hover:text-white'}`}>Today's Sales</button>
            <button onClick={() => setViewMode('visit_today')} className={`px-12 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center ${viewMode === 'visit_today' ? 'bg-white text-[#1B2559] shadow-2xl scale-[1.05]' : 'text-white/40 hover:text-white'}`}>Today's Visits</button>
          </div>
        </div>
        <i className="fas fa-water absolute -right-32 -bottom-32 text-white/5 text-[40rem] -rotate-12"></i>
      </div>

      {/* METRICS GRID - CENTERED */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col items-center text-center transition-transform hover:-translate-y-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Total Orders</p>
          <h3 className="text-6xl md:text-7xl font-black text-[#1B2559] tracking-tighter text-center">{viewStats.totalTickets}</h3>
        </div>
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col items-center text-center transition-transform hover:-translate-y-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Adults Manifest</p>
          <h3 className="text-6xl md:text-7xl font-black text-[#1B2559] tracking-tighter text-center">{viewStats.totalAdults}</h3>
        </div>
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col items-center text-center transition-transform hover:-translate-y-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Kids Manifest</p>
          <h3 className="text-6xl md:text-7xl font-black text-[#1B2559] tracking-tighter text-center">{viewStats.totalKids}</h3>
        </div>
        <div className="bg-[#1B2559] p-12 rounded-[4rem] text-white shadow-3xl flex flex-col items-center text-center transition-transform hover:-translate-y-2">
          <p className="text-[11px] font-black uppercase opacity-40 tracking-widest mb-4 text-center">Last Sync</p>
          <h3 className="text-3xl font-black tracking-tight text-center">{lastUpdated}</h3>
        </div>
      </div>

      {/* LEDGER TABLE - CENTERED CONTENT */}
      <div className="w-full bg-white rounded-[5rem] card-shadow overflow-hidden border border-slate-100 mb-20">
        <div className="p-10 md:p-20 flex flex-col items-center">
          <div className="overflow-x-auto rounded-[3rem] border border-slate-50 w-full">
            <table className="w-full text-center border-collapse">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] font-black uppercase text-slate-500 tracking-[0.5em] border-b border-slate-100">
                  <th className="py-10 px-8 text-center">Pass Identity</th>
                  <th className="py-10 px-8 text-center">Guest Identity</th>
                  <th className="py-10 px-8 text-center">Schedule</th>
                  <th className="py-10 px-8 text-center">Occupancy</th>
                  <th className="py-10 px-8 text-center">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan={5} className="py-56 text-center text-slate-300 font-black uppercase text-[15px] tracking-[0.6em]">No transaction records found</td></tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.id} className="hover:bg-blue-50/40 transition-all group">
                      <td className="py-10 px-8 text-center">
                        <div className="text-[10px] font-black text-blue-600 mb-2 text-center">{new Date(b.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="font-black text-slate-400 text-2xl tracking-tighter uppercase text-center">{b.id}</div>
                      </td>
                      <td className="py-10 px-8 text-center">
                         <div className="font-black text-[#1B2559] text-2xl uppercase tracking-tighter mb-1 text-center">{b.name}</div>
                         <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{b.mobile}</div>
                      </td>
                      <td className="py-10 px-8 text-center">
                         <div className="text-lg font-black text-[#1B2559] uppercase tracking-widest text-center">{b.date}</div>
                         <div className="text-[10px] text-slate-400 font-black uppercase mt-1 px-4 py-1.5 bg-slate-50 rounded-lg inline-block text-center">{b.time.split(': ')[0]}</div>
                      </td>
                      <td className="py-10 px-8 text-center">
                         <div className="flex items-center justify-center gap-4">
                            <span className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-[11px] font-black border border-indigo-100 text-center">A: {b.adults}</span>
                            <span className="px-6 py-3 bg-orange-50 text-orange-700 rounded-2xl text-[11px] font-black border border-orange-100 text-center">K: {b.kids}</span>
                         </div>
                      </td>
                      <td className="py-10 px-8 text-center">
                         <div className="text-4xl md:text-5xl font-black text-[#1B2559] tracking-tighter text-center">₹{b.totalAmount}</div>
                         <div className="text-[10px] font-black text-emerald-500 uppercase mt-3 tracking-[0.4em] text-center">Verified</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
