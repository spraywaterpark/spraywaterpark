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

  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'sync' | 'blackout'>('bookings');
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // 🔒 Blackout state
  const [blockDate, setBlockDate] = useState('');
  const [blockShift, setBlockShift] = useState<'Morning' | 'Evening' | 'Both'>('Both');

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => setLastUpdated(new Date().toLocaleTimeString()), [bookings]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    let list = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (viewMode === 'sales_today') return list.filter(b => b.createdAt.startsWith(todayStr));
    if (viewMode === 'visit_today') return list.filter(b => b.date === todayStr);
    return list;
  }, [bookings, viewMode]);

  const stats = useMemo(() => ({
    revenue: filteredBookings.reduce((s, b) => s + b.totalAmount, 0),
    adults: filteredBookings.reduce((s, b) => s + b.adults, 0),
    kids: filteredBookings.reduce((s, b) => s + b.kids, 0),
    tickets: filteredBookings.length
  }), [filteredBookings]);

  const manualRefresh = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSyncing(false);
  };

  const reLinkCloud = async () => {
    if (!confirm("Generate new Sync ID?")) return;
    setIsSyncing(true);
    const id = await cloudSync.createRoom(bookings);
    if (id) onSyncSetup(id);
    setIsSyncing(false);
  };

  const saveBlackout = () => {
    if (!blockDate) return alert("Select date");
    const updated = {
      ...draft,
      blackouts: [...(draft.blackouts || []), { date: blockDate, shift: blockShift }]
    };
    setDraft(updated);
  };

  const removeBlackout = (i: number) => {
    const copy = [...(draft.blackouts || [])];
    copy.splice(i, 1);
    setDraft({ ...draft, blackouts: copy });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">

      {/* HEADER */}
      <div className="bg-[#1B2559] text-white p-6 sm:p-10 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-70">Live Sales Dashboard</p>
          <h2 className="text-3xl sm:text-5xl font-black mt-2">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-blue-200 text-sm font-bold mt-1">Today's Revenue</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setViewMode('sales_today')} className={`btn-tab ${viewMode==='sales_today' && 'active'}`}>Today Sales</button>
          <button onClick={() => setViewMode('visit_today')} className={`btn-tab ${viewMode==='visit_today' && 'active'}`}>Today Visits</button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Tickets" value={stats.tickets} />
        <Stat label="Adults" value={stats.adults} />
        <Stat label="Kids" value={stats.kids} />
        <Stat label="Last Sync" value={lastUpdated} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="p-4">ID</th><th>Name</th><th>Mobile</th><th>Date</th><th>Tickets</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id} className="border-t text-center text-sm">
                  <td className="p-4 font-bold">{b.id}</td>
                  <td>{b.name}</td>
                  <td>{b.mobile}</td>
                  <td>{b.date}</td>
                  <td>{b.adults + b.kids}</td>
                  <td className="font-black">₹{b.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-center gap-4">
        <button onClick={() => setActiveTab('blackout')} className="btn-premium">Blackout</button>
        <button onClick={manualRefresh} className="btn-premium">Refresh</button>
        <button onClick={() => setActiveTab('sync')} className="btn-premium">Sync ID</button>
        <button onClick={() => setActiveTab('settings')} className="btn-premium">Rates</button>
      </div>

      {/* BLACKOUT MODAL */}
      {activeTab === 'blackout' && (
        <Modal title="Block Booking Slots">
          <div className="space-y-4">

            <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} className="input-premium w-full" />

            <select value={blockShift} onChange={e => setBlockShift(e.target.value as any)} className="input-premium w-full">
              <option>Morning</option>
              <option>Evening</option>
              <option>Both</option>
            </select>

            <button onClick={saveBlackout} className="btn-premium w-full">Block Slot</button>

            {(draft.blackouts || []).map((b, i) => (
              <div key={i} className="flex justify-between bg-slate-100 p-3 rounded">
                <span>{b.date} — {b.shift}</span>
                <button onClick={() => removeBlackout(i)} className="text-red-600">Remove</button>
              </div>
            ))}

            <button onClick={() => { onUpdateSettings(draft); setActiveTab('bookings'); }} className="btn-premium w-full mt-4">
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* SYNC */}
      {activeTab === 'sync' && (
        <Modal title="Cloud Sync">
          <p className="text-xl font-mono text-blue-700">{syncId}</p>
          <button onClick={reLinkCloud} className="btn-premium mt-6">Generate New</button>
        </Modal>
      )}

      {/* SETTINGS */}
      {activeTab === 'settings' && (
        <Modal title="Update Rates">
          <button onClick={() => { onUpdateSettings(draft); setActiveTab('bookings'); }} className="btn-premium mt-6">Save</button>
        </Modal>
      )}

    </div>
  );
};

const Stat = ({label, value}:{label:string, value:any}) => (
  <div className="bg-white rounded-xl p-4 shadow text-center">
    <p className="text-xs uppercase opacity-60">{label}</p>
    <p className="text-2xl font-black">{value}</p>
  </div>
);

const Modal = ({title, children}:{title:string, children:any}) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
    <div className="bg-white rounded-3xl p-10 w-full max-w-lg">
      <h3 className="text-2xl font-black mb-6">{title}</h3>
      {children}
      <button onClick={() => location.reload()} className="mt-6 text-sm">Close</button>
    </div>
  </div>
);

export default AdminPortal;
