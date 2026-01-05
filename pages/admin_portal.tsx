import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';

interface AdminPanelProps {
  bookings: Booking[];
  settings: AdminSettings;
  onUpdateSettings: (s: AdminSettings) => void;
}

const AdminPortal: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [changed, setChanged] = useState(false);

  useEffect(() => { setDraft(settings); }, [settings]);

  const stats = useMemo(() => ({
    revenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
    guests: bookings.reduce((sum, b) => sum + b.adults + b.kids, 0),
    count: bookings.length
  }), [bookings]);

  const filtered = bookings.filter(b => b.date === filterDate);
  
  const handleUpdate = (field: keyof AdminSettings, value: any) => {
    setDraft({ ...draft, [field]: value });
    setChanged(true);
  };

  const save = () => {
    onUpdateSettings(draft);
    setChanged(false);
    alert("Global Settings updated successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 animate-fade space-y-10">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Revenue</p>
          <h3 className="text-3xl font-black text-[#1B2559]">₹{stats.revenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Guests</p>
          <h3 className="text-3xl font-black text-[#1B2559]">{stats.guests}</h3>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Active Bookings</p>
          <h3 className="text-3xl font-black text-[#1B2559]">{stats.count}</h3>
        </div>
        <div className="blue-gradient p-7 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
          <p className="text-[11px] font-black uppercase opacity-70 tracking-[0.2em] mb-2">Active Offers</p>
          <h3 className="text-xl font-black uppercase">Tiered Discounts</h3>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] card-premium overflow-hidden shadow-xl border-slate-200">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
          <button onClick={() => setActiveTab('bookings')} className={`px-12 py-7 font-black text-xs uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeTab === 'bookings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Live Records
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-12 py-7 font-black text-xs uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeTab === 'settings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Resort Engine Settings
          </button>
        </div>

        <div className="p-8 md:p-14">
          {activeTab === 'bookings' && (
            <div className="space-y-10 animate-fade">
              <div className="flex items-center gap-6 bg-blue-50 p-5 rounded-2xl w-fit border border-blue-100">
                <label className="text-[11px] font-black text-blue-800 uppercase tracking-widest">Select View Date:</label>
                <input type="date" className="input-premium py-2 px-4 text-sm font-bold bg-white max-w-[200px]" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-black uppercase text-slate-800 border-b-2 border-slate-200">
                      <th className="pb-8 px-6">Guest Identity</th>
                      <th className="pb-8 px-6">Slot/Time</th>
                      <th className="pb-8 px-6">Occupancy</th>
                      <th className="pb-8 px-6">Net Payment</th>
                      <th className="pb-8 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-black uppercase text-xs tracking-[0.3em]">No entries for {filterDate}</td></tr>
                    ) : (
                      filtered.map(b => (
                        <tr key={b.id} className="hover:bg-blue-50 transition-colors group">
                          <td className="py-8 px-6">
                            <div>
                              <div className="font-black text-[#1B2559] text-base group-hover:text-blue-700">{b.name}</div>
                              <div className="text-[11px] text-slate-600 font-black uppercase mt-1">{b.mobile}</div>
                            </div>
                          </td>
                          <td className="py-8 px-6">
                            <div className="text-sm font-black text-slate-800">{b.time.split(' - ')[0]}</div>
                            <div className="text-[11px] font-black text-blue-600 uppercase mt-1 tracking-wider">{b.time.split(' - ')[1]}</div>
                          </td>
                          <td className="py-8 px-6">
                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">A: {b.adults} | C: {b.kids}</span>
                          </td>
                          <td className="py-8 px-6 font-black text-blue-700 text-lg">₹{b.totalAmount}</td>
                          <td className="py-8 px-6">
                            <span className="px-5 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">Verified</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-14 animate-fade max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                <div className="space-y-10">
                  <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-[0.3em] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fas fa-tags"></i></div>
                    Pricing Engine
                  </h4>
                  <div className="grid grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Morning Adult</label>
                      <input type="number" className="input-premium" value={draft.morningAdultRate} onChange={e => handleUpdate('morningAdultRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Morning Child</label>
                      <input type="number" className="input-premium" value={draft.morningKidRate} onChange={e => handleUpdate('morningKidRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Evening Adult</label>
                      <input type="number" className="input-premium" value={draft.eveningAdultRate} onChange={e => handleUpdate('eveningAdultRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Evening Child</label>
                      <input type="number" className="input-premium" value={draft.eveningKidRate} onChange={e => handleUpdate('eveningKidRate', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
                <div className="space-y-10">
                  <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-[0.3em] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><i className="fas fa-bolt"></i></div>
                    Offer Logic
                  </h4>
                  <div className="grid grid-cols-1 gap-8 bg-emerald-50/50 p-10 rounded-[2.5rem] border border-emerald-100">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Tier 1 (0-100 guests) %</label>
                      <input type="number" className="input-premium bg-white" value={draft.earlyBirdDiscount} onChange={e => handleUpdate('earlyBirdDiscount', Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Tier 2 (101-200 guests) %</label>
                      <input type="number" className="input-premium bg-white" value={draft.extraDiscountPercent} onChange={e => handleUpdate('extraDiscountPercent', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={save} 
                  disabled={!changed}
                  className="btn-luxury px-20 py-6 text-xl shadow-2xl disabled:opacity-40 disabled:grayscale uppercase tracking-widest"
                >
                  Save Global Configurations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
