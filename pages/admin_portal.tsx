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
      alert("Settings Saved!");
    } else {
      alert("Failed to save.");
    }
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!testMobile || testMobile.length < 10) return alert("Enter 10 digit mobile.");
    setDiag({status: 'loading', msg: 'Checking Template on Meta...'});

    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: testMobile, testConfig: draft })
      });
      const data = await res.json();
      
      if (res.ok) {
        setDiag({status: 'success', msg: data.info || 'Handshake Successful!'});
      } else {
        let errorHint = "";
        if (data.details?.includes("ACCOUNT MISMATCH")) {
          errorHint = "IMPORTANT: Meta Test Account aur Live Account alag hote hain. Aapko Live Account mein naya template create karna hoga.";
        } else if (data.details?.includes("translation")) {
          errorHint = "HINT: Language Code (hi/en) check karein. Meta Dashboard mein template kis bhasha mein hai?";
        }
        setDiag({status: 'fail', msg: data.details || 'Meta Rejected Request', hint: errorHint, raw: data.raw});
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
      {/* Header */}
      <div className="bg-[#0F172A] text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10">
        <div className="text-center md:text-left">
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.5em] mb-2">Today's Performance</p>
          <h2 className="text-5xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
        </div>
        <div className="flex bg-white/5 p-2 rounded-[1.5rem] border border-white/10 backdrop-blur-xl">
            <button onClick={() => setActiveTab('bookings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>Bookings</button>
            <button onClick={() => setActiveTab('settings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>Meta Settings</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 animate-slide-up">
              <div className="flex justify-between items-start border-b pb-8">
                 <div>
                    <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Meta API Config</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sync with Meta Cloud</p>
                 </div>
                 <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">
                    {isSaving ? 'Saving...' : 'Save Config'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Live Account Note:</p>
                    <p className="text-[10px] font-bold text-slate-600">
                       Agar aap Permanent Phone ID use kar rahe hain, toh confirm karein ki aapne template ko <b>Live WABA Account</b> mein create aur approve karwa liya hai.
                    </p>
                 </div>

                 <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1">Template Name (EXACT)</label>
                            <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium text-xs font-black border-blue-200" placeholder="e.g. ticket_confirmed" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1">Language Code</label>
                            <input value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium text-xs font-black border-blue-200" placeholder="hi or en" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Variable Type</label>
                            <select value={draft.waVarType || 'text'} onChange={e => setDraft({...draft, waVarType: e.target.value as any})} className="input-premium text-xs font-bold bg-white">
                               <option value="text">Text (Name)</option>
                               <option value="number">Number (Numeric)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone ID</label>
                            <input value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium text-xs font-bold" placeholder="Test or Live ID" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Token</label>
                        <textarea value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium h-24 text-[10px] font-mono leading-relaxed bg-white" placeholder="EAAB..." />
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Delivery</p>
                    <div className="flex gap-2">
                        <input value={testMobile} onChange={e => setTestMobile(e.target.value.replace(/\D/g,''))} placeholder="Enter your mobile" className="flex-1 input-premium text-xs font-black" />
                        <button onClick={handleTest} disabled={diag.status === 'loading'} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase transition-all shadow-md">
                          {diag.status === 'loading' ? 'Testing...' : 'Verify API'}
                        </button>
                    </div>
                    
                    {diag.status !== 'idle' && (
                      <div className={`p-6 rounded-3xl border-2 ${diag.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-[11px] font-black uppercase ${diag.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                           {diag.status === 'success' ? 'Meta Accepted' : 'Meta Rejected'}
                        </p>
                        <p className="text-[11px] font-black text-slate-800 mt-2">{diag.msg}</p>
                        {diag.hint && (
                           <div className="mt-4 p-4 bg-amber-100 border-l-4 border-amber-500 rounded-lg">
                              <p className="text-[10px] font-bold text-amber-900 italic">{diag.hint}</p>
                           </div>
                        )}
                        {diag.raw && (
                           <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-hidden shadow-inner">
                              <pre className="text-[9px] text-blue-300 font-mono whitespace-pre-wrap">{JSON.stringify(diag.raw, null, 2)}</pre>
                           </div>
                        )}
                      </div>
                    )}
                 </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-8 shadow-2xl border border-white/5">
                <h3 className="text-2xl font-black uppercase tracking-tight text-blue-400">Step-by-Step Fix</h3>
                <div className="space-y-6">
                   <div className="space-y-1 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">1. Open WhatsApp Manager</p>
                      <p className="text-xs text-slate-300 font-medium">Meta Dashboard mein apne **Live Account** ko select karein (Test account ko nahi).</p>
                   </div>
                   <div className="space-y-1 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">2. Create Live Template</p>
                      <p className="text-xs text-slate-300 font-medium">Live account mein `ticket_confirmed` naam ka template banayein aur usse approve hone dein.</p>
                   </div>
                   <div className="space-y-1 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">3. Match Language</p>
                      <p className="text-xs text-slate-300 font-medium">Agar Meta mein Language 'English (US)' hai toh yahan code **en_US** ya sirf **en** daalein.</p>
                   </div>
                </div>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Active Bookings</h3>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{bookings.length} Registered</div>
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
                    <td><span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Confirmed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-4 py-10">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Locker Management</button>
          <button onClick={onLogout} className="bg-slate-100 text-slate-900 px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50">Log Out</button>
      </div>
    </div>
  );
};

export default AdminPortal;
