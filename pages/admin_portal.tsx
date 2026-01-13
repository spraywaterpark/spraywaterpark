import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';   // 🆕 added
import { Booking, AdminSettings, BlockedSlot } from '../types';
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
  const navigate = useNavigate(); // 🆕 added

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

  const addBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const newSlot: BlockedSlot = { date: blkDate, slot: blkSlot };
    const currentBlocked = draft.blockedSlots || [];

    if (currentBlocked.some(s => s.date === blkDate && (s.slot === blkSlot || s.slot === 'Full Day'))) {
      return alert("This slot or full day is already blocked.");
    }
    setDraft({ ...draft, blockedSlots: [...currentBlocked, newSlot] });
  };

  const addFullDayBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const currentBlocked = draft.blockedSlots || [];
    const updatedSlots = currentBlocked.filter(s => s.date !== blkDate);
    setDraft({ ...draft, blockedSlots: [...updatedSlots, { date: blkDate, slot: 'Full Day' }] });
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
          <p className="text-blue-200 text-sm font-bold mt-1">
            {viewMode === 'sales_today' ? "Today's Revenue" : viewMode === 'visit_today' ? "Revenue for Visitors Today" : "Total Revenue"}
          </p>
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
          <i className={`fas fa-sync-alt mr-2 text-xs ${isSyncing ? 'fa-spin' : ''}`}></i>
          {isSyncing ? 'Refreshing...' : 'Refresh Cloud Data'}
        </button>

        <button onClick={() => setActiveTab('settings')} className="btn-resort !px-8 h-14">
          <i className="fas fa-cog mr-2 text-xs"></i>
          Rates & Blackout Dates
        </button>

        {/* 🆕 Locker & Costume Module Entry */}
        <button onClick={() => navigate('/admin-lockers')} className="btn-resort !px-8 h-14 !bg-indigo-600">
          <i className="fas fa-box mr-2 text-xs"></i>
          LO & CO Login
        </button>

      </div>

      {/* SETTINGS MODAL */}
      {activeTab === 'settings' && (
        <Modal title="Configure Resort" onClose={() => setActiveTab('bookings')}>
          {/* ... SAME AS YOUR ORIGINAL (no change below) */}
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
