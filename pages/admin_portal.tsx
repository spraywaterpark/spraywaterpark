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

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings, syncId, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const [blkDate, setBlkDate] = useState('');
  const [blkSlot, setBlkSlot] = useState(TIME_SLOTS[0]);

  useEffect(() => { setDraft(settings); }, [settings]);
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
            Live Sales Dashboard <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
          <h2 className="text-3xl sm:text-5xl font-black mt-2">₹{stats.revenue.toLocaleString()}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setViewMode('sales_today')} className="btn-resort">Today Sales</button>
          <button onClick={() => setViewMode('visit_today')} className="btn-resort">Today Visits</button>
          <button onClick={() => setViewMode('all')} className="btn-resort">All Data</button>

          {/* 🆕 CO&LO LOGIN */}
          <button
            className="btn-resort bg-emerald-400 text-slate-900 hover:bg-emerald-300"
            onClick={() => alert('CO&LO module coming soon')}
          >
            CO&LO LOGIN
          </button>
        </div>
      </div>

      {/* REST OF YOUR UI — unchanged */}
      {/* (Stats, table, modals etc remain same below) */}

    </div>
  );
};

export default AdminPortal;
