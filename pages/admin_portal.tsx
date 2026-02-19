
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking, AdminSettings, BlockedSlot, ShiftType, LockerReceipt } from '../types';
import { cloudSync } from '../services/cloud_sync';

interface AdminPanelProps {
  bookings: Booking[];
  settings: AdminSettings;
  onUpdateSettings: (s: AdminSettings) => void;
  syncId: string | null;
  onSyncSetup: (id: string) => void;
  onLogout: () => void;
}

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookings' | 'pricing' | 'slots'>('bookings');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [rentals, setRentals] = useState<LockerReceipt[]>([]);
  
  useEffect(() => {
    setDraft(settings);
    cloudSync.fetchRentals().then(data => { if (data) setRentals(data); });
  }, [settings]);

  const stats = useMemo(() => {
    // Correct IST Today
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayVisits = bookings.filter(b => b.date === todayStr);
    const totalAdults = todayVisits.reduce((s, b) => s + (Number(b.adults) || 0), 0);
    const totalKids = todayVisits.reduce((s, b) => s + (Number(b.kids) || 0), 0);
    const revenue = todayVisits.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
    const checkedIn = todayVisits.filter(b => b.status === 'checked-in').reduce((s, b) => s + Number(b.adults) + Number(b.kids), 0);

    return { revenue, totalBookings: todayVisits.length, totalGuests: totalAdults + totalKids, checkedIn };
  }, [bookings, rentals]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative border border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-3">Today's Revenue (IST)</p>
            <h2 className="text-6xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
             <div className="bg-white/5 p-6 rounded-3xl text-center"><p className="text-[9px] font-black opacity-40 uppercase">Total Guests</p><p className="text-2xl font-black">{stats.totalGuests}</p></div>
             <div className="bg-emerald-500/10 p-6 rounded-3xl text-center"><p className="text-[9px] font-black text-emerald-400 uppercase">Inside Park</p><p className="text-2xl font-black text-emerald-400">{stats.checkedIn}</p></div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center bg-white/5 p-1.5 rounded-2xl mt-12 gap-1 border border-white/10">
            {['bookings', 'pricing', 'slots'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === tab ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>{tab}</button>
            ))}
            <button onClick={() => navigate('/admin-lockers')} className="px-6 py-3 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/20 rounded-xl ml-2">Lockers <i className="fas fa-external-link-alt ml-2"></i></button>
        </div>
      </div>
      {/* ... rest of component same ... */}
    </div>
  );
};
export default AdminPortal;
