
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
  const [diagError, setDiagError] = useState('');
  const [apiHealth, setApiHealth] = useState({ token: false, phone: false });

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
        setApiHealth({ token: data.whatsapp_token, phone: data.whatsapp_phone_id });
      }
    } catch (e) {
      console.error("Health check failed");
    }
  };

  const runDiagnostic = async () => {
    if (!testToken || !testPhoneId || !testMobile) return alert("Please fill Token, Phone ID and a Mobile number to test.");
    setDiagStatus('loading');
    setDiagError('');
    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testToken, phoneId: testPhoneId, mobile: testMobile })
      });
      const data = await res.json();
      if (res.ok) {
        setDiagStatus('success');
        alert("🎉 Balle Balle! Message Aa Gaya! Iska matlab naye IDs ekdum sahi hain.");
      } else {
        setDiagStatus('fail');
        setDiagError(data.details || "Meta Portal error. Check if permissions are assigned to System User.");
      }
    } catch (e: any) {
      setDiagStatus('fail');
      setDiagError(e.message);
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
      {/* GLOSSY HEADER */}
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
           {/* TEST TOOL */}
           <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
              <div>
                 <h3 className="text-2xl font-black uppercase text-slate-900">Direct API Test</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verify new IDs here</p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Paste New Permanent Token</label>
                    <textarea value={testToken} onChange={e => setTestToken(e.target.value)} placeholder="EAAG..." className="input-premium h-20 text-[10px] font-mono" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number ID</label>
                    <input value={testPhoneId} onChange={e => setTestPhoneId(e.target.value)} placeholder="138..." className="input-premium text-xs" />
                    <p className="text-[8px] text-slate-400 font-bold uppercase ml-1">Note: Ye purane wala hi ho sakta hai, wahi daal dein.</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Test Mobile (WhatsApp)</label>
                    <input value={testMobile} onChange={e => setTestMobile(e.target.value)} placeholder="91..." className="input-premium text-xs" />
                 </div>

                 <button onClick={runDiagnostic} disabled={diagStatus === 'loading'} className="w-full btn-resort h-16 !bg-blue-600 shadow-xl">
                    {diagStatus === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-vial mr-2"></i>}
                    Verify New Connection
                 </button>

                 {diagStatus === 'fail' && (
                   <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-600 font-bold uppercase">
                      Error: {diagError}
                   </div>
                 )}
                 {diagStatus === 'success' && (
                   <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] text-emerald-600 font-bold uppercase animate-bounce">
                      Success! Now update these values in Vercel settings.
                   </div>
                 )}
              </div>
           </div>

           {/* INSTRUCTIONS */}
           <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-6 shadow-2xl border border-white/10">
              <h4 className="text-xl font-black uppercase text-blue-400">Vercel Update Guide</h4>
              <div className="space-y-4 text-xs font-medium text-slate-400 leading-relaxed">
                 <p><span className="text-white font-black">1.</span> Login to <a href="https://vercel.com" target="_blank" className="text-blue-400 underline">Vercel Dashboard</a>.</p>
                 <p><span className="text-white font-black">2.</span> Projects {" -> "} Spray Aqua Resort {" -> "} Settings {" -> "} Environment Variables.</p>
                 <p><span className="text-white font-black">3.</span> Purane <code className="bg-white/10 p-1 rounded">WHATSAPP_TOKEN</code> aur <code className="bg-white/10 p-1 rounded">WHATSAPP_PHONE_ID</code> ko edit karke ye naye waale daal dein.</p>
                 <p><span className="text-white font-black">4.</span> **Redeploy** karein (Deployments {" -> "} Latest {" -> "} Redeploy) taaki naye settings chalu ho jayein.</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl flex items-start gap-4 mt-6">
                 <i className="fas fa-exclamation-triangle text-amber-500 mt-1"></i>
                 <p className="text-[10px] font-semibold text-amber-200 leading-relaxed">
                   Dhyan rahe: Jab tak aap Vercel mein update nahi karenge, aapki app purane IDs hi use karegi jo ki ab kaam nahi karenge.
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto space-y-8 animate-slide-up">
           <div className="text-center">
              <h3 className="text-2xl font-black uppercase text-slate-900">Broadcast Center</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Marketing (0% Margin)</p>
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
