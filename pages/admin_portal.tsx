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

  useEffect(() => {
    if (activeTab === 'settings') {
      setDraft(settings);
    }
  }, [settings, activeTab]);

  const saveSettings = async () => {
    setIsSaving(true);
    const success = await cloudSync.saveSettings(draft);
    if (success) {
      onUpdateSettings(draft);
      alert("Settings Updated Successfully!");
    } else {
      alert("Update Failed. Check connection.");
    }
    setIsSaving(false);
  };

  const applyQuickFix = () => {
    setDraft({
      ...draft,
      waLangCode: 'en',
      waTemplateName: 'ticket_confirmation'
    });
    alert("Quick Fix Applied! Now click 'Save Changes' to update the cloud.");
  };

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString("en-IN");
    const list = bookings.filter(b => b.createdAt.includes(today));
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
          <p className="text-white/40 text-[10px] font-bold uppercase mt-2">{stats.tickets} Tickets Issued Today</p>
        </div>
        <div className="flex bg-white/5 p-2 rounded-[1.5rem] border border-white/10 backdrop-blur-xl">
            <button onClick={() => setActiveTab('bookings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>Bookings</button>
            <button onClick={() => setActiveTab('settings')} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50 hover:text-white'}`}>Settings</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-10">
            <div className="flex justify-between items-center border-b pb-8">
              <div>
                  <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Configuration</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">System & API Management</p>
              </div>
              <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">
                  {isSaving ? 'Updating...' : 'Save Changes'}
              </button>
            </div>

            <div className="space-y-8">
              {/* WhatsApp Section */}
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fab fa-whatsapp"></i> WhatsApp Cloud API
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                           Template Name <span className="text-[8px] text-red-500">Must match exactly*</span>
                        </label>
                        <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium !bg-white text-xs font-bold" placeholder="ticket_confirmation" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                           Language Code <span className="text-[8px] text-blue-500">Standard is 'en'</span>
                        </label>
                        <input value={draft.waLangCode} onChange={e => setDraft({...draft, waLangCode: e.target.value})} className="input-premium !bg-white text-xs font-bold" placeholder="en" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variable Count</label>
                        <select value={draft.waVarCount || 1} onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value)})} className="input-premium !bg-white text-xs font-bold">
                           <option value={0}>0 - No Variables</option>
                           <option value={1}>1 - Guest Name ({"{{1}}"})</option>
                           <option value={2}>2 - Name & ID ({"{{2}}"})</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number ID</label>
                        <input value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium !bg-white text-xs font-bold" placeholder="123456789..." />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 w-full">
                    <input type="checkbox" checked={draft.waAdd91} onChange={e => setDraft({...draft, waAdd91: e.target.checked})} className="w-5 h-5 accent-blue-600" id="add91" />
                    <label htmlFor="add91" className="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">Auto-add 91 Prefix</label>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Permanent API Token</label>
                      <textarea value={draft.waToken || ''} onChange={e => setDraft({...draft, waToken: e.target.value})} className="input-premium !bg-white h-24 text-[10px] font-mono leading-relaxed" placeholder="EAAB..." />
                  </div>
              </div>

              {/* Pricing Section */}
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Morning Adult Rate</label>
                    <input type="number" value={draft.morningAdultRate} onChange={e => setDraft({...draft, morningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evening Adult Rate</label>
                    <input type="number" value={draft.eveningAdultRate} onChange={e => setDraft({...draft, eveningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                  </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-white/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-red-400 mb-8 flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle"></i> Solve Error #132001
                  </h4>
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                        <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Action Required</p>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                           <p className="text-[11px] font-bold text-amber-400 uppercase tracking-tight leading-relaxed">Aapke logs mein Language 'en_us' hai par Meta dashboard mein template sirf 'en' par hoga.</p>
                           
                           <button onClick={applyQuickFix} className="w-full bg-blue-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-all">
                              Apply One-Click Fix
                           </button>
                           
                           <hr className="opacity-10" />
                           
                           <p className="text-[10px] opacity-70 leading-relaxed uppercase">Manual check: Dashboard mein 'ticket_confirmation' ki spelling aur language (usually 'en') check karein.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Status Update</p>
                        <p className="text-[10px] mt-1 opacity-80">API now has auto-mapping logic to force 'en' when 'en_us' is detected.</p>
                    </div>
                  </div>
              </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
          <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Recent Activity</h3>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{bookings.length} Total Records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-100 text-[11px] font-black uppercase text-slate-500 border-b">
                <tr><th className="p-8 text-left">Ref ID</th><th className="text-left">Guest Name</th><th>Date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-slate-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 text-left text-blue-600 font-black">{b.id}</td>
                    <td className="text-left">
                        <p className="text-slate-900 font-black">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.mobile}</p>
                    </td>
                    <td className="text-slate-600">{b.date}</td>
                    <td className="text-slate-900">₹{b.totalAmount}</td>
                    <td><span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">PAID</span></td>
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
