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
  const [isTesting, setIsTesting] = useState(false);

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
      alert("Settings Updated! Now try the 'Test Connection' button.");
    } else {
      alert("Update Failed. Check connection.");
    }
    setIsSaving(false);
  };

  const setLang = (code: string) => {
    setDraft({ ...draft, waLangCode: code });
  };

  const testConnection = async () => {
    const testMobile = prompt("Enter 10-digit mobile number to send TEST message:");
    if (!testMobile || testMobile.length !== 10) return alert("Invalid number");

    setIsTesting(true);
    try {
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: testMobile,
          booking: { id: 'TEST-786', name: 'Test Guest', totalAmount: 500, date: '2025-01-01' }
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Success! Meta ID: " + data.messageId + "\n\nMessage sent to queue.");
      } else {
        alert("Failed with Error: " + data.details + "\n\nTip: Agar error 132001 hai, toh Language Code badal kar 'en' try karein.");
      }
    } catch (e) {
      alert("Network Error");
    }
    setIsTesting(false);
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
              <div className="flex gap-3">
                <button onClick={testConnection} disabled={isTesting} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">
                    {isTesting ? 'Sending...' : 'Test Connection'}
                </button>
                <button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">
                    {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {/* WhatsApp Section */}
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fab fa-whatsapp"></i> WhatsApp Cloud API
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                           Template Name
                        </label>
                        <input value={draft.waTemplateName} onChange={e => setDraft({...draft, waTemplateName: e.target.value})} className="input-premium !bg-white text-xs font-bold" placeholder="ticket_confirmation" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                           Language Code (Current: {draft.waLangCode})
                        </label>
                        <div className="flex gap-2">
                            <button onClick={() => setLang('en')} className={`flex-1 py-3 rounded-xl text-[10px] font-black border ${draft.waLangCode === 'en' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>en</button>
                            <button onClick={() => setLang('en_US')} className={`flex-1 py-3 rounded-xl text-[10px] font-black border ${draft.waLangCode === 'en_US' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>en_US</button>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variable Count</label>
                        <select value={draft.waVarCount || 1} onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value)})} className="input-premium !bg-white text-xs font-bold">
                           <option value={0}>0 - No Variables</option>
                           <option value={1}>1 - Name Only ({"{{1}}"})</option>
                           <option value={2}>2 - Name & ID ({"{{2}}"})</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number ID</label>
                        <input value={draft.waPhoneId || ''} onChange={e => setDraft({...draft, waPhoneId: e.target.value})} className="input-premium !bg-white text-xs font-bold" placeholder="123456789..." />
                    </div>
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
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-8 flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle"></i> Error #132001 FIX
                  </h4>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                       <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-tight">Iska matlab Language mismatch hai:</p>
                       
                       <div className="space-y-3">
                          <p className="text-[10px] leading-relaxed">Meta mein template banate waqt aapne jo language select ki thi, wahi yahan honi chahiye.</p>
                          <hr className="opacity-10" />
                          <p className="text-[10px] leading-relaxed"><b className="text-white">Solution:</b> Agar <b>en_US</b> fail ho raha hai, toh <b>en</b> (sirf en) select karein aur Save karke Test karein.</p>
                       </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">How to check?</p>
                        <p className="text-[10px] mt-2 opacity-80 leading-relaxed uppercase">
                           Meta Dashboard > WhatsApp > Message Templates mein jaiye. Wahan "Language" column mein dekhiye kya likha hai.
                        </p>
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
