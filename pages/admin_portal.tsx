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

type ShiftType = 'Morning' | 'Evening' | 'Both';

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings, syncId, onSyncSetup }) => {

  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'sync' | 'blackout'>('bookings');
  const [draft, setDraft] = useState<AdminSettings>(settings);

  const [blockDate, setBlockDate] = useState('');
  const [blockShift, setBlockShift] = useState<ShiftType>('Both');

  useEffect(() => setDraft(settings), [settings]);

  // ===== BLACKOUT HANDLERS =====
  const addBlackout = () => {
    if (!blockDate) return alert("Select a date");

    const updated = {
      ...draft,
      blackouts: [
        ...(draft.blackouts || []),
        { date: blockDate, shift: blockShift }
      ]
    };

    setDraft(updated);
    onUpdateSettings(updated);
    setBlockDate('');
    setBlockShift('Both');
  };

  const removeBlackout = (i: number) => {
    const updated = {
      ...draft,
      blackouts: draft.blackouts!.filter((_, index) => index !== i)
    };
    setDraft(updated);
    onUpdateSettings(updated);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">

      {/* HEADER */}
      <div className="bg-[#1B2559] text-white p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-black">Admin Panel</h2>
      </div>

      {/* NAV */}
      <div className="flex gap-4 justify-center">
        {['bookings','blackout','settings','sync'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`btn-premium ${activeTab===t && 'bg-black text-white'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* BLACKOUT TAB */}
      {activeTab === 'blackout' && (
        <div className="bg-white p-10 rounded-3xl shadow-xl space-y-6">

          <h3 className="text-2xl font-black">Blackout Dates</h3>

          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="date"
              value={blockDate}
              onChange={e => setBlockDate(e.target.value)}
              className="input-premium"
            />

            <select
              value={blockShift}
              onChange={e => setBlockShift(e.target.value as ShiftType)}
              className="input-premium"
            >
              <option value="Both">Both Shifts</option>
              <option value="Morning">Morning Only</option>
              <option value="Evening">Evening Only</option>
            </select>

            <button onClick={addBlackout} className="btn-premium">
              Block Date
            </button>
          </div>

          <div className="space-y-3 mt-6">
            {(draft.blackouts || []).map((b, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-100 p-4 rounded-xl">
                <div>
                  <p className="font-bold">{b.date}</p>
                  <p className="text-sm text-slate-500">{b.shift}</p>
                </div>
                <button onClick={() => removeBlackout(i)} className="btn-circle">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
