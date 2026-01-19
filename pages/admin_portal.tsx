import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'marketing' | 'settings'>('bookings');
  const [viewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  // Migration Diagnostic States
  const [testToken, setTestToken] = useState('');
  const [testPhoneId, setTestPhoneId] = useState('');
  const [testMobile, setTestMobile] = useState('');
  const [diagStatus, setDiagStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');
  const [diagInfo, setDiagInfo] = useState<any>(null);

  // Marketing States
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveSettings = async () => {
    setIsSaving(true);
    const success = await cloudSync.saveSettings(draft);
    if (success) {
      onUpdateSettings(draft);
      alert("Settings Saved Successfully!");
    } else {
      alert("Failed to save settings to cloud.");
    }
    setIsSaving(false);
  };

  const runDiagnostic = async () => {
    if (!testToken || !testPhoneId || !testMobile) return alert("Please fill Token, Phone ID and a Mobile number to test.");
    setDiagStatus('loading');
    setDiagInfo(null);
    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: testToken, 
          phoneId: testPhoneId, 
          mobile: testMobile,
          templateName: draft.waTemplateName,
          langCode: draft.waLangCode
        })
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
      else alert("Broadcast failed.");
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
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase text-slate-900">API Setup</h3>
                 <button onClick={saveSettings} disabled={isSaving} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">
                    {isSaving ? 'Saving...' : 'Save Config'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Approved Template Name</label>
                        <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} placeholder="booked_ticket" className="input-premium text-xs" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Lang Code (Use 'en')</label>
                        <input value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} placeholder="en" className="input-premium text-xs" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Paste Permanent Token</label>
                    <textarea value={testToken} onChange={e => setTestToken(e.target.value)} placeholder="EAAG..." className="input-premium h-20 text-[10px] font-mono" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number ID</label>
                    <input value={testPhoneId} onChange={e => setTestPhoneId(e.target.value)} placeholder="138..." className="input-premium text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Test Mobile (With 91)</label>
                    <input value={testMobile} onChange={e => setTestMobile(e.target.value)} placeholder="91..." className="input-premium text-xs" />
                 </div>

                 <button onClick={runDiagnostic} disabled={diagStatus === 'loading'} className="w-full btn-resort h-16 !bg-blue-600 shadow-xl">
                    {diagStatus === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane mr-2"></i>}
                    Test Current Configuration
                 </button>

                 {diagStatus === 'fail' && diagInfo && (
                   <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-4">
                      {diagInfo.code === 132001 ? (
                        <div className="space-y-2">
                           <p className="text-[11px] font-black uppercase text-red-600 tracking-widest underline decoration-2">🚨 Error 132001: Template Mismatch</p>
                           <p className="text-[10px] font-bold text-red-800 leading-relaxed">
                              Bhai, Meta Manager mein aapki language "English" hai. 
                              Upar <strong>Lang Code</strong> ko <code>en</code> karke dobara test karein. 
                              Agar <code>en</code> fail ho, tabhi <code>en_US</code> try karein.
                           </p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-red-800">Error: {diagInfo.details}</p>
                      )}
                      <p className="text-[9px] opacity-60 italic">Trace ID: {diagInfo.fb_trace_id}</p>
                   </div>
                 )}
                 
                 {diagStatus === 'success' && (
                   <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-900">Success!</p>
                      </div>
                      <p className="text-[9px] text-emerald-700 font-bold">Message sent using "{draft.waTemplateName}" with language "{draft.waLangCode}". Please Save Config above.</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-8 shadow-2xl border border-white/10">
                <div className="flex items-center gap-4">
                    <i className="fas fa-info-circle text-blue-400 text-2xl"></i>
                    <h3 className="text-xl font-black uppercase tracking-tight">Solution for 132001</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        <p className="text-[9px] font-black uppercase text-blue-400">Step 1: Check Code</p>
                        <p className="text-xs font-medium text-slate-300 leading-relaxed">
                          Aapke screenshot ke hisaab se language "English" hai. Iska API code <strong>en</strong> hota hai. Use <code>en</code> in Lang Code field.
                        </p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        <p className="text-[9px] font-black uppercase text-blue-400">Step 2: Save Config</p>
                        <p className="text-xs font-medium text-slate-300 leading-relaxed">
                          Jab test success ho jaye, toh upar <strong>Save Config</strong> button dabana na bhulein! Tabhi booking system ise use karega.
                        </p>
                    </div>
                </div>
           </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 animate-slide-up max-w-2xl mx-auto">
           <div className="text-center">
              <h3 className="text-2xl font-black uppercase text-slate-900">Broadcast Message</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Outreach</p>
           </div>
           <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Type message..." className="input-premium h-32" />
           <button onClick={handleBroadcast} disabled={isBroadcasting} className="w-full btn-resort h-16 !bg-indigo-600 shadow-xl">
              {isBroadcasting ? 'Sending...' : 'Start Broadcast'}
           </button>
        </div>
      )}

      <div className="flex justify-center gap-4 py-10">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Inventory Terminal</button>
          <button onClick={onLogout} className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100">Sign Out</button>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
    <h4 className={`text-3xl font-black ${color}`}>{value}</h4>
  </div>
);

export default AdminPortal;
