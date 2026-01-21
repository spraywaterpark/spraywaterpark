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
      alert("Config Saved to Cloud!");
    } else {
      alert("Failed to save settings.");
    }
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!testMobile || testMobile.length < 10) return alert("Enter 10 digit number.");
    setDiag({status: 'loading', msg: 'Attempting Handshake...'});

    try {
      // Note: This uses the details currently in the input boxes (draft), 
      // not what is saved in the cloud. Perfect for temporary testing.
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: testMobile, testConfig: draft })
      });
      const data = await res.json();
      
      if (res.ok) {
        setDiag({status: 'success', msg: data.info || 'Handshake Successful!'});
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
      {/* Dynamic Header */}
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
                    <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Configuration</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Temporary or Permanent Mode</p>
                 </div>
                 <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">
                    {isSaving ? 'Syncing...' : 'Save Settings'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone ID (Test or Live)</label>
                        <input value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium text-xs font-bold" placeholder="E.g. 155... or 947..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</label>
                        <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium text-xs font-bold" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Variable Type</label>
                        <select value={draft.waVarType || 'text'} onChange={e => setDraft({...draft, waVarType: e.target.value as any})} className="input-premium text-xs font-bold bg-white">
                           <option value="text">Text (Guest Name)</option>
                           <option value="number">Number (Numeric)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
                        <input value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium text-xs font-bold" placeholder="en/hi" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Token (Temporary or Permanent)</label>
                    <textarea value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium h-28 text-[10px] font-mono leading-relaxed bg-slate-50" placeholder="Paste token here..." />
                 </div>

                 <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">Step 1: Temporary Test</p>
                    <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                       Pehle Temporary ID aur Token daalein. Apna number Meta Dashboard mein verify karein, fir <b>Verify API</b> dabayein. Agar message aa gaya, toh template OK hai!
                    </p>
                 </div>

                 <div className="space-y-4 pt-4">
                    <div className="flex gap-2">
                        <input value={testMobile} onChange={e => setTestMobile(e.target.value.replace(/\D/g,''))} placeholder="Enter 10-digit mobile" className="flex-1 input-premium text-xs font-black" />
                        <button onClick={handleTest} disabled={diag.status === 'loading'} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase transition-all shadow-md">
                          {diag.status === 'loading' ? 'Sending...' : 'Verify API'}
                        </button>
                    </div>
                    
                    {diag.status !== 'idle' && (
                      <div className={`p-6 rounded-3xl border-2 ${diag.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-[11px] font-black uppercase ${diag.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                           {diag.status === 'success' ? 'Accepted by Meta' : 'Rejected by Meta'}
                        </p>
                        <p className="text-[10px] font-bold text-slate-600 mt-2">{diag.msg}</p>
                        {diag.raw && (
                           <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-hidden">
                              <pre className="text-[9px] text-blue-300 font-mono whitespace-pre-wrap">{JSON.stringify(diag.raw, null, 2)}</pre>
                           </div>
                        )}
                      </div>
                    )}
                 </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-10 shadow-2xl border border-white/5">
                <h3 className="text-2xl font-black uppercase tracking-tight text-blue-400">Diagnostic Checklist</h3>
                <div className="space-y-8">
                   <div className="flex gap-6">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><i className="fas fa-microscope text-blue-400"></i></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Test with Temporary ID</p>
                        <p className="text-xs text-slate-300">Paste the 24-hour token. If it works, your Template is 100% Correct.</p>
                      </div>
                   </div>
                   <div className="flex gap-6">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><i className="fas fa-id-card text-emerald-400"></i></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Switch to Permanent ID</p>
                        <p className="text-xs text-slate-300">After success, replace with Live ID (947...) and Permanent Token.</p>
                      </div>
                   </div>
                   <div className="flex gap-6">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><i className="fas fa-exclamation-circle text-amber-400"></i></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Whitelist Note</p>
                        <p className="text-xs text-slate-300">Test ID using numbers MUST be added to Meta's 'To' list manually.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl border border-emerald-400 flex flex-col items-center text-center gap-4">
                  <i className="fas fa-check-double text-4xl mb-2"></i>
                  <h4 className="text-xl font-black uppercase">Template OK?</h4>
                  <p className="text-xs font-medium opacity-80">Agar Temporary ID se message aa gaya toh bina soche Permanent Token ki permission check karein.</p>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Today's Guest List</h3>
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
