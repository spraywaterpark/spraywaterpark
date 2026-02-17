
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookings' | 'pricing' | 'slots'>('bookings');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  
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
      alert("❌ Update Failed. Check internet or API credentials.");
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

  // Improved Stats for Today's Visit
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Filter bookings where visit date is TODAY
    const todayVisits = bookings.filter(b => b.date === todayStr);
    
    const totalAdults = todayVisits.reduce((s, b) => s + b.adults, 0);
    const totalKids = todayVisits.reduce((s, b) => s + b.kids, 0);
    const checkedInVisits = todayVisits.filter(b => b.status === 'checked-in');
    const checkedInGuests = checkedInVisits.reduce((s, b) => s + b.adults + b.kids, 0);
    const revenue = todayVisits.reduce((s, b) => s + b.totalAmount, 0);

    return {
      revenue,
      totalBookings: todayVisits.length,
      totalGuests: totalAdults + totalKids,
      checkedInGuests,
      pendingGuests: (totalAdults + totalKids) - checkedInGuests
    };
  }, [bookings]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Dynamic Header Stat Dashboard */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-3">Today's Live Report</p>
            <h2 className="text-6xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
            <p className="text-white/40 text-[10px] font-bold uppercase mt-2">Revenue from {stats.totalBookings} Bookings</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full md:w-auto">
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Total Guests</p>
                <p className="text-2xl font-black">{stats.totalGuests}</p>
             </div>
             <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 text-center">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Checked-In</p>
                <p className="text-2xl font-black text-emerald-400">{stats.checkedInGuests}</p>
             </div>
             <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 text-center hidden sm:block">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Pending Entry</p>
                <p className="text-2xl font-black text-amber-400">{stats.pendingGuests}</p>
             </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap justify-center bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl mt-12">
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Booking List</button>
            <button onClick={() => setActiveTab('pricing')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='pricing' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Edit Pricing</button>
            <button onClick={() => setActiveTab('slots')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='slots' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Date Blocking</button>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
          <button 
            onClick={() => navigate('/admin-lockers')} 
            className="group bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-between border-b-8 border-emerald-900"
          >
            <div className="text-left">
              <h3 className="text-2xl font-black uppercase tracking-tight">Locker Management</h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Issue, Return & Rental Reports</p>
            </div>
            <i className="fas fa-key text-4xl opacity-20 group-hover:opacity-100 transition-all"></i>
          </button>
          
          <button 
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/' + localStorage.getItem('swp_sheet_id'), '_blank')}
            className="group bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-between border-b-8 border-blue-900"
          >
            <div className="text-left">
              <h3 className="text-2xl font-black uppercase tracking-tight">Cloud Database</h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">View All Records in Google Sheets</p>
            </div>
            <i className="fas fa-table text-4xl opacity-20 group-hover:opacity-100 transition-all"></i>
          </button>
      </div>

      {activeTab === 'pricing' && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10 animate-slide-up">
            <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-xl font-black uppercase text-slate-900">Ticket Rates Management</h3>
                <button onClick={() => saveSettings()} className="bg-blue-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    {isSaving ? 'Processing...' : 'Sync Rates to Cloud'}
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-sun"></i> Morning Session</p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult Rate (₹)</label>
                            <input type="number" value={draft.morningAdultRate} onChange={e => setDraft({...draft, morningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid Rate (₹)</label>
                            <input type="number" value={draft.morningKidRate} onChange={e => setDraft({...draft, morningKidRate: parseInt(e.target.value)})} className="input-premium font-bold text-lg" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-moon"></i> Evening Session</p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult Rate (₹)</label>
                            <input type="number" value={draft.eveningAdultRate} onChange={e => setDraft({...draft, eveningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid Rate (₹)</label>
                            <input type="number" value={draft.eveningKidRate} onChange={e => setDraft({...draft, eveningKidRate: parseInt(e.target.value)})} className="input-premium font-bold text-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-10 animate-slide-up">
            <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-xl font-black uppercase text-slate-900">Park Capacity Control</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 items-end bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Select Date to Block</label>
                    <input type="date" className="input-premium !bg-white/10 !text-white !border-white/20" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Select Shift</label>
                    <select className="input-premium !bg-white/10 !text-white !border-white/20" value={newBlockShift} onChange={e => setNewBlockShift(e.target.value as ShiftType)}>
                        <option value="all">Whole Day (All)</option>
                        <option value="morning">Morning Only</option>
                        <option value="evening">Evening Only</option>
                    </select>
                </div>
                <button onClick={addBlockedSlot} className="bg-emerald-500 text-slate-900 h-[56px] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    Update Block List
                </button>
            </div>

            <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Currently Blocked Slots</p>
                {draft.blockedSlots && draft.blockedSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {draft.blockedSlots.map((slot, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border-2 border-slate-100 hover:border-red-200 transition-all group">
                                <div>
                                    <p className="font-black text-slate-900 uppercase text-sm">{slot.date}</p>
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{slot.shift} Blocked</p>
                                </div>
                                <button onClick={() => removeBlockedSlot(idx)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                    <i className="fas fa-trash-alt text-xs"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <i className="fas fa-calendar-check text-4xl text-slate-200 mb-4 block"></i>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">All slots are open for booking.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Recent Activity Log</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Live from Cloud Storage</p>
              </div>
              <div className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest">{bookings.length} Total Records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b">
                <tr>
                  <th className="p-6 text-left">Ref ID</th>
                  <th className="text-left">Guest Details</th>
                  <th>Visit Date</th>
                  <th>Session</th>
                  <th>Total Paid</th>
                  <th>Gate Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-slate-400 uppercase font-black text-sm">No bookings found yet.</td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id} className={`hover:bg-slate-50 transition-colors ${b.date === new Date().toISOString().split('T')[0] ? 'bg-blue-50/30' : ''}`}>
                    <td className="p-6 text-left text-blue-600 font-black tracking-tight">{b.id}</td>
                    <td className="text-left py-4">
                        <p className="text-slate-900 font-black uppercase text-sm tracking-tighter">{b.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{b.mobile}</p>
                    </td>
                    <td className="text-slate-600 uppercase text-[11px]">{b.date}</td>
                    <td className="text-slate-900 uppercase text-[10px] font-black">
                       <span className={`px-3 py-1 rounded-lg ${b.time.toLowerCase().includes('morning') ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                         {b.time.split(':')[0]}
                       </span>
                    </td>
                    <td className="font-black text-slate-900 text-base">₹{b.totalAmount}</td>
                    <td>
                      <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${b.status === 'checked-in' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                        {b.status === 'checked-in' ? 'VISITED' : 'PAID (CONFIRMED)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 py-10 opacity-60">
          <button onClick={onLogout} className="bg-slate-200 text-slate-900 px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all">Sign Out Admin</button>
      </div>
    </div>
  );
};

export default AdminPortal;
