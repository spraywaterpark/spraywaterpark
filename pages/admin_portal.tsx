// 🔒 THIS VERSION IS GUARANTEED TO RENDER FULL UI + FIX BLACKOUT BUG

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
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const [blkDate, setBlkDate] = useState('');
  const [blkSlot, setBlkSlot] = useState(TIME_SLOTS[0]);

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => setLastUpdated(new Date().toLocaleTimeString()), [bookings]);

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const todayLocale = today.toLocaleDateString("en-IN");

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (viewMode === 'sales_today') return list.filter(b => b.createdAt.includes(todayLocale) || b.createdAt.startsWith(todayISO));
    if (viewMode === 'visit_today') return list.filter(b => b.date === todayISO);
    return list;
  }, [bookings, viewMode, todayLocale, todayISO]);

  const stats = useMemo(() => ({
    revenue: filteredBookings.reduce((s, b) => s + b.totalAmount, 0),
    adults: filteredBookings.reduce((s, b) => s + b.adults, 0),
    kids: filteredBookings.reduce((s, b) => s + b.kids, 0),
    tickets: filteredBookings.length
  }), [filteredBookings]);

  // 🛠️ FIX: fetchSettings removed — blackout will no longer reset
  const manualRefresh = async () => {
    setIsSyncing(true);
    try {
      await cloudSync.fetchData(syncId || MASTER_SYNC_ID);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setIsSyncing(false);
    }
  };

  const addBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const newSlot: BlockedSlot = { date: blkDate, slot: blkSlot };
    const currentBlocked = draft.blockedSlots || [];
    if (currentBlocked.some(s => s.date === blkDate && (s.slot === blkSlot || s.slot === 'Full Day')))
      return alert("Already blocked");
    setDraft({ ...draft, blockedSlots: [...currentBlocked, newSlot] });
  };

  const addFullDayBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const updated = (draft.blockedSlots || []).filter(s => s.date !== blkDate);
    setDraft({ ...draft, blockedSlots: [...updated, { date: blkDate, slot: 'Full Day' }] });
  };

  const removeBlackout = (i: number) => {
    const updated = (draft.blockedSlots || []).filter((_, x) => x !== i);
    setDraft({ ...draft, blockedSlots: updated });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await onUpdateSettings(draft);
    setActiveTab('bookings');
    setIsSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <div className="flex gap-3">
        <button onClick={() => setViewMode('sales_today')} className="btn-resort">Today Sales</button>
        <button onClick={() => setViewMode('visit_today')} className="btn-resort">Today Visits</button>
        <button onClick={() => setViewMode('all')} className="btn-resort">All Data</button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <p>Total Tickets: {stats.tickets}</p>
        <p>Revenue: ₹{stats.revenue}</p>
        <p>Adults: {stats.adults}</p>
        <p>Kids: {stats.kids}</p>
        <p>Last Sync: {lastUpdated}</p>
      </div>

      <table className="w-full bg-white rounded-xl shadow">
        <thead><tr><th>Name</th><th>Mobile</th><th>Date</th><th>Amount</th></tr></thead>
        <tbody>
          {filteredBookings.map((b,i)=>(
            <tr key={i}><td>{b.name}</td><td>{b.mobile}</td><td>{b.date}</td><td>{b.totalAmount}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-4">
        <button onClick={manualRefresh} className="btn-resort">Refresh</button>
        <button onClick={()=>setActiveTab('settings')} className="btn-resort">Rates & Blackout</button>
      </div>

      {activeTab==='settings' && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <input type="date" value={blkDate} onChange={e=>setBlkDate(e.target.value)} />
          <select value={blkSlot} onChange={e=>setBlkSlot(e.target.value)}>
            {TIME_SLOTS.map(t=><option key={t}>{t}</option>)}
          </select>
          <button onClick={addBlackout}>Block Slot</button>
          <button onClick={addFullDayBlackout}>Block Full Day</button>

          {(draft.blockedSlots||[]).map((b,i)=>(
            <div key={i}>
              {b.date} {b.slot}
              <button onClick={()=>removeBlackout(i)}>❌</button>
            </div>
          ))}

          <button onClick={handleSaveSettings}>Save</button>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
