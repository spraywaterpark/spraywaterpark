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
  // Changed default view mode to 'sales_today' as per user request
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [changed, setChanged] = useState(false);
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
      // Filter by CREATION DATE (Aaj kitne logo ne booking kari)
      return list.filter(b => b.createdAt.split('T')[0] === todayStr);
    }
    if (viewMode === 'visit_today') {
      // Filter by VISIT DATE (Aaj kitne log aayenge)
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
    setChanged(true);
  };

  const manualRefresh = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 800));
    window.location.reload(); 
    setIsSyncing(false);
  };

  const reLinkCloud = async () => {
    setIsSyncing(true);
    const newId = await cloudSync.createRoom(bookings);
    if (newId) onSyncSetup(newId);
    setIsSyncing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 animate-fade">
      {/* Live Sales Dashboard Header */}
      <div className="bg-[#1B2559] text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border-4 border-white">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Live Sales Terminal</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              {viewMode === 'sales_today' ? "Today's New Bookings" : "Daily Activity"}
            </h2>
            <p className="text-blue-300 font-bold text-sm mt-3 uppercase tracking-widest">
              Total Sales Done Today: <span className="text-white text-lg ml-2">₹{viewStats.totalRev.toLocaleString()}</span>
            </p>
          </div>
          
          <div className="flex bg-white/10 p-2 rounded-2xl backdrop-blur-xl border border-white/10">
            <button 
              onClick={() => setViewMode('sales_today')} 
              className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'sales_today' ? 'bg-white text-blue-900 shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
              Aaj ki Booking
            </button>
            <button 
              onClick={() => setViewMode('visit_today')} 
              className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'visit_today' ? 'bg-white text-blue-900 shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
              Aaj ke Guests
            </button>
          </div>
        </div>
        <i className="fas fa-chart-line absolute -right-10 -bottom-10 text-white/5 text-[15rem] rotate-12"></i>
      </div>

      {/* Real-time Counter Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bookings Count</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-[#1B2559]">{viewStats.totalTickets}</h3>
            <span className="text-emerald-500 text-xs font-black mb-1 uppercase tracking-tighter">Done</span>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Adults Booked</p>
          <h3 className="text-4xl font-black text-[#1B2559]">{viewStats.totalAdults}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Kids Booked</p>
          <h3 className="text-4xl font-black text-[#1B2559]">{viewStats.totalKids}</h3>
        </div>

        <div className="blue-gradient p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Last Update At</p>
          <h3 className="text-2xl font-black">{lastUpdated}</h3>
          <button onClick={manualRefresh} className="mt-2 text-[9px] font-black uppercase tracking-widest text-blue-200 hover:text-white flex items-center gap-2">
            <i className="fas fa-sync-alt text-[8px]"></i> Refresh Now
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-200 shadow-xl">
        <div className="p-6 md:p-10">
          <div className="space-y-8 animate-fade">
              {/* Detailed Live Table */}
              <div className="overflow-x-auto rounded-[2rem] border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr className="text-[10px] font-black uppercase text-slate-800 tracking-[0.2em] border-b border-slate-200">
                      <th className="py-6 px-8">Booking Time / ID</th>
                      <th className="py-6 px-8">Customer Name</th>
                      <th className="py-6 px-8">Mobile</th>
                      <th className="py-6 px-8">Visiting Date</th>
                      <th className="py-6 px-8 text-center">Tickets</th>
                      <th className="py-6 px-8 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={6} className="py-32 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.4em]">No sales recorded yet for today</td></tr>
                    ) : (
                      filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-blue-50/30 transition-all group">
                          <td className="py-6 px-8">
                            <div className="text-[10px] font-black text-blue-600 mb-1">
                                {new Date(b.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            <div className="font-black text-slate-400 text-xs tracking-tighter uppercase">{b.id}</div>
                          </td>
                          <td className="py-6 px-8">
                             <div className="font-black text-[#1B2559] text-lg uppercase tracking-tight">{b.name}</div>
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Customer</div>
                          </td>
                          <td className="py-6 px-8">
                             <div className="text-sm font-bold text-slate-600">{b.mobile}</div>
                          </td>
                          <td className="py-6 px-8">
                             <div className="text-xs font-black text-blue-700 uppercase tracking-widest">{b.date}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase">{b.time.split(' - ')[1]}</div>
                          </td>
                          <td className="py-6 px-8 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-100">A: {b.adults}</span>
                                <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-black border border-orange-100">K: {b.kids}</span>
                             </div>
                          </td>
                          <td className="py-6 px-8 text-right">
                             <div className="text-2xl font-black text-[#1B2559]">₹{b.totalAmount}</div>
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-100 mt-1">
                                PAID
                             </span>
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

      {/* Tabs for Other Actions (Settings/Sync) */}
      <div className="flex justify-center gap-4 no-print">
          <button onClick={() => setActiveTab('settings')} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600">
            System Rates
          </button>
          <button onClick={() => setActiveTab('sync')} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600">
            Cloud Sync ID
          </button>
      </div>

      {/* Modal Views for Settings/Sync */}
      {activeTab !== 'bookings' && (
        <div className="fixed inset-0 z-[500] bg-[#1B2559]/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 animate-fade max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-[#1B2559] uppercase tracking-tighter">System {activeTab}</h3>
                    <button onClick={() => setActiveTab('bookings')} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                {activeTab === 'settings' && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Morn Adult</label>
                                <input type="number" className="input-luxury !py-3" value={draft.morningAdultRate} onChange={e => handleUpdate('morningAdultRate', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Morn Kid</label>
                                <input type="number" className="input-luxury !py-3" value={draft.morningKidRate} onChange={e => handleUpdate('morningKidRate', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Eve Adult</label>
                                <input type="number" className="input-luxury !py-3" value={draft.eveningAdultRate} onChange={e => handleUpdate('eveningAdultRate', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Eve Kid</label>
                                <input type="number" className="input-luxury !py-3" value={draft.eveningKidRate} onChange={e => handleUpdate('eveningKidRate', Number(e.target.value))} />
                            </div>
                        </div>
                        <button onClick={() => { onUpdateSettings(draft); setActiveTab('bookings'); }} className="btn-premium w-full py-6">Save & Deploy Changes</button>
                    </div>
                )}

                {activeTab === 'sync' && (
                    <div className="text-center space-y-8 py-10">
                        <p className="text-sm font-bold text-slate-500">Connect other devices using this Master ID:</p>
                        <p className="text-3xl font-mono font-black text-blue-700 bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 select-all">{syncId}</p>
                        <button onClick={reLinkCloud} className="btn-premium py-5 px-10 mx-auto">Generate New Cloud Key</button>
                    </div>
                )}
            </div>
        </div>
      )}
      
      <div className="text-center py-6 no-print opacity-30">
         <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em]">Spray Aqua Resort • Sales Terminal</p>
      </div>
    </div>
  );
};

export default AdminPortal;
