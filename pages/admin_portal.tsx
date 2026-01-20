
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  
  // Keep local draft separate. Initialize only once or when tab changes back from 'bookings'
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [diagStatus, setDiagStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');
  const [diagError, setDiagError] = useState('');

  // IMPORTANT: Only update draft from props IF the user is NOT on the settings tab
  // This prevents background syncs from wiping out the data you are currently typing.
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
      alert("All API Credentials Saved to Cloud Successfully!");
    } else {
      alert("Failed to save settings to Google Sheets.");
    }
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!testMobile) return alert("Please enter a mobile number for the test.");
    setDiagStatus('loading');
    setDiagError('');

    try {
      const res = await fetch('/api/booking?type=test_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobile: testMobile,
          testConfig: draft // Test the data currently in the UI
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDiagStatus('success');
      } else {
        setDiagStatus('fail');
        setDiagError(data.details || "Meta rejected the message. Check Phone ID or Token.");
        console.error("Meta Full Error:", data.fullError);
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
      {/* Dashboard Stat Header */}
      <div className="bg-[#1B2559] text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Live Revenue Tracker</p>
        </div>
        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button onClick={() => setActiveTab('bookings')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60'}`}>Sales</button>
            <button onClick={() => setActiveTab('settings')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60'}`}>Migration</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 animate-slide-up">
              <div className="flex justify-between items-center border-b pb-6">
                 <div>
                    <h3 className="text-xl font-black uppercase text-slate-900">API Credentials</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Meta WhatsApp Cloud API</p>
                 </div>
                 <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save To Cloud'}
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Template Name</label>
                        <input autoComplete="off" value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium text-xs" placeholder="booked_ticket" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Language Code</label>
                        <input autoComplete="off" value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium text-xs" placeholder="en_GB" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Permanent Access Token</label>
                    <textarea autoComplete="off" value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium h-28 text-[10px] font-mono leading-relaxed" placeholder="EAAG..." />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Phone Number ID</label>
                        <input autoComplete="off" value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium text-xs" placeholder="138245..." />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Variables</label>
                        <select value={draft.waVarCount} onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value)})} className="input-premium text-xs">
                           <option value={0}>No Variables</option>
                           {/* Fixed line 133: Escaped curly braces to avoid being interpreted as a JS object literal */}
                           <option value={1}>1 Variable ({"{{1}}"} for Name)</option>
                        </select>
                    </div>
                 </div>

                 <div className="pt-8 border-t border-slate-100 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-[0.3em]">Direct API Test</p>
                    <div className="flex gap-2">
                        <input autoComplete="off" value={testMobile} onChange={e => setTestMobile(e.target.value)} placeholder="Test Mobile (91...)" className="flex-1 input-premium text-xs" />
                        <button onClick={handleTest} disabled={diagStatus === 'loading'} className="bg-slate-900 text-white px-8 rounded-xl font-black text-[10px] uppercase shadow-md">
                          {diagStatus === 'loading' ? 'Testing...' : 'Send Test'}
                        </button>
                    </div>
                    
                    {diagStatus === 'fail' && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                        <p className="text-[10px] font-black text-red-600 uppercase mb-1">Meta Error Details:</p>
                        <p className="text-[10px] font-bold text-red-800 leading-relaxed">{diagError}</p>
                      </div>
                    )}
                    
                    {diagStatus === 'success' && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-emerald-700 uppercase">Message Delivered to API!</p>
                        <p className="text-[9px] text-emerald-600 mt-1">If you didn't receive it, check if the recipient number is added to Meta Sandbox list.</p>
                      </div>
                    )}
                 </div>
              </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-10 shadow-2xl">
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase text-blue-400">Owner's Checklist</h3>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-400/30">1</div>
                    <p className="text-xs text-slate-300">Apne Meta Dashboard se **Permanent Token** hi use karein.</p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-400/30">2</div>
                    <p className="text-xs text-slate-300">**Phone Number ID** sahi hona chahiye (Yeh App ID nahi hai).</p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-400/30">3</div>
                    <p className="text-xs text-slate-300">Template ka status Meta dashboard mein **Approved** hona chahiye.</p>
                  </li>
                </ul>
              </div>
              
              <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10">
                <p className="text-[10px] font-black uppercase text-blue-300 mb-4 tracking-widest">Need help?</p>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "Bhai, agar Meta response 'Success' kehta hai aur message nahi aata, toh check karein ki kya aapne woh number Meta Dashboard mein 'Test Recipients' mein add kiya hai (agar account sandbox mode mein hai)."
                </p>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-xl font-black uppercase text-slate-900">Recent Sales Stream</h3>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Bookings: {bookings.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr><th className="p-6">Booking ID</th><th>Guest Name</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 text-blue-600">{b.id}</td>
                    <td>{b.name} <span className="text-slate-400 ml-1">({b.mobile})</span></td>
                    <td className="text-slate-900 font-black">₹{b.totalAmount}</td>
                    <td><span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] uppercase">Confirmed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 py-6">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-emerald-500">Inventory Dashboard</button>
          <button onClick={onLogout} className="bg-red-50 text-red-600 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100">Sign Out</button>
      </div>
    </div>
  );
};

export default AdminPortal;
