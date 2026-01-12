import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings, BlockedSlot } from '../types';
import { TIME_SLOTS } from '../constants';

interface AdminPanelProps {
  bookings: Booking[];
  settings: AdminSettings;
  onUpdateSettings: (s: AdminSettings) => void;
  syncId: string | null;
  onSyncSetup: (id: string) => void;
  onLogout: () => void;
}

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings }) => {

  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [draft, setDraft] = useState<AdminSettings>(settings);

  const [blkDate, setBlkDate] = useState('');
  const [blkSlot, setBlkSlot] = useState(TIME_SLOTS[0]);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const today = new Date().toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    if (viewMode === 'today') {
      return bookings.filter(b => b.date === today);
    }
    return bookings;
  }, [bookings, viewMode, today]);

  const revenue = filteredBookings.reduce((s, b) => s + b.totalAmount, 0);

  const addBlackout = () => {
    if (!blkDate) return alert("Select date");

    const exists = draft.blockedSlots.some(
      b => b.date === blkDate && (b.shift === blkSlot || b.shift === 'all')
    );

    if (exists) return alert("Already blocked");

    setDraft({
      ...draft,
      blockedSlots: [...draft.blockedSlots, { date: blkDate, shift: blkSlot }]
    });
  };

  const removeBlackout = (i: number) => {
    const updated = [...draft.blockedSlots];
    updated.splice(i, 1);
    setDraft({ ...draft, blockedSlots: updated });
  };

  const saveSettings = () => {
    onUpdateSettings(draft);
    setActiveTab('bookings');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 text-white">

      {/* TOP BAR */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black">ADMIN PANEL</h1>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('bookings')} className={`btn-premium ${activeTab==='bookings' && 'bg-emerald-500'}`}>Bookings</button>
          <button onClick={() => setActiveTab('settings')} className={`btn-premium ${activeTab==='settings' && 'bg-emerald-500'}`}>Settings</button>
        </div>
      </div>

      {/* BOOKINGS */}
      {activeTab === 'bookings' && (
        <>
          <div className="flex gap-3">
            <button onClick={() => setViewMode('today')} className={`btn-premium ${viewMode==='today' && 'bg-emerald-500'}`}>Today</button>
            <button onClick={() => setViewMode('all')} className={`btn-premium ${viewMode==='all' && 'bg-emerald-500'}`}>All</button>
          </div>

          <div className="bg-white text-black rounded-xl p-6">
            <h2 className="font-black text-xl mb-3">Revenue: ₹{revenue}</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Date</th><th>Name</th><th>Mobile</th><th>People</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b, i) => (
                  <tr key={i} className="border-b">
                    <td>{b.date}</td>
                    <td>{b.name}</td>
                    <td>{b.mobile}</td>
                    <td>{b.adults + b.kids}</td>
                    <td>₹{b.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white text-black rounded-xl p-6 space-y-6">

          <h2 className="font-black text-xl">Locker & Costume Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <input className="input-premium" placeholder="Locker Rent" value={draft.lockerRent} onChange={e => setDraft({...draft, lockerRent: +e.target.value})} />
            <input className="input-premium" placeholder="Security Deposit" value={draft.securityDeposit} onChange={e => setDraft({...draft, securityDeposit: +e.target.value})} />
            <input className="input-premium" placeholder="Male Costume Rent" value={draft.maleCostumeRent} onChange={e => setDraft({...draft, maleCostumeRent: +e.target.value})} />
            <input className="input-premium" placeholder="Female Costume Rent" value={draft.femaleCostumeRent} onChange={e => setDraft({...draft, femaleCostumeRent: +e.target.value})} />
          </div>

          <h3 className="font-black">Blackout Dates</h3>

          <div className="flex gap-3">
            <input type="date" className="input-premium" value={blkDate} onChange={e => setBlkDate(e.target.value)} />
            <select className="input-premium" value={blkSlot} onChange={e => setBlkSlot(e.target.value as any)}>
              {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={addBlackout} className="btn-premium">Block</button>
          </div>

          <ul className="space-y-2">
            {draft.blockedSlots.map((b, i) => (
              <li key={i} className="flex justify-between bg-slate-100 p-3 rounded">
                {b.date} — {b.shift}
                <button onClick={() => removeBlackout(i)}>❌</button>
              </li>
            ))}
          </ul>

          <button onClick={saveSettings} className="btn-resort w-full h-14">
            Save Settings
          </button>

        </div>
      )}

    </div>
  );
};

export default AdminPortal;
