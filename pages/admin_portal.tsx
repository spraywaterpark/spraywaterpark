import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { MASTER_SYNC_ID } from '../constants';

interface AdminPanelProps {
  bookings: Booking[];
  settings: AdminSettings;
  onUpdateSettings: (s: AdminSettings) => void;
  syncId: string | null;
  onSyncSetup: (id: string) => void;
}

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings, syncId, onSyncSetup }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'sync'>('bookings');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [changed, setChanged] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [inputSyncId, setInputSyncId] = useState('');

  useEffect(() => { setDraft(settings); }, [settings]);

  const stats = useMemo(() => ({
    revenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    guests: bookings.reduce((sum, b) => sum + b.adults + b.kids, 0),
    count: bookings.length
  }), [bookings]);

  const filtered = bookings.filter(b => b.date === filterDate);
  
  const handleUpdate = (field: keyof AdminSettings, value: any) => {
    setDraft({ ...draft, [field]: value });
    setChanged(true);
  };

  const save = () => {
    onUpdateSettings(draft);
    setChanged(false);
    alert("Global Settings updated successfully!");
  };

  const resetToMaster = () => {
    onSyncSetup(MASTER_SYNC_ID);
    alert("Connected to Official Spray Aqua Database.");
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 animate-fade space-y-10">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Revenue</p>
          <h3 className="text-3xl font-black text-[#1B2559]">₹{stats.revenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Guests</p>
          <h3 className="text-3xl font-black text-[#1B2559]">{stats.guests}</h3>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Bookings</p>
          <h3 className="text-3xl font-black text-[#1B2559]">{stats.count}</h3>
        </div>
        <div className="bg-emerald-600 p-7 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 flex flex-col justify-between">
          <div className="flex justify-between items-center">
             <p className="text-[11px] font-black uppercase opacity-70 tracking-[0.2em]">Live Database</p>
             <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          </div>
          <h3 className="text-lg font-black uppercase tracking-tighter">Global Monitoring</h3>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] card-premium overflow-hidden shadow-xl border-slate-200">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
          <button onClick={() => setActiveTab('bookings')} className={`px-12 py-7 font-black text-xs uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeTab === 'bookings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Live Bookings
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-12 py-7 font-black text-xs uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeTab === 'settings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Rate Controls
          </button>
          <button onClick={() => setActiveTab('sync')} className={`px-12 py-7 font-black text-xs uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeTab === 'sync' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Database Setup
          </button>
        </div>

        <div className="p-8 md:p-14">
          {activeTab === 'bookings' && (
            <div className="space-y-10 animate-fade">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6 bg-blue-50 p-5 rounded-2xl w-fit border border-blue-100">
                  <label className="text-[11px] font-black text-blue-800 uppercase tracking-widest">Select Date:</label>
                  <input type="date" className="input-premium py-2 px-4 text-sm font-bold bg-white max-w-[200px]" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <i className="fas fa-satellite animate-pulse text-emerald-600"></i>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Global Sync Active: {filtered.length} entries today</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-black uppercase text-slate-800 border-b-2 border-slate-200">
                      <th className="pb-8 px-6">Guest Name</th>
                      <th className="pb-8 px-6">Slot</th>
                      <th className="pb-8 px-6">Occupancy</th>
                      <th className="pb-8 px-6">Total Paid</th>
                      <th className="pb-8 px-6">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center text-slate-500 font-black uppercase text-xs tracking-[0.3em]">Waiting for new bookings...</td></tr>
                    ) : (
                      filtered.map(b => (
                        <tr key={b.id} className="hover:bg-blue-50 transition-colors group">
                          <td className="py-8 px-6">
                            <div>
                              <div className="font-black text-[#1B2559] text-base group-hover:text-blue-700">{b.name}</div>
                              <div className="text-[11px] text-slate-600 font-black uppercase mt-1">{b.mobile}</div>
                            </div>
                          </td>
                          <td className="py-8 px-6">
                            <div className="text-sm font-black text-slate-800">{b.time.split(' - ')[0]}</div>
                            <div className="text-[11px] font-black text-blue-600 uppercase mt-1 tracking-wider">{b.time.split(' - ')[1]}</div>
                          </td>
                          <td className="py-8 px-6">
                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">A: {b.adults} | C: {b.kids}</span>
                          </td>
                          <td className="py-8 px-6 font-black text-blue-700 text-lg">₹{b.totalAmount}</td>
                          <td className="py-8 px-6">
                            <span className="px-5 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">Verified Live</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-12 animate-fade max-w-3xl mx-auto py-10">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-emerald-100">
                <i className="fas fa-globe-americas animate-spin-slow"></i>
              </div>
              
              <div className="text-center">
                <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Resort Cloud Bridge</h3>
                <p className="text-slate-600 font-bold text-sm mt-4 leading-relaxed">
                  Aapka system ab <b>"Global Master ID"</b> par set hai. Iska matlab Jaipur se bahar baitha koi bhi guest agar booking karega, to uska data instant aapke paas yahan list ho jayega.
                </p>
              </div>

              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 text-center space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Resort Connection</p>
                  <p className="text-3xl font-black text-[#1B2559] tracking-tight">{syncId}</p>
                  <button onClick={resetToMaster} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline mt-4">Refresh Global Link</button>
              </div>

              <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl">
                  <div>
                      <h4 className="font-black uppercase text-xs tracking-widest">Instant Push Notification</h4>
                      <p className="text-[10px] font-bold opacity-70 mt-1 uppercase">Any device, anywhere, one database.</p>
                  </div>
                  <i className="fas fa-check-circle text-3xl"></i>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-14 animate-fade max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                <div className="space-y-10">
                  <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-[0.3em] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fas fa-tags"></i></div>
                    Ticket Prices
                  </h4>
                  <div className="grid grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Morn. Adult</label>
                      <input type="number" className="input-premium" value={draft.morningAdultRate} onChange={e => handleUpdate('morningAdultRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Morn. Child</label>
                      <input type="number" className="input-premium" value={draft.morningKidRate} onChange={e => handleUpdate('morningKidRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Eve. Adult</label>
                      <input type="number" className="input-premium" value={draft.eveningAdultRate} onChange={e => handleUpdate('eveningAdultRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Eve. Child</label>
                      <input type="number" className="input-premium" value={draft.eveningKidRate} onChange={e => handleUpdate('eveningKidRate', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
                <div className="space-y-10">
                  <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-[0.3em] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><i className="fas fa-bolt"></i></div>
                    Discounts
                  </h4>
                  <div className="grid grid-cols-1 gap-8 bg-emerald-50/50 p-10 rounded-[2.5rem] border border-emerald-100">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Early Bird (0-100) %</label>
                      <input type="number" className="input-premium bg-white" value={draft.earlyBirdDiscount} onChange={e => handleUpdate('earlyBirdDiscount', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Tier 2 (101-200) %</label>
                      <input type="number" className="input-premium bg-white" value={draft.extraDiscountPercent} onChange={e => handleUpdate('extraDiscountPercent', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={save} 
                  disabled={!changed}
                  className="btn-luxury px-20 py-6 text-xl shadow-2xl disabled:opacity-40 uppercase tracking-widest"
                >
                  Confirm All Rates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
