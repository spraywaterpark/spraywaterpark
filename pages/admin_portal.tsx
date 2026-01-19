
import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings, BlockedSlot, ShiftType } from '../types';
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
  const [showGuide, setShowGuide] = useState(false);

  // Health Stats
  const [apiHealth, setApiHealth] = useState({ token: false, phone: false });

  const [blkDate, setBlkDate] = useState('');

  useEffect(() => {
    setDraft(settings);
    checkApiHealth();
  }, [settings]);

  const checkApiHealth = async () => {
    try {
      const res = await fetch('/api/booking?type=health');
      if (res.ok) {
        const data = await res.json();
        setApiHealth({ token: data.whatsapp_token, phone: data.whatsapp_phone_id });
      }
    } catch (e) {
      console.error("Health check failed");
    }
  };

  useEffect(() => setLastUpdated(new Date().toLocaleTimeString()), [bookings]);

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const todayLocale = today.toLocaleDateString("en-IN");

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (viewMode === 'sales_today') {
      return list.filter(b => b.createdAt.includes(todayLocale) || b.createdAt.startsWith(todayISO));
    }
    if (viewMode === 'visit_today') {
      return list.filter(b => b.date === todayISO);
    }
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
      const remoteSettings = await cloudSync.fetchSettings();
      if (remoteSettings) onUpdateSettings(remoteSettings);
      await cloudSync.fetchData(syncId || MASTER_SYNC_ID);
      setLastUpdated(new Date().toLocaleTimeString());
      checkApiHealth();
    } catch (e) {
      console.error("Manual refresh failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const addFullDayBlackout = () => {
    if (!blkDate) return alert("Select a date");
    const currentBlocked = draft.blockedSlots || [];
    const updatedSlots = currentBlocked.filter(s => s.date !== blkDate);
    setDraft({ ...draft, blockedSlots: [...updatedSlots, { date: blkDate, shift: 'all' }] });
  };

  const handleSaveSettings = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const success = await cloudSync.saveSettings(draft);
      if (success) {
        onUpdateSettings(draft);
        alert("Success: Resort settings saved!");
        setActiveTab('bookings');
      } else {
        alert("Error: Cloud Sync failed.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
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
            Live Sales Dashboard
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
          <h2 className="text-3xl sm:text-5xl font-black mt-2">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-blue-200 text-sm font-bold mt-1">{viewMode === 'sales_today' ? "Today's Revenue" : viewMode === 'visit_today' ? "Revenue for Visitors Today" : "Total Revenue"}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex gap-2">
            <button onClick={() => setViewMode('sales_today')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all ${viewMode==='sales_today' ? 'bg-white text-slate-900' : 'hover:bg-white/10'}`}>Today Sales</button>
            <button onClick={() => setViewMode('visit_today')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all ${viewMode==='visit_today' ? 'bg-white text-slate-900' : 'hover:bg-white/10'}`}>Today Visits</button>
            <button onClick={() => setViewMode('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all ${viewMode==='all' ? 'bg-white text-slate-900' : 'hover:bg-white/10'}`}>All Data</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Tickets" value={stats.tickets} />
        <Stat label="Adults" value={stats.adults} />
        <Stat label="Kids" value={stats.kids} />
        <Stat label="Last Sync" value={lastUpdated} />
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-[900px] w-full text-center">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="p-5 text-left">Timestamp</th>
                <th>Guest Name</th>
                <th>Mobile</th>
                <th>Visit Date</th>
                <th>Passes</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-slate-300 font-bold uppercase text-xs tracking-widest">No matching records found</td></tr>
              ) : filteredBookings.map((b, i) => (
                <tr key={i} className="border-t hover:bg-slate-50 transition-colors text-sm">
                  <td className="p-5 text-left font-medium text-slate-400 text-[10px]">{b.createdAt}</td>
                  <td className="font-semibold">{b.name}</td>
                  <td className="font-medium text-slate-500">{b.mobile}</td>
                  <td className="font-bold text-blue-600">{b.date}</td>
                  <td>{b.adults + b.kids}</td>
                  <td className="font-black text-slate-900">₹{b.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={manualRefresh} disabled={isSyncing} className="btn-resort !px-8 h-14 !bg-slate-800 disabled:opacity-50">
           <i className={`fas fa-sync-alt mr-2 text-xs ${isSyncing ? 'fa-spin' : ''}`}></i> {isSyncing ? 'Refreshing...' : 'Refresh Cloud Data'}
        </button>
        <button onClick={() => setActiveTab('settings')} className="btn-resort !px-8 h-14">
           <i className="fas fa-cog mr-2 text-xs"></i> WhatsApp & Resort Rates
        </button>
        <button onClick={() => window.location.hash = '#/admin-lockers'} className="btn-resort !px-8 h-14 !bg-emerald-600 hover:!bg-emerald-700">
          <i className="fas fa-box mr-2 text-xs"></i> CO&LO LOGIN
        </button>
      </div>

      {activeTab === 'settings' && (
        <Modal title="System Configuration" onClose={() => setActiveTab('bookings')}>
          <div className="space-y-8 max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
            
            {/* WHATSAPP STATUS & HELP */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta API (Vercel Variables)</h4>
                <button onClick={() => setShowGuide(true)} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                  <i className="fas fa-question-circle"></i> Need Help?
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <div className={`p-4 rounded-xl border flex justify-between items-center ${apiHealth.token && apiHealth.phone ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="text-[10px] font-bold uppercase text-slate-600">API Readiness</span>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${apiHealth.token && apiHealth.phone ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                       {apiHealth.token && apiHealth.phone ? 'CONNECTED' : 'WAITING FOR VERCEL'}
                    </span>
                 </div>
                 <p className="text-[9px] text-slate-400 italic text-center font-bold px-4">WhatsApp config is managed in Vercel settings for security.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Ticket Rates (₹)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Morning Adult</label>
                  <input type="number" className="input-premium py-3" value={draft.morningAdultRate} onChange={e => setDraft({...draft, morningAdultRate: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Evening Adult</label>
                  <input type="number" className="input-premium py-3" value={draft.eveningAdultRate} onChange={e => setDraft({...draft, eveningAdultRate: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Blackout Management</h4>
              <div className="bg-slate-50 p-6 rounded-2xl space-y-5 border border-slate-200">
                <input type="date" className="input-premium py-3" value={blkDate} onChange={e => setBlkDate(e.target.value)} />
                <button onClick={addFullDayBlackout} className="w-full border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase py-4 rounded-xl">Block Full Day</button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 mt-6">
            <button onClick={handleSaveSettings} disabled={isSaving} className="btn-resort w-full h-16 shadow-2xl disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Resort Rates'}
            </button>
          </div>
        </Modal>
      )}

      {/* SETUP GUIDE MODAL */}
      {showGuide && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 z-[1200] animate-fade">
          <div className="bg-white rounded-[2.5rem] p-10 md:p-14 w-full max-w-2xl shadow-2xl relative border border-white/20">
            <button onClick={() => setShowGuide(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900"><i className="fas fa-times text-2xl"></i></button>
            
            <div className="mb-8">
               <h3 className="text-2xl font-black uppercase text-slate-900">WhatsApp Setup Guide</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mt-1">Check Display Name & Number</p>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-black text-slate-900 uppercase mb-3">How to see your Name/Number:</p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc ml-5 font-semibold">
                  <li>Go to <b>Meta for Developers</b> Dashboard.</li>
                  <li>Click <b>WhatsApp &gt; API Setup</b> in the left sidebar.</li>
                  <li>In the center of the screen, look for <b>"Step 5: Add a phone number"</b>. This is where you link your real resort number.</li>
                  <li>When linking, Meta asks for a <b>"Display Name"</b>. This is where you write <b>"Spray Water Park"</b>.</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <p className="text-[11px] font-black text-blue-900 uppercase mb-2">Vercel Config:</p>
                <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                  Once you get your Phone ID and Token from Meta, add them as <code>WHATSAPP_TOKEN</code> and <code>WHATSAPP_PHONE_ID</code> in your Vercel Dashboard Environment Variables.
                </p>
              </div>
            </div>

            <button onClick={() => setShowGuide(false)} className="w-full btn-resort mt-10 !bg-slate-900">Got it, thanks!</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({label, value}:{label:string, value:any}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
    <p className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] mb-1">{label}</p>
    <p className="text-2xl font-black text-[#1B2559]">{value}</p>
  </div>
);

const Modal = ({title, children, onClose}:{title:string, children:any, onClose: () => void}) => (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-6 z-[1000] no-print">
    <div className="bg-white rounded-[2.5rem] p-10 md:p-14 w-full max-w-xl shadow-2xl animate-slide-up relative border border-white/20">
      <button onClick={onClose} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900"><i className="fas fa-times text-2xl"></i></button>
      <div className="mb-10"><h3 className="text-3xl font-black uppercase text-slate-900 mb-2">{title}</h3></div>
      {children}
    </div>
  </div>
);

export default AdminPortal;
