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

  const addBlackout = () => {
    if (!blockDate) return;

    const updated: AdminSettings = {
      ...draft,
      blackouts: [...(draft.blackouts || []), { date: blockDate, shift: blockShift }]
    };

    setDraft(updated);
    onUpdateSettings(updated);
    setBlockDate('');
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
          <button onClick={() => setViewMode('sales_today')} className={`btn-tab ${viewMode==='sales_today' ? 'active' : ''}`}>Today Sales</button>
          <button onClick={() => setViewMode('visit_today')} className={`btn-tab ${viewMode==='visit_today' ? 'active' : ''}`}>Today Visits</button>
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

      {/* ACTION BUTTONS */}
      <div className="flex justify-center gap-4">
        <button onClick={manualRefresh} className="btn-premium">Refresh</button>
        <button onClick={() => setActiveTab('sync')} className="btn-premium">Sync ID</button>
        <button onClick={() => setActiveTab('settings')} className="btn-premium">Rates</button>
        <button onClick={() => setActiveTab('blackout')} className="btn-premium">Blackout</button>
      </div>

      {/* BLACKOUT PANEL */}
      {activeTab === 'blackout' && (
        <div className="bg-white rounded-3xl p-8 shadow-xl space-y-6">
          <h3 className="text-2xl font-black">Block Booking Date</h3>

          <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} className="input-premium" />

          <select value={blockShift} onChange={e => setBlockShift(e.target.value as any)} className="input-premium">
            <option>Morning</option>
            <option>Evening</option>
            <option>Both</option>
          </select>

          <button onClick={addBlackout} className="btn-premium">Add Block</button>
        </div>
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

export default AdminPortal;
