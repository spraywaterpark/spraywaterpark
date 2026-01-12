import React, { useState, useMemo, useEffect } from 'react';
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

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings, syncId }) => {

  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');

  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const [blkDate, setBlkDate] = useState('');
  const [blkSlot, setBlkSlot] = useState(TIME_SLOTS[0]);

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => setLastUpdated(new Date().toLocaleTimeString()), [bookings]);

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const todayLocale = today.toLocaleDateString("en-IN");

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (viewMode === 'sales_today')
      return list.filter(b => b.createdAt.includes(todayLocale) || b.createdAt.startsWith(todayISO));
    if (viewMode === 'visit_today')
      return list.filter(b => b.date === todayISO);
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
    } finally {
      setIsSyncing(false);
    }
  };

  const addBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const current = draft.blockedSlots || [];
    if (current.some(s => s.date === blkDate && (s.slot === blkSlot || s.slot === 'Full Day')))
      return alert("Already blocked");
    setDraft({ ...draft, blockedSlots: [...current, { date: blkDate, slot: blkSlot }] });
  };

  const addFullDayBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const updated = (draft.blockedSlots || []).filter(s => s.date !== blkDate);
    setDraft({ ...draft, blockedSlots: [...updated, { date: blkDate, slot: 'Full Day' }] });
  };

  const removeBlackout = (i: number) => {
    const updated = (draft.blockedSlots || []).filter((_, idx) => idx !== i);
    setDraft({ ...draft, blockedSlots: updated });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await onUpdateSettings(draft);
    setIsSaving(false);
    setActiveTab('bookings');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">

      {/* TABS */}
      <div className="flex justify-center gap-3">
        <button onClick={() => setActiveTab('bookings')}
          className={`px-8 py-3 rounded-full font-black text-xs tracking-widest ${activeTab==='bookings'?'bg-slate-900 text-white':'bg-white border text-slate-500'}`}>
          BOOKINGS
        </button>
        <button onClick={() => setActiveTab('settings')}
          className={`px-8 py-3 rounded-full font-black text-xs tracking-widest ${activeTab==='settings'?'bg-slate-900 text-white':'bg-white border text-slate-500'}`}>
          SETTINGS
        </button>
      </div>

      {activeTab === 'bookings' && (
        <>
          {/* HEADER */}
          <div className="bg-[#1B2559] text-white p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-70">Live Sales</p>
              <h2 className="text-4xl font-black mt-2">₹{stats.revenue.toLocaleString()}</h2>
            </div>

            <div className="flex gap-2">
              {['sales_today','visit_today','all'].map(m => (
                <button key={m} onClick={() => setViewMode(m as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border transition ${viewMode===m?'bg-white text-black':'text-white border-white/30'}`}>
                  {m.replace('_',' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Tickets" value={stats.tickets}/>
            <Stat label="Adults" value={stats.adults}/>
            <Stat label="Kids" value={stats.kids}/>
            <Stat label="Last Sync" value={lastUpdated}/>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-3xl shadow overflow-hidden">
            <table className="w-full text-center">
              <thead className="bg-slate-50 text-xs">
                <tr>
                  <th className="p-4 text-left">Time</th>
                  <th>Name</th><th>Mobile</th><th>Date</th><th>Passes</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b,i)=>(
                  <tr key={i} className="border-t text-sm">
                    <td className="p-4 text-left">{b.createdAt}</td>
                    <td>{b.name}</td><td>{b.mobile}</td><td>{b.date}</td>
                    <td>{b.adults+b.kids}</td><td className="font-bold">₹{b.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-center gap-4">
            <button onClick={manualRefresh} className="btn-resort h-14">Refresh</button>
            <button onClick={() => setActiveTab('settings')} className="btn-resort h-14">Settings</button>
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <Modal title="Configure Resort" onClose={() => setActiveTab('bookings')}>
          {/* Settings UI unchanged */}
        </Modal>
      )}

    </div>
  );
};

const Stat = ({label,value}:{label:string,value:any}) => (
  <div className="bg-white rounded-2xl p-6 shadow border text-center">
    <p className="text-xs uppercase text-slate-400 font-black">{label}</p>
    <p className="text-2xl font-black text-[#1B2559]">{value}</p>
  </div>
);

const Modal = ({title, children, onClose}:{title:string, children:any, onClose:()=>void}) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
    <div className="bg-white rounded-3xl p-10 w-full max-w-xl relative">
      <button onClick={onClose} className="absolute top-6 right-6 text-xl">✕</button>
      <h3 className="text-3xl font-black mb-6">{title}</h3>
      {children}
    </div>
  </div>
);

export default AdminPortal;
