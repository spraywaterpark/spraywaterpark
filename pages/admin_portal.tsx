
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
  
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockShift, setNewBlockShift] = useState<ShiftType>('all');

  useEffect(() => {
    setDraft(settings);
    // Fetch locker data for the dashboard summary
    cloudSync.fetchRentals().then(data => {
      if (data) setRentals(data);
    });
  }, [settings]);

  const saveSettings = async (updatedDraft?: AdminSettings) => {
    const settingsToSave = updatedDraft || draft;
    setIsSaving(true);
    const success = await cloudSync.saveSettings(settingsToSave);
    if (success) {
      onUpdateSettings(settingsToSave);
      if (!updatedDraft) alert("✅ Settings Synced to Cloud.");
    } else {
      alert("❌ Sync Failed. Check internet connection.");
    }
    setIsSaving(false);
  };

  const addBlockedSlot = () => {
    if (!newBlockDate) return alert("Select a date");
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
    const todayStr = new Date().toISOString().split('T')[0];
    const todayVisits = bookings.filter(b => b.date === todayStr);
    const totalAdults = todayVisits.reduce((s, b) => s + b.adults, 0);
    const totalKids = todayVisits.reduce((s, b) => s + b.kids, 0);
    const checkedInGuests = todayVisits.filter(b => b.status === 'checked-in').reduce((s, b) => s + b.adults + b.kids, 0);
    const revenue = todayVisits.reduce((s, b) => s + b.totalAmount, 0);

    // Locker stats for dashboard
    const activeLockers = rentals.filter(r => r.status === 'issued').length;

    return { 
      revenue, 
      totalBookings: todayVisits.length, 
      totalGuests: totalAdults + totalKids, 
      checkedInGuests, 
      activeLockers,
      pendingGuests: (totalAdults + totalKids) - checkedInGuests 
    };
  }, [bookings, rentals]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Dashboard Summary Card */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-3">Today's Performance</p>
            <h2 className="text-6xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
            <p className="text-white/40 text-[10px] font-bold uppercase mt-2">{stats.totalBookings} Reservations</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full md:w-auto">
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Total Guests</p>
                <p className="text-2xl font-black">{stats.totalGuests}</p>
             </div>
             <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 text-center">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Inside Park</p>
                <p className="text-2xl font-black text-emerald-400">{stats.checkedInGuests}</p>
             </div>
             <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 text-center col-span-2 md:col-span-1">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Lockers Occupied</p>
                <p className="text-2xl font-black text-blue-400">{stats.activeLockers}</p>
             </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap justify-center bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl mt-12 gap-1">
            <button onClick={() => setActiveTab('bookings')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Bookings</button>
            <button onClick={() => setActiveTab('pricing')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='pricing' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Ticket Rates</button>
            <button onClick={() => setActiveTab('slots')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='slots' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Blocked Dates</button>
            <button onClick={() => navigate('/admin-lockers')} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-white/10 transition-all border border-emerald-500/20">Locker & Costume <i className="fas fa-external-link-alt ml-2"></i></button>
        </div>
      </div>

      {activeTab === 'pricing' && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10 animate-slide-up">
            <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-xl font-black uppercase text-slate-900">Manage Ticket Pricing</h3>
                <button onClick={() => saveSettings()} className="bg-blue-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {isSaving ? 'Processing...' : 'Sync to Cloud'}
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-sun"></i> Morning Session</p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult (₹)</label>
                            <input type="number" value={draft.morningAdultRate} onChange={e => setDraft({...draft, morningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid (₹)</label>
                            <input type="number" value={draft.morningKidRate} onChange={e => setDraft({...draft, morningKidRate: parseInt(e.target.value)})} className="input-premium font-bold text-lg" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-moon"></i> Evening Session</p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult (₹)</label>
                            <input type="number" value={draft.eveningAdultRate} onChange={e => setDraft({...draft, eveningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid (₹)</label>
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
                <h3 className="text-xl font-black uppercase text-slate-900">Blocked Slots & Holidays</h3>
            </div>
            
            <div className="grid md:grid-cols-12 gap-6 items-end bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl">
                <div className="md:col-span-4 space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Select Date</label>
                    <input type="date" className="input-premium !bg-white/10 !text-white !border-white/20 h-16" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)} />
                </div>
                
                <div className="md:col-span-5 space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Select Slot to Block</label>
                    <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20 h-16">
                        <button 
                            onClick={() => setNewBlockShift('morning')} 
                            className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${newBlockShift === 'morning' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            Morning
                        </button>
                        <button 
                            onClick={() => setNewBlockShift('evening')} 
                            className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${newBlockShift === 'evening' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            Evening
                        </button>
                        <button 
                            onClick={() => setNewBlockShift('all')} 
                            className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${newBlockShift === 'all' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            Full Day
                        </button>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <button 
                        onClick={addBlockedSlot} 
                        className="w-full bg-emerald-500 text-slate-900 h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-400 active:scale-95 transition-all"
                    >
                        {isSaving ? 'SYNCING...' : 'Block Slot'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {draft.blockedSlots?.length === 0 ? (
                    <div className="md:col-span-3 p-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                        <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-xs">No active restrictions</p>
                    </div>
                ) : draft.blockedSlots?.map((slot, idx) => {
                    const isMorning = slot.shift === 'morning';
                    const isEvening = slot.shift === 'evening';
                    const isAll = slot.shift === 'all';

                    return (
                        <div key={idx} className="flex justify-between items-center bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-slate-300 transition-all group">
                            <div className="space-y-1">
                                <p className="font-black text-slate-900 uppercase text-base tracking-tighter">{slot.date}</p>
                                <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                    isMorning ? 'bg-orange-100 text-orange-600' : 
                                    isEvening ? 'bg-indigo-100 text-indigo-600' : 
                                    'bg-red-100 text-red-600'
                                }`}>
                                    {slot.shift === 'all' ? 'Full Day' : slot.shift} Blocked
                                </span>
                            </div>
                            <button onClick={() => removeBlockedSlot(idx)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-inner">
                                <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Booking History</h3>
              <div className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest">{bookings.length} Records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b">
                <tr><th className="p-6 text-left">Ref ID</th><th className="text-left">Guest Name</th><th>Visit Date</th><th>Shift</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-left text-blue-600 font-black">{b.id}</td>
                    <td className="text-left py-4"><p className="text-slate-900 font-black uppercase text-sm">{b.name}</p><p className="text-[10px] text-slate-400 font-bold">{b.mobile}</p></td>
                    <td className="text-slate-600 uppercase text-[11px]">{b.date}</td>
                    <td className="text-slate-900 uppercase text-[10px] font-black"><span className={`px-3 py-1 rounded-lg ${b.time.toLowerCase().includes('morning') ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{b.time.split(':')[0]}</span></td>
                    <td className="font-black text-slate-900 text-base">₹{b.totalAmount}</td>
                    <td><span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${b.status === 'checked-in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{b.status === 'checked-in' ? 'CHECKED-IN' : 'PAID'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex justify-center gap-4 py-10 opacity-60">
          <button onClick={onLogout} className="bg-slate-200 text-slate-900 px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]">Logout Management</button>
      </div>
    </div>
  );
};

export default AdminPortal;
