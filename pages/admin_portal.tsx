import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings, LockerReceipt } from '../types';
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

  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'lockers'>('bookings');
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);

  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const receipts: LockerReceipt[] = JSON.parse(localStorage.getItem('swp_receipts') || '[]');

  useEffect(() => setDraft(settings), [settings]);

  /* ===============================
     BOOKINGS
  ================================ */

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    if (viewMode === 'visit_today') return bookings.filter(b => b.date === todayISO);
    if (viewMode === 'sales_today') return bookings.filter(b => b.createdAt.startsWith(todayISO));
    return bookings;
  }, [bookings, viewMode, todayISO]);

  const stats = useMemo(() => ({
    revenue: filteredBookings.reduce((s, b) => s + b.totalAmount, 0),
    adults: filteredBookings.reduce((s, b) => s + b.adults, 0),
    kids: filteredBookings.reduce((s, b) => s + b.kids, 0),
    tickets: filteredBookings.length
  }), [filteredBookings]);

  /* ===============================
     LOCKER STATS
  ================================ */

  const lockerStats = useMemo(() => {
    const active = receipts.filter(r => r.status === 'issued');
    const returned = receipts.filter(r => r.status === 'returned');

    return {
      totalReceipts: receipts.length,
      activeIssues: active.length,
      returnedToday: returned.filter(r => r.returnedAt?.startsWith(todayISO)).length,
      rentCollected: receipts.reduce((s, r) => s + r.rentAmount, 0),
      pendingRefunds: active.reduce((s, r) => s + r.refundableAmount, 0),
    };
  }, [receipts, todayISO]);

  /* ===============================
     UI
  ================================ */

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

      {/* TABS */}
      <div className="flex gap-3">
        {['bookings','settings','lockers'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase
              ${activeTab===t?'bg-emerald-500 text-black':'bg-white/10 text-white/70'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ================= BOOKINGS ================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <h2 className="text-white text-3xl font-black">Bookings</h2>
          <div className="text-white">Revenue: ₹{stats.revenue}</div>
        </div>
      )}

      {/* ================= SETTINGS ================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-white text-3xl font-black">Settings</h2>
          <button onClick={() => onUpdateSettings(draft)} className="btn-resort">Save Settings</button>
        </div>
      )}

      {/* ================= LOCKERS DASHBOARD ================= */}
      {activeTab === 'lockers' && (
        <div className="space-y-10 text-white">

          <h2 className="text-3xl font-black">Locker & Costume Control</h2>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card title="Total Receipts" value={lockerStats.totalReceipts} />
            <Card title="Active Issues" value={lockerStats.activeIssues} />
            <Card title="Returned Today" value={lockerStats.returnedToday} />
            <Card title="Rent Collected" value={`₹${lockerStats.rentCollected}`} />
            <Card title="Pending Refunds" value={`₹${lockerStats.pendingRefunds}`} />
          </div>

          {/* RECEIPTS TABLE */}
          <div className="bg-white text-black rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-xs uppercase">
                <tr>
                  <th className="p-3">Receipt</th>
                  <th>Guest</th>
                  <th>Lockers</th>
                  <th>Costumes</th>
                  <th>Rent</th>
                  <th>Refund</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r,i) => (
                  <tr key={i} className="border-t text-center">
                    <td className="p-2 font-bold">{r.receiptNo}</td>
                    <td>{r.guestName}</td>
                    <td>M:{r.maleLockers.length} F:{r.femaleLockers.length}</td>
                    <td>M:{r.maleCostumes} F:{r.femaleCostumes}</td>
                    <td>₹{r.rentAmount}</td>
                    <td>₹{r.refundableAmount}</td>
                    <td className={r.status==='issued'?'text-red-500':'text-emerald-600'}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};

const Card = ({title, value}:{title:string, value:any}) => (
  <div className="bg-white/10 p-4 rounded-xl text-center">
    <p className="text-xs uppercase text-white/60">{title}</p>
    <p className="text-xl font-black">{value}</p>
  </div>
);

export default AdminPortal;
