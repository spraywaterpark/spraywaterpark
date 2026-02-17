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
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'pricing'>('bookings');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const saveSettings = async () => {
    setIsSaving(true);
    const success = await cloudSync.saveSettings(draft);
    if (success) {
      onUpdateSettings(draft);
      alert("✅ Settings Updated! Your Spray Jaipur App is now connected.");
    } else {
      alert("❌ Update Failed. Check internet.");
    }
    setIsSaving(false);
  };

  const testConnection = async () => {
    const testMobile = prompt("Enter 10-digit mobile number for TEST:");
    if (!testMobile || testMobile.length !== 10) return alert("Invalid number");

    setIsTesting(true);
    try {
      const response = await fetch('/api/booking?type=whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: testMobile,
          booking: { id: 'TEST-SPRAY', name: 'Test Guest', adults: 1, kids: 0, totalAmount: 0, date: new Date().toISOString().split('T')[0] }
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("🎉 SUCCESS! Message sent via Spray Jaipur WABA.");
      } else {
        alert("⚠️ ERROR: " + data.details);
      }
    } catch (e) {
      alert("Network Error.");
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Header Stat Card */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 text-center md:text-left">
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] mb-3">Spray Water Park Jaipur</p>
          <h2 className="text-6xl font-black tracking-tighter">₹{stats.revenue.toLocaleString()}</h2>
          <p className="text-white/40 text-[10px] font-bold uppercase mt-2">{stats.tickets} Bookings Today</p>
        </div>
        <div className="relative z-10 flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='bookings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Bookings</button>
            <button onClick={() => setActiveTab('pricing')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='pricing' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>Pricing</button>
            <button onClick={() => setActiveTab('settings')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab==='settings' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/50'}`}>WhatsApp API</button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10">
            <div className="flex justify-between items-center border-b pb-6">
                <div>
                  <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Meta API Integration</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect your 'Spray Jaipur' App</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={testConnection} className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isTesting ? 'bg-slate-200' : 'bg-slate-100 hover:bg-slate-200'}`}>
                        {isTesting ? 'Testing...' : 'Test API'}
                    </button>
                    <button onClick={saveSettings} className="bg-blue-600 text-white px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-id-card text-blue-500"></i> Phone Number ID
                    </label>
                    <input 
                      value={draft.waPhoneId} 
                      onChange={e => setDraft({...draft, waPhoneId: e.target.value})} 
                      className="input-premium font-mono !bg-slate-50 text-blue-700 border-2" 
                      placeholder="e.g. 104825968254123" 
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-file-code text-blue-500"></i> Template Name
                    </label>
                    <input 
                      value={draft.waTemplateName} 
                      onChange={e => setDraft({...draft, waTemplateName: e.target.value})} 
                      className="input-premium font-bold border-2" 
                      placeholder="e.g. ticket"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-list-ol text-emerald-500"></i> Variable Count
                    </label>
                    <input 
                      type="number"
                      value={draft.waVarCount} 
                      onChange={e => setDraft({...draft, waVarCount: parseInt(e.target.value) || 0})} 
                      className="input-premium font-bold border-2" 
                      placeholder="e.g. 3" 
                    />
                    <p className="text-[9px] text-slate-400 font-bold italic">Number of {"{{n}}"} in your template</p>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-language text-emerald-500"></i> Language Code
                    </label>
                    <input 
                      value={draft.waLangCode} 
                      onChange={e => setDraft({...draft, waLangCode: e.target.value})} 
                      className="input-premium font-bold border-2" 
                      placeholder="e.g. en"
                    />
                    <p className="text-[9px] text-slate-400 font-bold italic">Usually 'en' or 'en_US'</p>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-key text-emerald-500"></i> Permanent Access Token
                </label>
                <textarea 
                  value={draft.waToken} 
                  onChange={e => setDraft({...draft, waToken: e.target.value})} 
                  className="input-premium !bg-slate-50 h-32 text-[11px] font-mono leading-relaxed border-2" 
                  placeholder="EAAB..." 
                />
            </div>
          </div>

          <div className="space-y-6">
              <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <i className="fab fa-whatsapp absolute -right-6 -top-6 text-9xl opacity-10 rotate-12"></i>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 border-b border-white/10 pb-4">Setup Checklist</h4>
                  <ul className="space-y-6">
                      <CheckItem title="Template Check" desc="Name must be 'ticket' exactly." active={draft.waTemplateName === 'ticket'} />
                      <CheckItem title="Variables" desc="Set count to 3 for approved template." active={draft.waVarCount === 3} />
                      <CheckItem title="Phone ID" desc="Copy from 'Getting Started'." active={!!draft.waPhoneId} />
                      <CheckItem title="Admin Token" desc="Generated from System Users." active={!!draft.waToken} />
                  </ul>
                  <button onClick={() => window.open('https://developers.facebook.com/apps', '_blank')} className="w-full mt-10 py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Open Meta Dashboard</button>
              </div>
          </div>
        </div>
      ) : activeTab === 'pricing' ? (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-10">
            <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Ticket Rates & Offers</h3>
                <button onClick={saveSettings} className="bg-blue-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase">
                    {isSaving ? 'Saving...' : 'Save Pricing'}
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-sun"></i> Morning Slot Rates</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult Rate (₹)</label>
                            <input type="number" value={draft.morningAdultRate} onChange={e => setDraft({...draft, morningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid Rate (₹)</label>
                            <input type="number" value={draft.morningKidRate} onChange={e => setDraft({...draft, morningKidRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-moon"></i> Evening Slot Rates</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Adult Rate (₹)</label>
                            <input type="number" value={draft.eveningAdultRate} onChange={e => setDraft({...draft, eveningAdultRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Kid Rate (₹)</label>
                            <input type="number" value={draft.eveningKidRate} onChange={e => setDraft({...draft, eveningKidRate: parseInt(e.target.value)})} className="input-premium font-bold" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Recent Activity</h3>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{bookings.length} Total</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr><th className="p-6 text-left">Ref ID</th><th className="text-left">Guest</th><th>Slot</th><th>Payment</th><th>Status</th></tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-left text-blue-600 font-black">{b.id}</td>
                    <td className="text-left py-4">
                        <p className="text-slate-900 font-black uppercase">{b.name}</p>
                        <p className="text-[9px] text-slate-400">{b.mobile}</p>
                    </td>
                    <td className="text-slate-600">{b.date}<br/>{b.time.split(':')[0]}</td>
                    <td className="font-black text-slate-900">₹{b.totalAmount}</td>
                    <td><span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">PAID</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 py-6">
          <button onClick={() => window.location.hash = '#/admin-lockers'} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Locker Management</button>
          <button onClick={onLogout} className="bg-slate-200 text-slate-900 px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Logout</button>
      </div>
    </div>
  );
};

const CheckItem = ({ title, desc, active }: { title: string, desc: string, active: boolean }) => (
    <li className="flex gap-4">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${active ? 'bg-emerald-500 text-slate-900' : 'bg-white/10 text-white/40'}`}>
            <i className={`fas ${active ? 'fa-check' : 'fa-clock'}`}></i>
        </div>
        <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>{title}</p>
            <p className="text-[9px] text-white/30 font-medium leading-tight mt-1">{desc}</p>
        </div>
    </li>
);

export default AdminPortal;
