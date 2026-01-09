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
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => { setDraft(settings); }, [settings]);
  useEffect(() => { setLastUpdated(new Date().toLocaleTimeString()); }, [bookings]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    let list = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (viewMode === 'sales_today') return list.filter(b => b.createdAt.split('T')[0] === todayStr);
    if (viewMode === 'visit_today') return list.filter(b => b.date === todayStr);
    return list;
  }, [bookings, viewMode, todayStr]);

  const viewStats = useMemo(() => ({
    totalRev: filteredBookings.reduce((s, b) => s + b.totalAmount, 0),
    totalAdults: filteredBookings.reduce((s, b) => s + b.adults, 0),
    totalKids: filteredBookings.reduce((s, b) => s + b.kids, 0),
    totalTickets: filteredBookings.length
  }), [filteredBookings]);

  const handleUpdate = (field: keyof AdminSettings, value: number) => {
    setDraft({ ...draft, [field]: value });
  };

  const manualRefresh = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSyncing(false);
  };

  const reLinkCloud = async () => {
    if (!confirm("Generate new Room ID? All devices must update.")) return;
    setIsSyncing(true);
    const newId = await cloudSync.createRoom(bookings);
    if (newId) onSyncSetup(newId);
    setIsSyncing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade">

      {/* Header */}
      <div className="bg-[#1B2559] text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Sales</p>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            {viewMode === 'sales_today' ? "Today's Bookings" : "Today's Visitors"}
          </h2>
          <p className="text-blue-200 mt-2 text-sm font-bold uppercase">
            Total Revenue: ₹{viewStats.totalRev.toLocaleString()}
          </p>
        </div>

        <div className="flex bg-white/10 p-2 rounded-xl">
          <button onClick={() => setViewMode('sales_today')}
            className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase ${viewMode === 'sales_today' ? 'bg-white text-blue-900' : 'text-white/60'}`}>
            Sales Today
          </button>
          <button onClick={() => setViewMode('visit_today')}
            className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase ${viewMode === 'visit_today' ? 'bg-white text-blue-900' : 'text-white/60'}`}>
            Visits Today
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {[
          ['Tickets', viewStats.totalTickets],
          ['Adults', viewStats.totalAdults],
          ['Kids', viewStats.totalKids],
          ['Revenue', `₹${viewStats.totalRev}`]
        ].map(([label, value]) => (
          <div key={label} className="bg-white p-6 rounded-2xl shadow border">
            <p className="text-[10px] uppercase font-black text-slate-400 mb-2">{label}</p>
            <p className="text-3xl font-black text-[#1B2559]">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow border overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500">
            <tr>
              <th className="p-4">Time / ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Visit</th>
              <th className="p-4 text-center">Guests</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBookings.map(b => (
              <tr key={b.id}>
                <td className="p-4 text-xs font-bold text-blue-600">
                  {new Date(b.createdAt).toLocaleTimeString()}<br />{b.id}
                </td>
                <td className="p-4 font-bold">{b.name}</td>
                <td className="p-4">{b.mobile}</td>
                <td className="p-4 text-sm">{b.date}<br />{b.time}</td>
                <td className="p-4 text-center">{b.adults + b.kids}</td>
                <td className="p-4 text-right font-black">₹{b.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Settings */}
      <div className="bg-white p-8 rounded-2xl shadow border space-y-6">
        <h3 className="text-xl font-black">Ticket Rates</h3>

        <div className="grid sm:grid-cols-2 gap-6">
          {([
            ['Morning Adult', 'morningAdultRate'],
            ['Morning Kid', 'morningKidRate'],
            ['Evening Adult', 'eveningAdultRate'],
            ['Evening Kid', 'eveningKidRate']
          ] as [string, keyof AdminSettings][]).map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{label}</label>
              <input
                type="number"
                value={draft[key]}
                onChange={e => handleUpdate(key, Number(e.target.value))}
                className="w-full border p-3 rounded-lg"
              />
            </div>
          ))}
        </div>

        <button onClick={() => onUpdateSettings(draft)} className="btn-premium w-full py-4">
          Save Settings
        </button>
      </div>

      {/* Sync */}
      <div className="bg-white p-8 rounded-2xl shadow border text-center space-y-4">
        <p className="text-sm font-bold">Cloud Sync ID</p>
        <p className="font-mono text-lg bg-slate-100 p-4 rounded">{syncId}</p>

        <div className="flex justify-center gap-4">
          <button onClick={manualRefresh} disabled={isSyncing} className="btn-premium">
            {isSyncing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={reLinkCloud} className="btn-premium">
            New Room ID
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminPortal;
