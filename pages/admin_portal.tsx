import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [diagStatus, setDiagStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');
  const [diagError, setDiagError] = useState('');

  // Update local draft only when coming to this tab or when settings change globally
  useEffect(() => {
    if (activeTab !== 'settings') {
      setDraft(settings);
    }
  }, [settings, activeTab]);

  const saveAll = async () => {
    setIsSaving(true);
    const success = await cloudSync.saveSettings(draft);
    if (success) {
      onUpdateSettings(draft);
      alert("Settings Saved to Cloud!");
    } else {
      alert("Error saving to Google Sheets.");
    }
    setIsSaving(false);
  };

  const runTest = async () => {
    if (!testMobile) return alert("Enter a mobile number to test.");
    setDiagStatus('loading');
    setDiagError('');

    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobile: testMobile,
          testConfig: draft // Test using what's currently in the UI
        })
      });
      const data = await res.json();
      if (res.ok) setDiagStatus('success');
      else {
        setDiagStatus('fail');
        setDiagError(data.details || "Meta rejected the message.");
      }
    } catch (e: any) {
      setDiagStatus('fail');
      setDiagError(e.message);
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
      {/* Header Stat */}
      <div className="bg-[#1B2559] text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1">Today's Total Sales</p>
        </div>
        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60'}`}>Bookings</button>
            <button onClick={() => setActiveTab('settings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60'}`}>Migration</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid lg:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-xl space-y-8 border border-slate-100">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase text-slate-900">WhatsApp API Setup</h3>
                 <button onClick={saveAll} disabled={isSaving} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">
                    {isSaving ? 'Saving...' : 'Save Credentials'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Template Name</label>
                        <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium text-xs" placeholder="booked_ticket" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Language</label>
                        <input value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium text-xs" placeholder="en" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Access Token (Permanent)</label>
                    <textarea value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium h-24 text-[10px] font-mono" placeholder="EAAG..." />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Phone ID</label>
                        <input value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium text-xs" placeholder="123..." />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Variable Count</label>
                        <select value={draft.waVarCount} onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value)})} className="input-premium text-xs">
                           <option value={0}>0 (Plain Text)</option>
                           <option value={1}>1 (With Name)</option>
                        </select>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase text-center">Diagnostics</p>
                    <div className="flex gap-2">
                        <input value={testMobile} onChange={e => setTestMobile(e.target.value)} placeholder="91..." className="flex-1 input-premium text-xs" />
                        <button onClick={runTest} className="bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase">Test</button>
                    </div>
                    {diagStatus === 'fail' && <p className="p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg">{diagError}</p>}
                    {diagStatus === 'success' && <p className="p-3 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg text-center">Delivered successfully!</p>}
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-6">
              <h3 className="text-xl font-black uppercase">Help & Instructions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bhai, Token aur Phone ID ko yahan save karne ke baad **"Save Credentials"** zaroor dabayein. 
                <br/><br/>
                Ab jab koi booking hogi, toh backend seedha Google Sheets se ye data uthayega. Aapko baar-baar chhedne ki zaroorat nahi hogi.
              </p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-bold italic text-blue-300">
                Tip: Template language 'en' ya 'en_GB' Meta Dashboard ke hisaab se rakhein.
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <table className="w-full text-center border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
              <tr><th className="p-6">ID</th><th>Guest</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody className="text-xs font-bold divide-y">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-6 text-blue-600">{b.id}</td>
                  <td>{b.name} ({b.mobile})</td>
                  <td className="text-slate-900">₹{b.totalAmount}</td>
                  <td><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px]">PAID</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center gap-4 py-6">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl">Inventory Terminal</button>
          <button onClick={onLogout} className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase border border-red-100">Sign Out</button>
      </div>
    </div>
  );
};

export default AdminPortal;
