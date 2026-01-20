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
  const [viewMode] = useState<'sales_today' | 'visit_today' | 'all'>('sales_today');
  
  // Use a ref to track if user is currently editing settings
  const isEditing = useRef(false);
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  // Migration Diagnostic States
  const [testMobile, setTestMobile] = useState('');
  const [diagStatus, setDiagStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');
  const [diagInfo, setDiagInfo] = useState<any>(null);

  // Only sync settings from props if the user is NOT actively on the settings tab
  useEffect(() => {
    if (activeTab !== 'settings') {
      setDraft(settings);
    }
  }, [settings, activeTab]);

  const updateDraft = (patch: Partial<AdminSettings>) => {
    isEditing.current = true;
    setDraft(prev => ({ ...prev, ...patch }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    const success = await cloudSync.saveSettings(draft);
    if (success) {
      onUpdateSettings(draft);
      isEditing.current = false;
      alert("All Credentials & Settings Saved Successfully!");
    } else {
      alert("Failed to save settings to cloud.");
    }
    setIsSaving(false);
  };

  const runDiagnostic = async () => {
    if (!draft.waToken || !draft.waPhoneId || !testMobile) return alert("Please fill Token, Phone ID and a Mobile number to test.");
    setDiagStatus('loading');
    setDiagInfo(null);
    try {
      const vars = [];
      if ((draft.waVarCount || 0) >= 1) vars.push("Guest Name");

      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: draft.waToken, 
          phoneId: draft.waPhoneId, 
          mobile: testMobile,
          templateName: draft.waTemplateName,
          langCode: draft.waLangCode,
          variables: vars
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
            <button onClick={() => setActiveTab('settings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}>Migration</button>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-10 animate-slide-up">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">API Settings</h3>
                 <button onClick={saveSettings} disabled={isSaving} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">
                    {isSaving ? 'Saving...' : 'Save & Set Default'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-400">Step 1: Configuration</p>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Template Name</label>
                            <input autoComplete="off" value={draft.waTemplateName} onChange={e => updateDraft({ waTemplateName: e.target.value})} placeholder="booked_ticket" className="input-premium text-xs" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Language Code</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => updateDraft({ waLangCode: 'en'})} className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${draft.waLangCode === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>en</button>
                                <button onClick={() => updateDraft({ waLangCode: 'en_GB'})} className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${draft.waLangCode === 'en_GB' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>en_GB</button>
                                <button onClick={() => updateDraft({ waLangCode: 'en_US'})} className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${draft.waLangCode === 'en_US' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>en_US</button>
                            </div>
                        </div>
                    </div>
                 </div>

                 <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                    <p className="text-[10px] font-black uppercase text-blue-600">Step 2: Message Style</p>
                    <div className="flex gap-2">
                        <button onClick={() => updateDraft({ waVarCount: 0})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${draft.waVarCount === 0 ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                            Plain Text
                        </button>
                        <button onClick={() => updateDraft({ waVarCount: 1})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${draft.waVarCount === 1 ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                            With {"{{1}}"}
                        </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Permanent Access Token</label>
                        <textarea autoComplete="off" value={draft.waToken || ''} onChange={e => updateDraft({ waToken: e.target.value})} placeholder="EAAG..." className="input-premium h-20 text-[10px] font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number ID</label>
                            <input autoComplete="off" value={draft.waPhoneId || ''} onChange={e => updateDraft({ waPhoneId: e.target.value})} placeholder="138..." className="input-premium text-xs" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Test Mobile</label>
                            <input autoComplete="off" value={testMobile} onChange={e => setTestMobile(e.target.value.replace(/\D/g,''))} placeholder="91..." className="input-premium text-xs" />
                        </div>
                    </div>
                 </div>

                 <button onClick={runDiagnostic} disabled={diagStatus === 'loading'} className="w-full btn-resort h-16 !bg-blue-600 shadow-xl">
                    {diagStatus === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt mr-2"></i>}
                    Send Diagnostic Message
                 </button>

                 {diagStatus === 'fail' && diagInfo && (
                   <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-3">
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">Error {diagInfo.code}</p>
                      <p className="text-[10px] font-bold text-red-800 leading-relaxed">{diagInfo.details}</p>
                   </div>
                 )}
                 
                 {diagStatus === 'success' && (
                   <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2 text-center">
                      <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
                      <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest">Diagnostic Delivered!</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-8 shadow-2xl border border-white/10">
                <div className="flex items-center gap-4">
                    <i className="fas fa-shield-alt text-blue-400 text-2xl"></i>
                    <h3 className="text-xl font-black uppercase tracking-tight">Security Note</h3>
                </div>
                <p className="text-xs font-medium text-slate-300 leading-relaxed">
                  Bhai, Token aur Phone ID ko yahan save karne ke baad, aapka system cloud se automatically credentials uthayega. Aapko baar-baar Vercel Dashboard par jaane ki zaroorat nahi padegi.
                </p>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-xs text-blue-200 font-bold italic">
                   Tip: Make sure the 'Test Mobile' has 91 prefix or is a 10-digit number.
                </div>
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

export default AdminPortal;
