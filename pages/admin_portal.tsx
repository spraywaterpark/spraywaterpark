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

  const stats = useMemo(() => {
    const todayList = bookings.filter(b => b.date === todayStr);
    return {
      todayRev: todayList.reduce((sum, b) => sum + b.totalAmount, 0),
      todayGuests: todayList.reduce((sum, b) => sum + b.adults + b.kids, 0),
      todayCount: todayList.length
    };
  }, [bookings, todayStr]);

  const handleUpdate = (field: keyof AdminSettings, value: any) => {
    setDraft({ ...draft, [field]: value });
    setChanged(true);
  };

  const reLinkCloud = async () => {
    setIsSyncing(true);
    const newId = await cloudSync.createRoom(bookings);
    if (newId) onSyncSetup(newId);
    else alert("Failed to initialize cloud. Please check connection.");
    setIsSyncing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 animate-fade">
      {/* Premium Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium p-8 shadow-xl shadow-blue-900/5 bg-white border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Today's Revenue</p>
          <h3 className="text-3xl font-black text-[#1B2559]">₹{stats.todayRev.toLocaleString()}</h3>
        </div>
        <div className="card-premium p-8 shadow-xl shadow-blue-900/5 bg-white border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Expected Guests</p>
          <h3 className="text-3xl font-black text-[#1B2559]">{stats.todayGuests}</h3>
        </div>
        <div className="card-premium p-8 shadow-xl shadow-blue-900/5 bg-white border-slate-200 border-l-4 border-blue-600">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tickets Sold</p>
          <h3 className="text-3xl font-black text-[#1B2559]">{stats.todayCount}</h3>
        </div>
        <div className="blue-gradient p-8 rounded-[24px] text-white shadow-2xl flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-2">Live Monitor</p>
            <h3 className="text-xl font-black uppercase tracking-tighter">Syncing Active</h3>
          </div>
          <div className="w-4 h-4 bg-emerald-400 rounded-full animate-ping relative z-10"></div>
          <i className="fas fa-water absolute -right-4 -bottom-4 text-white/10 text-7xl"></i>
        </div>
      </div>

      <div className="card-premium overflow-hidden shadow-2xl bg-white border-slate-200 min-h-[600px]">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button onClick={() => setActiveTab('bookings')} className={`px-12 py-7 font-black text-[11px] uppercase tracking-[0.2em] transition-all ${activeTab === 'bookings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-400'}`}>
            <i className="fas fa-users-cog mr-2"></i> Bookings
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-12 py-7 font-black text-[11px] uppercase tracking-[0.2em] transition-all ${activeTab === 'settings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-400'}`}>
            <i className="fas fa-sliders-h mr-2"></i> Rates
          </button>
          <button onClick={() => setActiveTab('sync')} className={`px-12 py-7 font-black text-[11px] uppercase tracking-[0.2em] transition-all ${activeTab === 'sync' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-400'}`}>
            <i className="fas fa-cloud mr-2"></i> Cloud Sync
          </button>
        </div>

        <div className="p-8 md:p-12">
          {activeTab === 'bookings' && (
            <div className="space-y-8">
              {/* Filter Controls */}
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50 p-6 rounded-[24px] border border-slate-200">
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                  <button onClick={() => setViewMode('today')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'today' ? 'bg-[#1B2559] text-white' : 'text-slate-400 hover:text-slate-600'}`}>Today</button>
                  <button onClick={() => setViewMode('date')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'date' ? 'bg-[#1B2559] text-white' : 'text-slate-400 hover:text-slate-600'}`}>Pick Date</button>
                  <button onClick={() => setViewMode('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-[#1B2559] text-white' : 'text-slate-400 hover:text-slate-600'}`}>Show All</button>
                </div>

                {viewMode === 'date' && (
                  <div className="flex items-center gap-4 animate-fade-in">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target:</span>
                    <input type="date" className="input-premium py-2 px-6 text-sm bg-white" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                  </div>
                )}
                
                <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-200">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Watching Live</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-[20px] border border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-5 px-8">Guest Name</th>
                      <th className="py-5 px-8">Session</th>
                      <th className="py-5 px-8">Visit Date</th>
                      <th className="py-5 px-8">Occupancy</th>
                      <th className="py-5 px-8">Net Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-32 text-center">
                          <i className="fas fa-search text-5xl text-slate-100 mb-4 block"></i>
                          <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No bookings found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-blue-50/30 transition-all group">
                          <td className="py-8 px-8">
                            <div className="font-black text-[#1B2559] text-base">{b.name}</div>
                            <div className="text-[11px] text-slate-400 font-bold mt-0.5">{b.mobile}</div>
                          </td>
                          <td className="py-8 px-8">
                            <div className="text-xs font-black text-slate-800 uppercase">{b.time.split(' - ')[1]}</div>
                            <div className="text-[10px] font-bold text-blue-500 mt-0.5">{b.time.split(' - ')[0]}</div>
                          </td>
                          <td className="py-8 px-8">
                             <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${b.date === todayStr ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                                {b.date === todayStr ? 'Today' : b.date}
                             </span>
                          </td>
                          <td className="py-8 px-8 text-xs font-black text-slate-600 uppercase">
                             A: {b.adults} | K: {b.kids}
                          </td>
                          <td className="py-8 px-8">
                             <div className="text-xl font-black text-[#1B2559]">₹{b.totalAmount}</div>
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <i className="fas fa-check-circle"></i> Confirmed
                             </span>
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-8 rounded-[24px] border border-slate-200 space-y-8">
                    <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-widest flex items-center gap-3">
                      <i className="fas fa-coins text-blue-600"></i> Admission Rates
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morn. Adult</label>
                        <input type="number" className="input-premium bg-white py-3" value={draft.morningAdultRate} onChange={e => handleUpdate('morningAdultRate', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morn. Kid</label>
                        <input type="number" className="input-premium bg-white py-3" value={draft.morningKidRate} onChange={e => handleUpdate('morningKidRate', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eve. Adult</label>
                        <input type="number" className="input-premium bg-white py-3" value={draft.eveningAdultRate} onChange={e => handleUpdate('eveningAdultRate', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eve. Kid</label>
                        <input type="number" className="input-premium bg-white py-3" value={draft.eveningKidRate} onChange={e => handleUpdate('eveningKidRate', Number(e.target.value))} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-8 rounded-[24px] border border-blue-100 space-y-8">
                    <h4 className="font-black text-sm text-blue-800 uppercase tracking-widest flex items-center gap-3">
                      <i className="fas fa-percentage"></i> Auto Discounts
                    </h4>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tier 1: 0-100 Guests (%)</label>
                          <input type="number" className="input-premium bg-white py-3" value={draft.earlyBirdDiscount} onChange={e => handleUpdate('earlyBirdDiscount', Number(e.target.value))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tier 2: 101-200 Guests (%)</label>
                          <input type="number" className="input-premium bg-white py-3" value={draft.extraDiscountPercent} onChange={e => handleUpdate('extraDiscountPercent', Number(e.target.value))} />
                       </div>
                    </div>
                  </div>
               </div>

               <div className="flex justify-end pt-8 border-t border-slate-100">
                  <button onClick={() => { onUpdateSettings(draft); setChanged(false); alert("Settings Applied!"); }} disabled={!changed} className="btn-luxury px-16 py-5 text-lg shadow-xl disabled:opacity-30 uppercase tracking-widest">
                    Update System
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'sync' && (
             <div className="max-w-xl mx-auto py-12 text-center space-y-10">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-blue-100">
                  <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Database Management</h3>
                <p className="text-slate-500 font-bold text-sm leading-relaxed">
                  Every booking is synced across all devices using your Master Key. If you encounter "Failed to fetch", the cloud resource might have expired. Create a new one below.
                </p>

                <div className="bg-slate-50 p-8 rounded-[24px] border border-slate-200 space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Sync ID</p>
                   <p className="text-2xl font-black text-[#1B2559] break-all select-all font-mono">{syncId || "NOT_SET"}</p>
                   
                   <div className="pt-6">
                     <button 
                       onClick={reLinkCloud} 
                       disabled={isSyncing}
                       className="bg-[#1B2559] text-white px-12 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                     >
                       {isSyncing ? "Creating Link..." : "Generate New Cloud Link"}
                     </button>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
