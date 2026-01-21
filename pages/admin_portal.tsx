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
  const [diag, setDiag] = useState<{status: 'idle'|'loading'|'success'|'fail', msg: string, debug?: any}>({status: 'idle', msg: ''});

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
    setDiag({status: 'loading', msg: 'Checking with Meta Cloud...'});

    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: testMobile, testConfig: draft })
      });
      const data = await res.json();
      
      if (res.ok) {
        setDiag({status: 'success', msg: data.info, debug: data.debug});
      } else {
        setDiag({status: 'fail', msg: data.details || 'Meta API Rejected'});
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
                    <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">API Setup</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Permanent Meta Connection</p>
                 </div>
                 <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">
                    {isSaving ? 'Saving...' : 'Save Config'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1">Template Name</label>
                            <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium text-xs font-black border-blue-200" placeholder="ticket" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1">Language Code</label>
                            <input value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium text-xs font-black border-blue-200" placeholder="en" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Variable Count ({"{{1}}"})</label>
                            <input type="number" min={0} max={1} value={draft.waVarCount || 0} onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value) || 0})} className="input-premium text-xs font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number ID</label>
                            <input value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium text-xs font-bold" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent Token</label>
                        <textarea value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium h-24 text-[10px] font-mono leading-relaxed bg-white" placeholder="EAAB..." />
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Delivery</p>
                    <div className="flex gap-2">
                        <input value={testMobile} onChange={e => setTestMobile(e.target.value.replace(/\D/g,''))} placeholder="Verify 10-digit mobile" className="flex-1 input-premium text-xs font-black" />
                        <button onClick={handleTest} disabled={diag.status === 'loading'} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase transition-all shadow-md">
                          {diag.status === 'loading' ? 'Checking...' : 'Run Test'}
                        </button>
                    </div>
                    
                    {diag.status !== 'idle' && (
                      <div className={`p-6 rounded-3xl border-2 ${diag.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${diag.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                <i className={`fas ${diag.status === 'success' ? 'fa-check' : 'fa-times'}`}></i>
                            </div>
                            <p className={`text-[11px] font-black uppercase ${diag.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                               {diag.status === 'success' ? 'Meta Accepted Request' : 'Meta Error'}
                            </p>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{diag.msg}</p>
                        
                        {diag.debug && (
                           <div className="mt-4 p-4 bg-slate-900 rounded-2xl overflow-hidden">
                              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Transmission Log:</p>
                              <pre className="text-[10px] text-white/70 font-mono">{JSON.stringify(diag.debug, null, 2)}</pre>
                           </div>
                        )}
                      </div>
                    )}
                 </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-8 shadow-2xl border border-white/5">
                <h3 className="text-2xl font-black uppercase tracking-tight text-blue-400">Why no message?</h3>
                <div className="space-y-6">
                   <div className="space-y-2 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-exclamation-triangle"></i> Sandbox Verification</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">Agar aap **Test Number** use kar rahe hain, toh Meta Dashboard mein "Verified Numbers" list mein apna mobile add karein. Bina verification ke Sandbox message nahi bhejta.</p>
                   </div>
                   <div className="space-y-2 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-language"></i> Language Code</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">Aapke screenshot mein "English" hai. Code mein `en` use karein. Agar `en` se nahi aaye toh `en_US` try karein.</p>
                   </div>
                   <div className="space-y-2 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-clock"></i> Template Sync</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">Naye template ko puri tarah "Active" hone mein kabhi kabhi 5-10 minute lagte hain bhale hi "Approved" likha ho.</p>
                   </div>
                </div>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Booking Log</h3>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{bookings.length} Records</div>
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
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Locker Management</button>
          <button onClick={onLogout} className="bg-slate-100 text-slate-900 px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50">Sign Out</button>
      </div>
    </div>
  );
};

export default AdminPortal;
