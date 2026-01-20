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
  const [diag, setDiag] = useState<{status: 'idle'|'loading'|'success'|'fail', msg: string, hint?: string, raw?: any}>({status: 'idle', msg: ''});

  useEffect(() => {
    if (activeTab !== 'settings') {
      setDraft(settings);
    }
  }, [settings, activeTab]);

  const saveSettings = async () => {
    setIsSaving(true);
    const success = await cloudSync.saveSettings(draft);
    if (success) {
      onUpdateSettings(draft);
      alert("Config Synced Successfully!");
    } else {
      alert("Sync failed. Check cloud connection.");
    }
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!testMobile || testMobile.length < 10) return alert("Enter 10 digit number.");
    setDiag({status: 'loading', msg: 'Contacting Meta Servers...'});

    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: testMobile, testConfig: draft })
      });
      const data = await res.json();
      
      if (res.ok) {
        setDiag({status: 'success', msg: 'Meta Handshake Successful! Check your WhatsApp.'});
      } else {
        setDiag({status: 'fail', msg: data.details || 'Rejected by Meta', hint: data.hint, raw: data.raw});
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10 animate-fade">
      {/* Header Bar */}
      <div className="bg-[#0F172A] text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10">
        <div className="text-center md:text-left">
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.5em] mb-2">Resort Revenue (Today)</p>
          <h2 className="text-5xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
        </div>
        <div className="flex bg-white/5 p-2 rounded-[1.5rem] border border-white/10 backdrop-blur-xl">
            <button onClick={() => setActiveTab('bookings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>Bookings</button>
            <button onClick={() => setActiveTab('settings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>Meta API</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 animate-slide-up">
              <div className="flex justify-between items-start border-b pb-8">
                 <div>
                    <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">API Setup</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Message Configuration</p>
                 </div>
                 <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">
                    {isSaving ? 'Syncing...' : 'Save Config'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent Phone ID</label>
                        <input value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium text-xs font-bold" placeholder="E.g. 947519298437599" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</label>
                        <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium text-xs font-bold" placeholder="E.g. booked_ticket" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Access Token</label>
                    <textarea value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium h-28 text-[10px] font-mono leading-relaxed bg-slate-50" placeholder="Paste Permanent Token here..." />
                 </div>

                 <div className="grid grid-cols-2 gap-4 border-b pb-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lang Code</label>
                        <input value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium text-xs font-bold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Variables</label>
                        <select value={draft.waVarCount} onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value)})} className="input-premium text-xs font-bold bg-white">
                           <option value={0}>No Variables</option>
                           <option value={1}>1 Variable (Guest Name)</option>
                        </select>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Connection Diagnostics</p>
                    <div className="flex gap-2">
                        <input value={testMobile} onChange={e => setTestMobile(e.target.value.replace(/\D/g,''))} placeholder="Verify 10-digit number" className="flex-1 input-premium text-xs font-black" />
                        <button onClick={handleTest} disabled={diag.status === 'loading'} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase transition-all shadow-md">
                          {diag.status === 'loading' ? 'Testing...' : 'Test API'}
                        </button>
                    </div>
                    
                    {diag.status !== 'idle' && (
                      <div className={`p-6 rounded-3xl border-2 ${diag.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="flex items-center gap-3">
                           <i className={`fas ${diag.status === 'success' ? 'fa-check-double text-emerald-500' : 'fa-exclamation-triangle text-red-500'}`}></i>
                           <p className={`text-[11px] font-black uppercase ${diag.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                              {diag.status === 'success' ? 'Handshake Success' : 'Handshake Failed'}
                           </p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 mt-2">{diag.msg}</p>
                        
                        {diag.hint && (
                           <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-red-100">
                              <p className="text-[9px] font-black text-red-600 uppercase mb-1">Troubleshooting Tip:</p>
                              <p className="text-[10px] font-bold text-slate-800 leading-relaxed">{diag.hint}</p>
                           </div>
                        )}

                        {diag.raw && (
                           <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-hidden">
                              <p className="text-[8px] font-black text-white/40 uppercase mb-2">Raw API Response (Tech Debug):</p>
                              <pre className="text-[9px] text-blue-300 font-mono whitespace-pre-wrap">{JSON.stringify(diag.raw, null, 2)}</pre>
                           </div>
                        )}
                      </div>
                    )}
                 </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-10 shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><i className="fas fa-microchip text-9xl"></i></div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-blue-400">Spray Water Park Live ID</h3>
                
                <div className="space-y-8 relative z-10">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">1. Permanent ID Detection</p>
                      <p className="text-xs text-slate-300">Ensure Phone ID <b>947519298437599</b> is in the left box.</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">2. Token Security</p>
                      <p className="text-xs text-slate-300">If using a Test Token, it expires every 24 hours. Ensure you have a <b>Permanent Token</b>.</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">3. Language Match</p>
                      <p className="text-xs text-slate-300">Lang Code must be exactly <b>en</b> as per your template screenshot.</p>
                   </div>
                </div>
              </div>
              
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-lg text-center flex flex-col items-center gap-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em]">System Status</p>
                  <div className={`px-8 py-4 rounded-2xl border-2 transition-all ${settings.waToken ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                      <i className={`fas fa-bolt mr-3 ${settings.waToken ? 'animate-pulse' : ''}`}></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">{settings.waToken ? 'API Linked' : 'Awaiting Config'}</span>
                  </div>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Today's Guest List</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal Activity Feed</p>
              </div>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{bookings.length} Total</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-100 text-[11px] font-black uppercase text-slate-500 border-b">
                <tr><th className="p-8 text-left">Ref ID</th><th className="text-left">Guest</th><th>Status</th></tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-slate-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 text-left text-blue-600 font-black">{b.id}</td>
                    <td className="text-left">
                        <p className="text-slate-900 font-black">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.mobile}</p>
                    </td>
                    <td><span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-4 py-10">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Locker Inventory</button>
          <button onClick={onLogout} className="bg-slate-100 text-slate-900 px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50">Log Out</button>
      </div>
    </div>
  );
};

export default AdminPortal;
