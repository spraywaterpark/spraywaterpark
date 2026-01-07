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

  const handleUpdate = (field: keyof AdminSettings, value: any) => {
    setDraft({ ...draft, [field]: value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 animate-fade">
      {/* 1:30 PM Live Terminal Header */}
      <div className="blue-gradient text-white p-10 md:p-16 rounded-[4rem] shadow-3xl relative overflow-hidden border-8 border-white">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <span className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]"></span>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-70">Terminal: Active</p>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
              Sales Dashboard
            </h2>
            <p className="text-blue-200 font-bold text-lg mt-5 uppercase tracking-widest flex items-center justify-center md:justify-start gap-3">
              Daily Revenue: <span className="text-white text-3xl font-black">₹{viewStats.totalRev.toLocaleString()}</span>
            </p>
          </div>
          
          <div className="flex bg-white/10 p-2 rounded-3xl backdrop-blur-2xl border border-white/20">
            <button 
              onClick={() => setViewMode('sales_today')} 
              className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'sales_today' ? 'bg-white text-[#1B2559] shadow-2xl' : 'text-white/60 hover:text-white'}`}
            >
              Today's Sales
            </button>
            <button 
              onClick={() => setViewMode('visit_today')} 
              className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'visit_today' ? 'bg-white text-[#1B2559] shadow-2xl' : 'text-white/60 hover:text-white'}`}
            >
              Today's Guests
            </button>
          </div>
        </div>
        <i className="fas fa-water absolute -right-20 -bottom-20 text-white/5 text-[25rem] -rotate-12"></i>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Total Tickets</p>
          <h3 className="text-5xl font-black text-[#1B2559] tracking-tighter">{viewStats.totalTickets}</h3>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Adult Count</p>
          <h3 className="text-5xl font-black text-[#1B2559] tracking-tighter">{viewStats.totalAdults}</h3>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Kid Count</p>
          <h3 className="text-5xl font-black text-[#1B2559] tracking-tighter">{viewStats.totalKids}</h3>
        </div>
        <div className="bg-[#1B2559] p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-center">
          <p className="text-[11px] font-black uppercase opacity-60 tracking-[0.3em] mb-3">System Updated</p>
          <h3 className="text-2xl font-black tracking-tight">{lastUpdated}</h3>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[4rem] overflow-hidden border border-slate-100 shadow-2xl">
        <div className="p-10 md:p-14">
          <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] font-black uppercase text-slate-800 tracking-[0.3em] border-b border-slate-100">
                  <th className="py-8 px-10">Time / Pass</th>
                  <th className="py-8 px-10">Guest Details</th>
                  <th className="py-8 px-10">Visit Date</th>
                  <th className="py-8 px-10 text-center">Occupancy</th>
                  <th className="py-8 px-10 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan={5} className="py-40 text-center text-slate-300 font-black uppercase text-[12px] tracking-[0.5em]">No activity to report</td></tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.id} className="hover:bg-blue-50/40 transition-all">
                      <td className="py-8 px-10">
                        <div className="text-[11px] font-black text-blue-600 mb-2">
                            {new Date(b.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="font-black text-slate-400 text-sm tracking-tight uppercase">{b.id}</div>
                      </td>
                      <td className="py-8 px-10">
                         <div className="font-black text-[#1B2559] text-xl uppercase tracking-tighter mb-1">{b.name}</div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.mobile}</div>
                      </td>
                      <td className="py-8 px-10">
                         <div className="text-sm font-black text-blue-700 uppercase tracking-widest">{b.date}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{b.time}</div>
                      </td>
                      <td className="py-8 px-10 text-center">
                         <div className="flex items-center justify-center gap-3">
                            <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black border border-indigo-100">A: {b.adults}</span>
                            <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black border border-orange-100">K: {b.kids}</span>
                         </div>
                      </td>
                      <td className="py-8 px-10 text-right">
                         <div className="text-3xl font-black text-[#1B2559]">₹{b.totalAmount}</div>
                         <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase mt-2">COLLECTED</div>
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
