
import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings, BlockedSlot, ShiftType } from '../types';
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'pricing' | 'slots'>('bookings');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for new blocked slot
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockShift, setNewBlockShift] = useState<ShiftType>('all');

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveSettings = async (updatedDraft?: AdminSettings) => {
    const settingsToSave = updatedDraft || draft;
    setIsSaving(true);
    const success = await cloudSync.saveSettings(settingsToSave);
    if (success) {
      onUpdateSettings(settingsToSave);
      if (!updatedDraft) alert("✅ Settings Updated Successfully.");
    } else {
      alert("❌ Update Failed. Check internet.");
    }
    setIsSaving(false);
  };

  const addBlockedSlot = () => {
    if (!newBlockDate) return alert("Select a date");
    const exists = draft.blockedSlots.some(s => s.date === newBlockDate && s.shift === newBlockShift);
    if (exists) return alert("This slot is already blocked.");

    const newSlots = [...(draft.blockedSlots || []), { date: newBlockDate, shift: newBlockShift }];
    const newDraft = { ...draft, blockedSlots: newSlots };
    setDraft(newDraft);
    saveSettings(newDraft);
    setNewBlockDate('');
  };

  const removeBlockedSlot = (index: number) => {
    const newSlots = draft.blockedSlots.filter((_, i) => i !== index);
    const newDraft = { ...draft, blockedSlots: newSlots };
    setDraft(newDraft);
    saveSettings(newDraft);
  };

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString("en-IN");
    const list = bookings.filter(b => b.createdAt.includes(today));
    return {
      revenue: list.reduce((s, b) => s + b.totalAmount, 0),
      tickets: list.length
    };
  }, [bookings]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Header Stat Card */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 text-center md:text-left">
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-3">Spray Water Park Jaipur</p>
          <h2 className="text-6xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-white/40 text-[10px] font-bold uppercase mt-2">{stats.tickets} Bookings Today</p>
        </div>
        <div className="relative z-10 flex flex-wrap justify-center bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
            <button onClick={() => setActiveTab('bookings')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Bookings</button>
            <button onClick={() => setActiveTab('pricing')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='pricing' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Pricing</button>
            <button onClick={() => setActiveTab('slots')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='slots' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Block Slots</button>
        </div>
      </div>

      {activeTab === 'pricing' && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10">
            <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Ticket Rates</h3>
                <button onClick={() => saveSettings()} className="bg-blue-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-sun"></i> Morning Slot Rates</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult Rate (₹)</label>
                            <input type="number" value={draft.morningAdultRate} onChange={e => setDraft({...draft, morningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid Rate (₹)</label>
                            <input type="number" value={draft.morningKidRate} onChange={e => setDraft({...draft, morningKidRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-moon"></i> Evening Slot Rates</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult Rate (₹)</label>
                            <input type="number" value={draft.eveningAdultRate} onChange={e => setDraft({...draft, eveningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid Rate (₹)</label>
                            <input type="number" value={draft.eveningKidRate} onChange={e => setDraft({...draft, eveningKidRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10">
            <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Block Visit Dates</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 items-end bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Select Date</label>
                    <input type="date" className="input-premium" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Select Shift</label>
                    <select className="input-premium" value={newBlockShift} onChange={e => setNewBlockShift(e.target.value as ShiftType)}>
                        <option value="all">Whole Day (All)</option>
                        <option value="morning">Morning Only</option>
                        <option value="evening">Evening Only</option>
                    </select>
                </div>
                <button onClick={addBlockedSlot} className="bg-slate-900 text-white h-[56px] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Block Date
                </button>
            </div>

            <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently Blocked Dates</p>
                {draft.blockedSlots && draft.blockedSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {draft.blockedSlots.map((slot, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                                <div>
                                    <p className="font-black text-slate-900 uppercase text-sm">{slot.date}</p>
                                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{slot.shift} blocked</p>
                                </div>
                                <button onClick={() => removeBlockedSlot(idx)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                    <i className="fas fa-trash-alt text-xs"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No dates are currently blocked.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Recent Activity</h3>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{bookings.length} Total</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr><th className="p-6 text-left">Ref ID</th><th className="text-left">Guest</th><th>Slot</th><th>Payment</th><th>Status</th></tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-left text-blue-600 font-black">{b.id}</td>
                    <td className="text-left py-4">
                        <p className="text-slate-900 font-black uppercase">{b.name}</p>
                        <p className="text-[9px] text-slate-400">{b.mobile}</p>
                    </td>
                    <td className="text-slate-600">{b.date}<br/>{b.time.split(':')[0]}</td>
                    <td className="font-black text-slate-900">₹{b.totalAmount}</td>
                    <td>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${b.status === 'checked-in' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {b.status === 'checked-in' ? 'VISITED' : 'PAID'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 py-6">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3">
            <i className="fas fa-key"></i> Locker Management
          </button>
          <button onClick={onLogout} className="bg-slate-200 text-slate-900 px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Logout</button>
      </div>
    </div>
  );
};

export default AdminPortal;
