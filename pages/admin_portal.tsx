
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'marketing' | 'settings'>('bookings');
  const [viewMode, setViewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Migration Diagnostic States
  const [testToken, setTestToken] = useState('');
  const [testPhoneId, setTestPhoneId] = useState('');
  const [testMobile, setTestMobile] = useState('');
  const [diagStatus, setDiagStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');
  const [diagInfo, setDiagInfo] = useState<any>(null);
  const [apiHealth, setApiHealth] = useState<any>({ token: false, phone: false });

  // Marketing States
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    setDraft(settings);
    checkApiHealth();
  }, [settings]);

  const checkApiHealth = async () => {
    try {
      const res = await fetch('/api/booking?type=health');
      if (res.ok) {
        const data = await res.json();
        setApiHealth(data);
      }
    } catch (e) {
      console.error("Health check failed");
    }
  };

  const runDiagnostic = async () => {
    if (!testToken || !testPhoneId || !testMobile) return alert("Please fill Token, Phone ID and a Mobile number to test.");
    setDiagStatus('loading');
    setDiagInfo(null);
    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testToken, phoneId: testPhoneId, mobile: testMobile })
      });
      const data = await res.json();
      if (res.ok) {
        setDiagStatus('success');
        setDiagInfo(data);
      } else {
        setDiagStatus('fail');
        setDiagInfo(data);
      }
    } catch (e: any) {
      setDiagStatus('fail');
      setDiagInfo({ details: e.message });
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return alert("Please enter a message");
    setIsBroadcasting(true);
    try {
      const targets = Array.from(new Set(bookings.map(b => b.mobile)));
      const res = await fetch('/api/booking?type=broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets, message: broadcastMsg })
      });
      if (res.ok) alert("Broadcast sent successfully!");
      else alert("Broadcast failed. Check API balance/settings.");
    } catch (e) {
      alert("Error sending broadcast.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const stats = useMemo(() => {
    const list = viewMode === 'sales_today' ? bookings.filter(b => b.createdAt.includes(new Date().toLocaleDateString("en-IN"))) : bookings;
    return {
      revenue: list.reduce((s, b) => s + b.totalAmount, 0),
      tickets: list.length,
      adults: list.reduce((s, b) => s + b.adults, 0),
      kids: list.reduce((s, b) => s + b.kids, 0)
    };
  }, [bookings, viewMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-10">
      <div className="bg-[#1B2559] text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="text-center lg:text-left">
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-60 mb-2">Resort Dashboard</p>
          <h2 className="text-5xl font-black">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Today's Revenue</p>
        </div>

        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}>Bookings</button>
            <button onClick={() => setActiveTab('marketing')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='marketing' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}>Marketing</button>
            <button onClick={() => setActiveTab('settings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}>Migration</button>
        </div>
      </div>

      {activeTab === 'bookings' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard label="Total Tickets" value={stats.tickets} color="text-blue-600" />
           <StatCard label="Adults" value={stats.adults} color="text-indigo-600" />
           <StatCard label="Children" value={stats.kids} color="text-pink-600" />
           <StatCard label="Last Sync" value={new Date().toLocaleTimeString()} color="text-emerald-600" />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-10 animate-slide-up">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
              <div>
                 <h3 className="text-2xl font-black uppercase text-slate-900">Direct API Test</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Testing Template: <strong>booked_ticket</strong></p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Paste Permanent Token</label>
                    <textarea value={testToken} onChange={e => setTestToken(e.target.value)} placeholder="EAAG..." className="input-premium h-20 text-[10px] font-mono" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number ID</label>
                    <input value={testPhoneId} onChange={e => setTestPhoneId(e.target.value)} placeholder="138..." className="input-premium text-xs" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Test Number (WhatsApp)</label>
                    <input value={testMobile} onChange={e => setTestMobile(e.target.value)} placeholder="91..." className="input-premium text-xs" />
                 </div>

                 <button onClick={runDiagnostic} disabled={diagStatus === 'loading'} className="w-full btn-resort h-16 !bg-blue-600 shadow-xl">
                    {diagStatus === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane mr-2"></i>}
                    Send Template "booked_ticket"
                 </button>

                 {diagStatus === 'fail' && diagInfo && (
                   <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-4">
                      <p className="text-[11px] font-black uppercase text-red-600 tracking-widest">Meta API Error Log:</p>
                      <div className="text-[10px] font-bold text-red-800 space-y-1">
                         <p>Reason: {diagInfo.details}</p>
                         <p>Code: {diagInfo.code} / Subcode: {diagInfo.subcode}</p>
                         <p className="mt-2 text-[9px] opacity-60">Trace ID: {diagInfo.fb_trace_id}</p>
                      </div>

                      {diagInfo.code === 200 && (
                        <div className="pt-3 border-t border-red-200">
                           <p className="text-[10px] font-black text-red-700 uppercase">🔥 CRITICAL FIX FOR CODE 200:</p>
                           <p className="text-[9px] text-red-600 font-bold leading-relaxed mt-1">
                             Bhai, Meta Business Suite mein jaao &rarr; <strong>System Users</strong> &rarr; Select User &rarr; <strong>Add Assets</strong> dabao. Wahan "WhatsApp Business Account" select karke permission ON karke Save karo. Uske bina message nahi jayega.
                           </p>
                        </div>
                      )}
                   </div>
                 )}
                 
                 {diagStatus === 'success' && (
                   <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-900">Template Delivered!</p>
                      </div>
                      <p className="text-[9px] text-emerald-700 font-bold">Aapke number par 'booked_ticket' template wala message aa gaya hoga.</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-6 shadow-2xl border border-white/10">
                 <h4 className="text-xl font-black uppercase text-blue-400">Live Flow Steps</h4>
                 <div className="space-y-4 text-[11px] font-medium text-slate-400 leading-relaxed">
                    <p className="flex items-start gap-3">
                       <i className="fas fa-check text-blue-400 mt-0.5"></i>
                       <span><strong>Template 'booked_ticket':</strong> Humne ise test ke liye set kar diya hai.</span>
                    </p>
                    <p className="flex items-start gap-3">
                       <i className="fas fa-cog text-blue-400 mt-0.5"></i>
                       <span><strong>1. Assets:</strong> Meta Business Settings &rarr; System Users &rarr; Select User &rarr; <strong>Add Assets</strong>. WhatsApp Account select karein aur Manage Permissions ON karein.</span>
                    </p>
                    <p className="flex items-start gap-3">
                       <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
                       <span><strong>Parameters ({"{{1}}"}, {"{{2}}"}):</strong> Agar aapne template mein variables dale hain, toh mujhe batayein, hum code mein unhe pass kar denge. Abhi hum simple message bhej rahe hain.</span>
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Marketing Section */}
      {activeTab === 'marketing' && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto space-y-8 animate-slide-up">
           <div className="text-center">
              <h3 className="text-2xl font-black uppercase text-slate-900">Broadcast Center</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Marketing</p>
           </div>
           
           <div className="space-y-6">
              <textarea placeholder="Write your marketing message..." className="input-premium h-40" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
              <button onClick={handleBroadcast} disabled={isBroadcasting} className="w-full btn-resort h-16 !bg-slate-900 shadow-2xl">
                 {isBroadcasting ? 'Sending...' : 'Start Broadcast'}
              </button>
           </div>
        </div>
      )}

      <div className="flex justify-center gap-4 py-10">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Inventory Terminal</button>
          <button onClick={onLogout} className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100">Sign Out</button>
      </div>
    </div>
  );
};

const StatCard = ({label, value, color}:any) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-all">
    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

export default AdminPortal;
