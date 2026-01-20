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
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [diag, setDiag] = useState<{status: 'idle'|'loading'|'success'|'fail', msg: string, hint?: string}>({status: 'idle', msg: ''});

  useEffect(() => {
    if (activeTab !== 'settings') {
      setDraft(settings);
    }
  }, [settings, activeTab]);

  const applyScreenshotDefaults = () => {
    setDraft({
      ...draft,
      waTemplateName: 'booked_ticket',
      waLangCode: 'en',
      waVarCount: 1
    });
  };

  const saveSettings = async () => {
    setIsSaving(true);
    const success = await cloudSync.saveSettings(draft);
    if (success) {
      onUpdateSettings(draft);
      alert("Configuration Synced! Your WhatsApp is now active.");
    } else {
      alert("Sync failed. Check your Sheet/Network.");
    }
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!testMobile || testMobile.length < 10) return alert("Enter 10 digit number.");
    setDiag({status: 'loading', msg: 'Handshaking with Meta Cloud...'});

    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: testMobile, testConfig: draft })
      });
      const data = await res.json();
      
      if (res.ok) {
        setDiag({status: 'success', msg: 'Connected! Your Meta Dashboard should show 1 message sent.'});
      } else {
        setDiag({status: 'fail', msg: data.details || 'Blocked by Meta', hint: data.hint});
      }
    } catch (e: any) {
      setDiag({status: 'fail', msg: e.message});
    }
  };

  const stats = useMemo(() => {
    const list = bookings.filter(b => b.createdAt.includes(new Date().toLocaleDateString("en-IN")));
    return {
      revenue: list.reduce((s, b) => s + b.totalAmount, 0),
      tickets: list.length
    };
  }, [bookings]);

  const isConfigReady = draft.waToken && draft.waPhoneId;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10 animate-fade">
      {/* Dashboard Top Bar */}
      <div className="bg-[#0F172A] text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10">
        <div className="text-center md:text-left">
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.5em] mb-2">Live Revenue</p>
          <h2 className="text-5xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
        </div>
        <div className="flex bg-white/5 p-2 rounded-[1.5rem] border border-white/10 backdrop-blur-xl">
            <button onClick={() => setActiveTab('bookings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>Bookings</button>
            <button onClick={() => setActiveTab('settings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>WhatsApp API</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Main Config Form */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 animate-slide-up">
              <div className="flex justify-between items-start border-b pb-8">
                 <div>
                    <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">API Connector</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`w-2 h-2 rounded-full ${isConfigReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isConfigReady ? 'Configuration Ready' : 'Credentials Missing'}</p>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
                        {isSaving ? 'Syncing...' : 'Save & Active'}
                    </button>
                    <button onClick={applyScreenshotDefaults} className="text-[9px] font-black text-blue-600 uppercase border border-blue-100 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                        Auto-Fill (Screenshot)
                    </button>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</label>
                        <input autoComplete="off" value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium text-xs font-bold" placeholder="booked_ticket" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone ID</label>
                        <input autoComplete="off" value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium text-xs font-bold" placeholder="947..." />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta Permanent Token</label>
                    <textarea autoComplete="off" value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium h-24 text-[10px] font-mono leading-relaxed bg-slate-50 border-dashed" placeholder="Paste EAAB... Token" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lang Code</label>
                        <input autoComplete="off" value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium text-xs font-bold" placeholder="en" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name Variable</label>
                        <select value={draft.waVarCount} onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value)})} className="input-premium text-xs font-bold bg-white">
                           <option value={0}>Disabled</option>
                           <option value={1}>Enable (Guest Name in {"{{1}}"})</option>
                        </select>
                    </div>
                 </div>

                 <div className="pt-8 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Connectivity Test</p>
                        <i className="fas fa-microchip text-slate-200"></i>
                    </div>
                    <div className="flex gap-2">
                        <input autoComplete="off" value={testMobile} onChange={e => setTestMobile(e.target.value.replace(/\D/g,''))} placeholder="Verify with Mobile Number" className="flex-1 input-premium text-xs font-black tracking-widest" />
                        <button onClick={handleTest} disabled={diag.status === 'loading'} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">
                          {diag.status === 'loading' ? 'Verifying...' : 'Run Test'}
                        </button>
                    </div>
                    
                    {diag.status !== 'idle' && (
                      <div className={`p-5 rounded-2xl border-2 ${diag.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="flex items-center gap-3">
                           <i className={`fas ${diag.status === 'success' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-triangle text-red-500'}`}></i>
                           <p className={`text-[11px] font-black uppercase tracking-tight ${diag.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                              {diag.status === 'success' ? 'Handshake Successful' : 'Connection Blocked'}
                           </p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 mt-2 leading-relaxed">{diag.msg}</p>
                        {diag.hint && <div className="mt-3 p-2 bg-white/50 rounded-lg text-[9px] font-black text-red-500 uppercase border border-red-100">Hint: {diag.hint}</div>}
                      </div>
                    )}
                 </div>
              </div>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-8 shadow-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <i className="fab fa-whatsapp text-2xl"></i>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Checklist</h3>
                </div>
                <div className="space-y-6">
                  <div className="group border-l-2 border-white/10 pl-6 py-1 hover:border-blue-500 transition-colors">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Step 1: Template Name</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Aapke screenshot ke hisaab se hamesha <code className="bg-white/10 px-1.5 rounded text-white">booked_ticket</code> hi rakhein.</p>
                  </div>
                  <div className="group border-l-2 border-white/10 pl-6 py-1 hover:border-blue-500 transition-colors">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Step 2: English Code</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Meta dashboard mein agar "English" hai, toh yahan code hamesha <code className="bg-white/10 px-1.5 rounded text-white">en</code> hona chahiye.</p>
                  </div>
                  <div className="group border-l-2 border-white/10 pl-6 py-1 hover:border-blue-500 transition-colors">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Step 3: Variable (Name)</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Aapne template mein <code className="bg-white/10 px-1.5 rounded text-white">Name</code> variable add kiya hai, isliye "Name Variable" ko **1** par rakhein.</p>
                  </div>
                  <div className="group border-l-2 border-white/10 pl-6 py-1 hover:border-blue-500 transition-colors">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Step 4: Phone ID</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Aapke screenshot wala ID <code className="bg-white/10 px-1.5 rounded text-white">94751928437599</code> use karein.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center shadow-lg">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em] mb-6">Live Link Source</p>
                  <div className="flex gap-4">
                     <div className={`px-6 py-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${settings.waToken ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                        <i className={`fas ${settings.waToken ? 'fa-cloud-upload-alt' : 'fa-circle'}`}></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Active Cloud Settings</span>
                     </div>
                  </div>
                  <p className="mt-6 text-[9px] text-slate-400 font-bold leading-relaxed">Changes made here are saved to your Google Sheet and affect all users instantly.</p>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Reservation Stream</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live from Spray Aqua Resort</p>
              </div>
              <span className="bg-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{bookings.length} Total Sales</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-100 text-[11px] font-black uppercase text-slate-500 border-b">
                <tr><th className="p-8 text-left">Ref ID</th><th className="text-left">Guest Name</th><th>Tickets</th><th>Revenue</th><th>Status</th></tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-slate-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 text-left text-blue-600 font-black">{b.id}</td>
                    <td className="text-left">
                        <p className="text-slate-900 font-black">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.mobile}</p>
                    </td>
                    <td className="text-slate-500 font-black">{b.adults + b.kids}</td>
                    <td className="text-slate-900 font-black text-lg">₹{b.totalAmount}</td>
                    <td><span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Confirmed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-4 py-10 border-t border-slate-100">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Locker Management</button>
          <button onClick={onLogout} className="bg-slate-100 text-slate-900 px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all">Sign Out</button>
      </div>
    </div>
  );
};

export default AdminPortal;
