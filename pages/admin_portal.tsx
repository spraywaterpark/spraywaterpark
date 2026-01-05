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
  const [viewMode, setViewMode] = useState<'today' | 'date' | 'all'>('today');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [changed, setChanged] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { setDraft(settings); }, [settings]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    let list = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (viewMode === 'today') return list.filter(b => b.date === todayStr);
    if (viewMode === 'date') return list.filter(b => b.date === filterDate);
    return list;
  }, [bookings, viewMode, filterDate, todayStr]);

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
    setChanged(true);
  };

  const reLinkCloud = async () => {
    setIsSyncing(true);
    const newId = await cloudSync.createRoom(bookings);
    if (newId) onSyncSetup(newId);
    setIsSyncing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 animate-fade">
      {/* Dashboard Metrics - Today Focus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Collection</p>
            <i className="fas fa-wallet text-blue-500"></i>
          </div>
          <h3 className="text-3xl font-black text-[#1B2559]">₹{viewStats.totalRev.toLocaleString()}</h3>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Based on current filter</p>
        </div>
        
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adult Guests</p>
            <i className="fas fa-users text-indigo-500"></i>
          </div>
          <h3 className="text-3xl font-black text-[#1B2559]">{viewStats.totalAdults}</h3>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Headcount Total</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kid Guests</p>
            <i className="fas fa-child text-orange-500"></i>
          </div>
          <h3 className="text-3xl font-black text-[#1B2559]">{viewStats.totalKids}</h3>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Half-ticket Count</p>
        </div>

        <div className="blue-gradient p-8 rounded-[32px] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Shift Tickets</p>
            <h3 className="text-3xl font-black">{viewStats.totalTickets}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="text-[9px] font-black uppercase tracking-widest">Live Terminal</span>
            </div>
          </div>
          <i className="fas fa-ticket-alt absolute -right-6 -bottom-6 text-white/10 text-8xl rotate-12"></i>
        </div>
      </div>

      <div className="bg-white rounded-[40px] overflow-hidden border border-slate-200 shadow-2xl">
        {/* Navigation */}
        <div className="flex bg-slate-50 border-b border-slate-200 no-print">
          <button onClick={() => setActiveTab('bookings')} className={`px-10 py-7 font-black text-[11px] uppercase tracking-[0.3em] transition-all ${activeTab === 'bookings' ? 'text-blue-700 border-b-4 border-blue-700 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <i className="fas fa-list-ul mr-2"></i> Bookings
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-10 py-7 font-black text-[11px] uppercase tracking-[0.3em] transition-all ${activeTab === 'settings' ? 'text-blue-700 border-b-4 border-blue-700 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <i className="fas fa-cog mr-2"></i> Rates
          </button>
          <button onClick={() => setActiveTab('sync')} className={`px-10 py-7 font-black text-[11px] uppercase tracking-[0.3em] transition-all ${activeTab === 'sync' ? 'text-blue-700 border-b-4 border-blue-700 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <i className="fas fa-cloud mr-2"></i> Cloud
          </button>
        </div>

        <div className="p-8 md:p-12">
          {activeTab === 'bookings' && (
            <div className="space-y-8 animate-fade">
              {/* Controls */}
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 no-print">
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                  <button onClick={() => setViewMode('today')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'today' ? 'bg-[#1B2559] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Today</button>
                  <button onClick={() => setViewMode('date')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'date' ? 'bg-[#1B2559] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>By Date</button>
                  <button onClick={() => setViewMode('all')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-[#1B2559] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>All History</button>
                </div>
                
                {viewMode === 'date' && (
                   <input type="date" className="input-luxury w-auto !py-2 !px-6" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                )}

                <div className="flex gap-4">
                  <button onClick={() => window.print()} className="bg-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 border border-slate-300 hover:bg-slate-50">
                    <i className="fas fa-print mr-2"></i> Export List
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto rounded-[24px] border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-black uppercase text-slate-800 tracking-[0.2em] border-b border-slate-200">
                      <th className="py-6 px-8">ID / Guest</th>
                      <th className="py-6 px-8">Session Details</th>
                      <th className="py-6 px-8 text-center">Heads (A/K)</th>
                      <th className="py-6 px-8">Payment</th>
                      <th className="py-6 px-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">No records found for selection</td></tr>
                    ) : (
                      filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="py-8 px-8">
                            <div className="text-[10px] font-black text-blue-600 mb-1">{b.id}</div>
                            <div className="font-black text-[#1B2559] text-lg uppercase tracking-tight">{b.name}</div>
                            <div className="text-slate-400 font-bold text-xs">{b.mobile}</div>
                          </td>
                          <td className="py-8 px-8">
                             <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-md mb-2 border border-slate-200">
                                <i className="far fa-calendar-alt text-[10px] text-slate-500"></i>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{b.date}</span>
                             </div>
                             <div className="text-xs font-black text-blue-700 uppercase tracking-widest">{b.time.split(' - ')[1]}</div>
                             <div className="text-[10px] text-slate-400 font-medium">{b.time.split(' - ')[0]}</div>
                          </td>
                          <td className="py-8 px-8 text-center">
                             <div className="flex items-center justify-center gap-3">
                                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100">
                                   <p className="text-[8px] font-black uppercase leading-none opacity-60">Adults</p>
                                   <p className="text-lg font-black">{b.adults}</p>
                                </div>
                                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-100">
                                   <p className="text-[8px] font-black uppercase leading-none opacity-60">Kids</p>
                                   <p className="text-lg font-black">{b.kids}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-8 px-8">
                             <div className="text-2xl font-black text-[#1B2559]">₹{b.totalAmount}</div>
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100 mt-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Confirmed
                             </span>
                          </td>
                          <td className="py-8 px-8 text-right no-print">
                             <button className="text-slate-300 hover:text-blue-600 transition-colors">
                                <i className="fas fa-ellipsis-h"></i>
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-fade">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                    <h4 className="font-black text-xs text-[#1B2559] uppercase tracking-[0.3em] flex items-center gap-3">
                       <i className="fas fa-money-bill-wave text-emerald-600"></i> Pricing Engine
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Morn Adult</label>
                        <input type="number" className="input-luxury !py-3" value={draft.morningAdultRate} onChange={e => handleUpdate('morningAdultRate', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Morn Kid</label>
                        <input type="number" className="input-luxury !py-3" value={draft.morningKidRate} onChange={e => handleUpdate('morningKidRate', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Eve Adult</label>
                        <input type="number" className="input-luxury !py-3" value={draft.eveningAdultRate} onChange={e => handleUpdate('eveningAdultRate', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Eve Kid</label>
                        <input type="number" className="input-luxury !py-3" value={draft.eveningKidRate} onChange={e => handleUpdate('eveningKidRate', Number(e.target.value))} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/30 p-10 rounded-[40px] border border-blue-100 shadow-sm space-y-8">
                    <h4 className="font-black text-xs text-blue-800 uppercase tracking-[0.3em] flex items-center gap-3">
                       <i className="fas fa-bolt text-amber-500"></i> Smart Tier Benefits
                    </h4>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1">Early Bird Benefit (%)</label>
                          <input type="number" className="input-luxury border-blue-200 !py-3" value={draft.earlyBirdDiscount} onChange={e => handleUpdate('earlyBirdDiscount', Number(e.target.value))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1">Secondary Benefit (%)</label>
                          <input type="number" className="input-luxury border-blue-200 !py-3" value={draft.extraDiscountPercent} onChange={e => handleUpdate('extraDiscountPercent', Number(e.target.value))} />
                       </div>
                    </div>
                  </div>
               </div>
               <div className="flex justify-end pt-10 border-t border-slate-100">
                  <button onClick={() => { onUpdateSettings(draft); setChanged(false); alert("Settings successfully deployed."); }} disabled={!changed} className="btn-premium px-16 py-6 text-[12px] shadow-2xl disabled:opacity-30">
                    Deploy System Configuration
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'sync' && (
             <div className="max-w-xl mx-auto py-16 text-center space-y-10 animate-fade">
                <div className="w-20 h-20 blue-gradient text-white rounded-[24px] flex items-center justify-center text-3xl mx-auto shadow-xl border-4 border-white">
                  <i className="fas fa-network-wired"></i>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Bridge Terminal</h3>
                  <p className="text-slate-500 font-bold text-sm mt-3 leading-relaxed">Your unique Cloud Key allows real-time synchronization between entrance gates and staff tablets.</p>
                </div>
                <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-200 space-y-6">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Master Cloud Key</p>
                   <p className="text-xl font-mono font-black text-blue-800 break-all select-all bg-white p-6 rounded-2xl border border-slate-200 shadow-inner">{syncId || "OFFLINE_MODE"}</p>
                   <button onClick={reLinkCloud} disabled={isSyncing} className="btn-premium w-full mt-6 bg-[#1B2559] hover:bg-black text-[10px] tracking-[0.2em]">
                     {isSyncing ? "Initializing Tunnel..." : "Regenerate Cloud Access"}
                   </button>
                </div>
             </div>
          )}
        </div>
      </div>
      
      {/* Decorative Branding */}
      <div className="text-center py-10 no-print">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Admin Terminal • Spray Aqua Resort • Jaipur</p>
      </div>
    </div>
  );
};

export default AdminPortal;
