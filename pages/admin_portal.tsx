
import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings, BlockedSlot, ShiftType } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { TIME_SLOTS, MASTER_SYNC_ID } from '../constants';

interface AdminPanelProps {
  bookings: Booking[];
  settings: AdminSettings;
  onUpdateSettings: (s: AdminSettings) => void;
  syncId: string | null;
  onSyncSetup: (id: string) => void;
  onLogout: () => void;
}

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings, syncId, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const [blkDate, setBlkDate] = useState('');
  const [blkSlot, setBlkSlot] = useState(TIME_SLOTS[0]);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => setLastUpdated(new Date().toLocaleTimeString()), [bookings]);

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const todayLocale = today.toLocaleDateString("en-IN");

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (viewMode === 'sales_today') {
      return list.filter(b => b.createdAt.includes(todayLocale) || b.createdAt.startsWith(todayISO));
    }
    if (viewMode === 'visit_today') {
      return list.filter(b => b.date === todayISO);
    }
    return list;
  }, [bookings, viewMode, todayLocale, todayISO]);

  const stats = useMemo(() => ({
    revenue: filteredBookings.reduce((s, b) => s + b.totalAmount, 0),
    adults: filteredBookings.reduce((s, b) => s + b.adults, 0),
    kids: filteredBookings.reduce((s, b) => s + b.kids, 0),
    tickets: filteredBookings.length
  }), [filteredBookings]);

  const manualRefresh = async () => {
    setIsSyncing(true);
    try {
      await cloudSync.fetchData(syncId || MASTER_SYNC_ID);
      await cloudSync.fetchSettings();
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Manual refresh failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fixed shift property name and logic
  const addBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const currentShift = blkSlot.toLowerCase().includes('morning') ? 'morning' : 'evening';
    const newSlot: BlockedSlot = { date: blkDate, shift: currentShift as ShiftType };
    const currentBlocked = draft.blockedSlots || [];

    if (currentBlocked.some(s => s.date === blkDate && (s.shift === currentShift || s.shift === 'all'))) {
        return alert("This slot or full day is already blocked.");
    }
    setDraft({ ...draft, blockedSlots: [...currentBlocked, newSlot] });
  };

  // Fixed full day shift type
  const addFullDayBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const currentBlocked = draft.blockedSlots || [];
    const updatedSlots = currentBlocked.filter(s => s.date !== blkDate);
    setDraft({ ...draft, blockedSlots: [...updatedSlots, { date: blkDate, shift: 'all' }] });
  };

  const removeBlackout = (index: number) => {
    const updated = (draft.blockedSlots || []).filter((_, i) => i !== index);
    setDraft({ ...draft, blockedSlots: updated });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings(draft);
      setActiveTab('bookings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">
      {/* HEADER */}
      <div className="bg-[#1B2559] text-white p-6 sm:p-10 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-70 flex items-center gap-2">
            Live Sales Dashboard
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
          <h2 className="text-3xl sm:text-5xl font-black mt-2">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-blue-200 text-sm font-bold mt-1">{viewMode === 'sales_today' ? "Today's Revenue" : viewMode === 'visit_today' ? "Revenue for Visitors Today" : "Total Revenue"}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex gap-2">
            <button onClick={() => setViewMode('sales_today')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all ${viewMode==='sales_today' ? 'bg-white text-slate-900' : 'hover:bg-white/10'}`}>Today Sales</button>
            <button onClick={() => setViewMode('visit_today')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all ${viewMode==='visit_today' ? 'bg-white text-slate-900' : 'hover:bg-white/10'}`}>Today Visits</button>
            <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all ${viewMode==='all' ? 'bg-white text-slate-900' : 'hover:bg-white/10'}`}>All Data</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Tickets" value={stats.tickets} />
        <Stat label="Adults" value={stats.adults} />
        <Stat label="Kids" value={stats.kids} />
        <Stat label="Last Sync" value={lastUpdated} />
      </div>

      {/* BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-[900px] w-full text-center">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="p-5 text-left">Timestamp</th>
                <th>Guest Name</th>
                <th>Mobile</th>
                <th>Visit Date</th>
                <th>Passes</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-slate-300 font-bold uppercase text-xs tracking-widest">No matching records found</td></tr>
              ) : filteredBookings.map((b, i) => (
                <tr key={i} className="border-t hover:bg-slate-50 transition-colors text-sm">
                  <td className="p-5 text-left font-medium text-slate-400 text-[10px]">{b.createdAt}</td>
                  <td className="font-semibold">{b.name}</td>
                  <td className="font-medium text-slate-500">{b.mobile}</td>
                  <td className="font-bold text-blue-600">{b.date}</td>
                  <td>{b.adults + b.kids}</td>
                  <td className="font-black text-slate-900">₹{b.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={manualRefresh} disabled={isSyncing} className="btn-resort !px-8 h-14 !bg-slate-800 disabled:opacity-50">
           <i className={`fas fa-sync-alt mr-2 text-xs ${isSyncing ? 'fa-spin' : ''}`}></i> {isSyncing ? 'Refreshing...' : 'Refresh Cloud Data'}
        </button>
        <button onClick={() => setActiveTab('settings')} className="btn-resort !px-8 h-14">
           <i className="fas fa-cog mr-2 text-xs"></i> Rates & Blackout Dates
        </button>

        <button
  onClick={() => window.location.hash = '#/admin-lockers'}
  className="btn-resort !px-8 h-14 !bg-emerald-600 hover:!bg-emerald-700"
>
  <i className="fas fa-box mr-2 text-xs"></i>
  CO&LO LOGIN
</button>

      
      </div>

      {/* SETTINGS MODAL */}
      {activeTab === 'settings' && (
        <Modal title="Configure Resort" onClose={() => setActiveTab('bookings')}>
          <div className="space-y-8 max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
            {/* PRICING */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Ticket Rates (₹)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Morning Adult</label>
                  <input type="number" className="input-premium py-3" value={draft.morningAdultRate} onChange={e => setDraft({...draft, morningAdultRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Evening Adult</label>
                  <input type="number" className="input-premium py-3" value={draft.eveningAdultRate} onChange={e => setDraft({...draft, eveningAdultRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Morning Kid</label>
                  <input type="number" className="input-premium py-3" value={draft.morningKidRate} onChange={e => setDraft({...draft, morningKidRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Evening Kid</label>
                  <input type="number" className="input-premium py-3" value={draft.eveningKidRate} onChange={e => setDraft({...draft, eveningKidRate: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            {/* BLACKOUTS */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Blackout Management</h4>
              <div className="bg-slate-50 p-6 rounded-2xl space-y-5 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Date</label>
                    <input type="date" className="input-premium py-3" value={blkDate} onChange={e => setBlkDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Shift</label>
                    <select className="input-premium py-3 bg-white" value={blkSlot} onChange={e => setBlkSlot(e.target.value)}>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t.split(':')[0]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={addBlackout} className="flex-1 bg-slate-900 text-white text-[10px] font-black uppercase py-4 rounded-xl shadow-lg">Block Slot</button>
                  <button onClick={addFullDayBlackout} className="flex-1 border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase py-4 rounded-xl">Block Full Day</button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Current Active Blackouts</p>
                {(!draft.blockedSlots || draft.blockedSlots.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-4">All dates are open for booking</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {draft.blockedSlots.map((bs, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase">{bs.date}</p>
                          {/* Updated display to use shift property */}
                          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{bs.shift}</p>
                        </div>
                        <button onClick={() => removeBlackout(i)} className="w-10 h-10 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 mt-6 space-y-4">
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">Settings will be saved to 'Settings' tab in Google Sheets.</p>
            <button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="btn-resort w-full h-16 shadow-2xl disabled:opacity-50"
            >
              {isSaving ? <><i className="fas fa-circle-notch fa-spin mr-2"></i> Syncing to Cloud...</> : 'Save & Sync Global Settings'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Stat = ({label, value}:{label:string, value:any}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
    <p className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] mb-1">{label}</p>
    <p className="text-2xl font-black text-[#1B2559]">{value}</p>
  </div>
);

const Modal = ({title, children, onClose}:{title:string, children:any, onClose: () => void}) => (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-6 z-[1000] no-print">
    <div className="bg-white rounded-[2.5rem] p-10 md:p-14 w-full max-w-xl shadow-2xl animate-slide-up relative border border-white/20">
      <button onClick={onClose} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><i className="fas fa-times text-2xl"></i></button>
      <div className="mb-10"><h3 className="text-3xl font-black uppercase text-slate-900 mb-2">{title}</h3></div>
      {children}
    </div>
  </div>
);

export default AdminPortal;
