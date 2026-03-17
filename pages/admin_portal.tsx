
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'pricing' | 'slots' | 'lockers'>('bookings');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [rentals, setRentals] = useState<LockerReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingRentals, setIsLoadingRentals] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showCustomBroadcast, setShowCustomBroadcast] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('offer_waterpark');
  const [customNumbers, setCustomNumbers] = useState('');

  const handleCustomBroadcast = async () => {
    if (!customTemplate.trim()) return alert("Please enter the Approved Template Name.");
    if (!customNumbers.trim()) return alert("Please enter at least one mobile number.");
    
    const numbers = customNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length >= 10);
    if (numbers.length === 0) return alert("No valid mobile numbers found.");

    if (!window.confirm(`Are you sure you want to send messages to ${numbers.length} numbers?`)) return;
    
    setIsBroadcasting(true);
    let successCount = 0;
    
    for (const mobile of numbers) {
      try {
        await fetch('/api/send-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            mobile, 
            templateName: customTemplate,
            promoImage: "https://lh3.googleusercontent.com/3RZ93oAVqtog6291LWQUCsBYhL0u5ULjCap1Pb3HAgPvhVMRoWq1gwUaVvheq0hAQt-7UUQdsMxKJPoPWg=s360-w360-h360"
          })
        });
        successCount++;
      } catch (e) { console.error(e); }
    }
    
    setIsBroadcasting(false);
    alert(`Broadcast complete! Sent to ${successCount} numbers.`);
    setShowCustomBroadcast(false);
  };

  const fetchRentals = async () => {
    setIsLoadingRentals(true);
    try {
      const data = await cloudSync.fetchRentals();
      if (Array.isArray(data)) setRentals(data);
    } catch (e) {
      console.error("Rental sync error", e);
    } finally {
      setIsLoadingRentals(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setDraft({ ...settings, blockedSlots: Array.isArray(settings.blockedSlots) ? settings.blockedSlots : [] });
    }
    fetchRentals();
  }, [settings]);

  const stats = useMemo(() => {
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    const safeRentals = Array.isArray(rentals) ? rentals : [];
    
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayVisits = safeBookings.filter(b => b.date === todayStr);
    const totalAdults = todayVisits.reduce((s, b) => s + (Number(b.adults) || 0), 0);
    const totalKids = todayVisits.reduce((s, b) => s + (Number(b.kids) || 0), 0);
    const revenue = todayVisits.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
    const checkedIn = todayVisits.filter(b => b.status === 'checked-in').reduce((s, b) => s + (Number(b.adults) || 0) + (Number(b.kids) || 0), 0);

    const activeRentals = safeRentals.filter(r => r.status === 'issued');
    const securityHeld = activeRentals.reduce((s, r) => s + (Number(r.refundableAmount) || 0), 0);
    const maleBusy = activeRentals.flatMap(r => r.maleLockers || []).length;
    const femaleBusy = activeRentals.flatMap(r => r.femaleLockers || []).length;

    return { 
      revenue: revenue || 0, 
      totalBookings: todayVisits.length, 
      totalGuests: totalAdults + totalKids, 
      checkedIn: checkedIn || 0,
      activeRentals: activeRentals.length,
      securityHeld: securityHeld || 0,
      maleBusy,
      femaleBusy
    };
  }, [bookings, rentals]);

  const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter(b => 
    (b.id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (b.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (b.mobile && b.mobile.includes(searchTerm))
  ).slice(0, 50);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const success = await cloudSync.saveSettings(draft);
      if (success) {
        onUpdateSettings(draft);
        alert("Success: Admin settings saved to cloud!");
      } else {
        alert("Failed to save settings. Check your internet connection.");
      }
    } catch (e) {
      alert("Error: Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetShift = async () => {
    if (!window.confirm("Warning: Mark all lockers as returned?")) return;
    const success = await cloudSync.checkoutShift();
    if (success) { fetchRentals(); alert("Shift Reset Done."); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative border border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-3">Today's Revenue (IST)</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-4 w-full">
               <div className="bg-white/5 p-6 rounded-3xl text-center"><p className="text-[9px] font-black opacity-40 uppercase">Total Guests</p><p className="text-2xl font-black">{stats.totalGuests}</p></div>
               <div className="bg-emerald-500/10 p-6 rounded-3xl text-center"><p className="text-[9px] font-black text-emerald-400 uppercase">Inside Park</p><p className="text-2xl font-black text-emerald-400">{stats.checkedIn}</p></div>
            </div>
            
            <button 
              onClick={() => setShowCustomBroadcast(!showCustomBroadcast)}
              className="w-full md:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg"
            >
              <i className="fas fa-bullhorn mr-2"></i>
              WhatsApp Promotion
            </button>
          </div>
        </div>

        {showCustomBroadcast && (
          <div className="mt-10 p-8 bg-white/5 rounded-[2rem] border border-white/10 space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400">Custom WhatsApp Broadcast</h4>
              <button onClick={() => setShowCustomBroadcast(false)} className="text-white/40 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/50 px-2">Approved Template Name</label>
                <input 
                  type="text" 
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[10px] text-white w-full focus:outline-none focus:border-emerald-500"
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  placeholder="e.g. offer_waterpark"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/50 px-2">Mobile Numbers (Comma or Newline separated)</label>
                <textarea 
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[10px] text-white w-full h-24 focus:outline-none focus:border-emerald-500"
                  value={customNumbers}
                  onChange={(e) => setCustomNumbers(e.target.value)}
                  placeholder="919876543210, 918877665544"
                />
              </div>
            </div>

            <button 
              onClick={handleCustomBroadcast}
              disabled={isBroadcasting}
              className="w-full bg-emerald-500 text-slate-900 py-4 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {isBroadcasting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Sending...</> : 'Send Promotional Messages'}
            </button>
          </div>
        )}
        <div className="flex flex-wrap justify-center bg-white/5 p-1.5 rounded-2xl mt-12 gap-1 border border-white/10">
            {['bookings', 'lockers', 'pricing', 'slots'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>{tab}</button>
            ))}
        </div>
      </div>

      <div className="glass-card rounded-[3rem] p-8 md:p-12 min-h-[500px]">
        {activeTab === 'bookings' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Recent Bookings</h3>
              <input type="text" placeholder="Search..." className="input-premium max-w-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100"><th className="pb-4 px-2">ID</th><th className="pb-4 px-2">Guest</th><th className="pb-4 px-2">Date/Slot</th><th className="pb-4 px-2">Pax</th><th className="pb-4 px-2">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBookings.map(b => (
                    <tr key={b.id} className="text-xs font-bold text-slate-700">
                      <td className="py-4 px-2 text-blue-600 uppercase">{b.id}</td>
                      <td className="py-4 px-2"><p className="font-black text-slate-900 uppercase">{b.name}</p><p className="text-[10px] opacity-50">{b.mobile}</p></td>
                      <td className="py-4 px-2 uppercase">{b.date}<br/>{(b.time || "").split(':')[0]}</td>
                      <td className="py-4 px-2">{Number(b.adults) + Number(b.kids)}</td>
                      <td className="py-4 px-2"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${b.status === 'checked-in' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lockers' && (
          <div className="space-y-10">
             <div className="flex justify-between items-center"><h3 className="text-2xl font-black uppercase text-slate-900">Locker Management</h3><div className="flex gap-2">
                <button onClick={fetchRentals} className="bg-slate-100 px-4 py-2 rounded-xl text-[9px] font-black uppercase">{isLoadingRentals ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-sync"></i>} Refresh</button>
                <button onClick={handleResetShift} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase">Reset Shift</button>
                <button onClick={() => navigate('/admin-lockers')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Detailed View</button>
             </div></div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Active Issued</p><p className="text-2xl font-black">{stats.activeRentals}</p></div>
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center"><p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Security Cash</p><p className="text-2xl font-black text-emerald-700">₹{stats.securityHeld}</p></div>
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center"><p className="text-[9px] font-black text-blue-400 uppercase mb-1">M-Busy</p><p className="text-2xl font-black text-blue-600">{stats.maleBusy}</p></div>
                <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100 text-center"><p className="text-[9px] font-black text-pink-400 uppercase mb-1">F-Busy</p><p className="text-2xl font-black text-pink-600">{stats.femaleBusy}</p></div>
             </div>
             <div className="overflow-x-auto"><table className="w-full text-left">
                <thead><tr className="text-[10px] font-black uppercase text-slate-400 border-b"><th className="pb-4 px-2">Receipt</th><th className="pb-4 px-2">Guest</th><th className="pb-4 px-2">Numbers</th><th className="pb-4 px-2">Deposit</th><th className="pb-4 px-2">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                   {(Array.isArray(rentals) ? rentals : []).filter(r => r.status === 'issued').map(r => (
                     <tr key={r.receiptNo} className="text-xs font-bold text-slate-700">
                        <td className="py-4 px-2 text-blue-600">{r.receiptNo}</td>
                        <td className="py-4 px-2 uppercase">{r.guestName}</td>
                        <td className="py-4 px-2">{r.maleLockers.length > 0 && <span className="text-blue-500 mr-2">M:{(r.maleLockers || []).join(',')}</span>}{r.femaleLockers.length > 0 && <span className="text-pink-500">F:{(r.femaleLockers || []).join(',')}</span>}</td>
                        <td className="py-4 px-2">₹{r.securityDeposit}</td>
                        <td className="py-4 px-2"><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">ISSUED</span></td>
                     </tr>
                   ))}
                </tbody>
             </table></div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="max-w-2xl mx-auto space-y-10">
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4"><h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Morning Shift Rates</h4><div className="space-y-3">
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 px-2">Adult Rate</label><input type="number" className="input-premium" value={draft.morningAdultRate} onChange={e=>setDraft({...draft, morningAdultRate: parseInt(e.target.value) || 0})} /></div>
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 px-2">Kid Rate</label><input type="number" className="input-premium" value={draft.morningKidRate} onChange={e=>setDraft({...draft, morningKidRate: parseInt(e.target.value) || 0})} /></div>
                </div></div>
                <div className="space-y-4"><h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Evening Shift Rates</h4><div className="space-y-3">
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 px-2">Adult Rate</label><input type="number" className="input-premium" value={draft.eveningAdultRate} onChange={e=>setDraft({...draft, eveningAdultRate: parseInt(e.target.value) || 0})} /></div>
                   <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 px-2">Kid Rate</label><input type="number" className="input-premium" value={draft.eveningKidRate} onChange={e=>setDraft({...draft, eveningKidRate: parseInt(e.target.value) || 0})} /></div>
                </div></div>
             </div>
             <button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl disabled:opacity-50">
                {isSaving ? <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</> : 'Update All Pricing'}
             </button>
          </div>
        )}

        {activeTab === 'slots' && (
          <div className="max-w-2xl mx-auto space-y-10">
             <div className="text-center space-y-2"><h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Block Special Dates</h3></div>
             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="grid grid-cols-2 gap-4"><input type="date" className="input-premium" id="new-block-date" /><select className="input-premium" id="new-block-shift"><option value="morning">Morning Only</option><option value="evening">Evening Only</option><option value="all">Full Day</option></select></div>
                <button onClick={() => {
                  const d = (document.getElementById('new-block-date') as HTMLInputElement).value;
                  const s = (document.getElementById('new-block-shift') as HTMLSelectElement).value as ShiftType;
                  if (!d) return alert("Select a date");
                  setDraft({...draft, blockedSlots: [...(Array.isArray(draft.blockedSlots) ? draft.blockedSlots : []), { date: d, shift: s }]});
                }} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg">Add Blocked Slot</button>
             </div>
             <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 px-4">Currently Blocked</p>
                {(!Array.isArray(draft.blockedSlots) || draft.blockedSlots.length === 0) ? (
                  <p className="p-6 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 uppercase text-center border border-dashed">No slots blocked.</p>
                ) : (
                  draft.blockedSlots.map((bs, i) => (
                    <div key={i} className="bg-white border p-4 rounded-2xl flex justify-between items-center px-6 shadow-sm"><span className="font-black text-xs text-slate-900">{bs.date} — {bs.shift.toUpperCase()}</span>
                       <button onClick={() => setDraft({...draft, blockedSlots: (draft.blockedSlots || []).filter((_, idx) => idx !== i)})} className="text-red-500 text-xs font-black uppercase px-3 py-1 rounded-lg">Remove</button>
                    </div>
                  ))
                )}
             </div>
             <button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-sm shadow-xl disabled:opacity-50">
                {isSaving ? <><i className="fas fa-spinner fa-spin mr-2"></i> Syncing to Cloud...</> : 'Save Availability Changes'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminPortal;
