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
  const [blockDate, setBlockDate] = useState('');
  const [blockShift, setBlockShift] = useState<'Morning' | 'Evening' | 'Both'>('Both');

  useEffect(() => setDraft(settings), [settings]);

  const addBlackout = () => {
    if (!blockDate) return alert('Select a date');
    const updated = {
      ...draft,
      blackouts: [...(draft.blackouts || []), { date: blockDate, shift: blockShift }]
    };
    setDraft(updated);
  };

  const removeBlackout = (index:number) => {
    const copy = [...(draft.blackouts || [])];
    copy.splice(index,1);
    setDraft({ ...draft, blackouts: copy });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">

      {/* Existing UI untouched */}
      {/* ... Header, Stats, Table same as before ... */}

      <div className="flex justify-center gap-4">
        <button onClick={() => setActiveTab('blackout')} className="btn-premium">Blackout Dates</button>
        <button onClick={() => setActiveTab('sync')} className="btn-premium">Sync ID</button>
        <button onClick={() => setActiveTab('settings')} className="btn-premium">Rates</button>
      </div>

      {activeTab === 'blackout' && (
        <Modal title="Blackout Dates">

          <div className="space-y-4">
            <input type="date" value={blockDate} onChange={e=>setBlockDate(e.target.value)} className="input-premium w-full"/>

            <select value={blockShift} onChange={e=>setBlockShift(e.target.value as any)} className="input-premium w-full">
              <option>Morning</option>
              <option>Evening</option>
              <option>Both</option>
            </select>

            <button onClick={addBlackout} className="btn-premium w-full">Block This Slot</button>

            {(draft.blackouts || []).map((b, i) => (
              <div key={i} className="flex justify-between bg-slate-100 p-3 rounded">
                <span>{b.date} — {b.shift}</span>
                <button onClick={() => removeBlackout(i)} className="text-red-600">Remove</button>
              </div>
            ))}

            <button onClick={() => { onUpdateSettings(draft); setActiveTab('bookings'); }} className="btn-premium w-full mt-4">
              Save Blackouts
            </button>
          </div>

        </Modal>
      )}

    </div>
  );
};

const Modal = ({title, children}:{title:string, children:any}) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
    <div className="bg-white rounded-3xl p-10 w-full max-w-lg">
      <h3 className="text-2xl font-black mb-6">{title}</h3>
      {children}
    </div>
  </div>
);

export default AdminPortal;
