
import React, { useState, useMemo, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';

interface AdminPanelProps {
  bookings: Booking[];
  settings: AdminSettings;
  onUpdateSettings: (s: AdminSettings) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ bookings, settings, onUpdateSettings }) => {
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
    <div className="max-w-7xl mx-auto py-6 px-4 animate-fade space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-white">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <h3 className="text-2xl font-black text-[#1B2559]">₹{stats.revenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-white">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Guests</p>
          <h3 className="text-2xl font-black text-[#1B2559]">{stats.guests}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-white">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Bookings</p>
          <h3 className="text-2xl font-black text-[#1B2559]">{stats.count}</h3>
        </div>
        <div className="blue-gradient p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100">
          <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Max Tier Discount</p>
          <h3 className="text-lg font-bold">{Math.max(settings.earlyBirdDiscount, settings.extraDiscountPercent)}% OFF</h3>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] card-shadow overflow-hidden border border-white">
        <div className="flex border-b overflow-x-auto bg-gray-50/30">
          <button onClick={() => setActiveTab('bookings')} className={`px-10 py-6 font-black text-xs uppercase tracking-widest whitespace-nowrap ${activeTab === 'bookings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
            Live Records
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-10 py-6 font-black text-xs uppercase tracking-widest whitespace-nowrap ${activeTab === 'settings' ? 'text-blue-600 border-b-4 border-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
            System Settings
          </button>
        </div>

        <div className="p-8 md:p-12">
          {activeTab === 'bookings' && (
            <div className="space-y-8 animate-fade">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl w-fit">
                <label className="text-[10px] font-black text-gray-400 uppercase">Selected Date:</label>
                <input type="date" className="input-field py-1 text-sm font-bold" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-gray-400 border-b">
                      <th className="pb-6 px-4">Guest Identity</th>
                      <th className="pb-6 px-4">Slot/Time</th>
                      <th className="pb-6 px-4">Occupancy</th>
                      <th className="pb-6 px-4">Payment</th>
                      <th className="pb-6 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest">No entries for this date</td></tr>
                    ) : (
                      filtered.map(b => (
                        <tr key={b.id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="py-6 px-4">
                            <div>
                              <div className="font-black text-[#1B2559] group-hover:text-blue-600 transition-colors">{b.name}</div>
                              <div className="text-xs text-gray-400 font-bold">{b.mobile}</div>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <div className="text-sm font-bold text-gray-600">{b.time.split(' - ')[0]}</div>
                            <div className="text-[10px] font-black text-blue-500 uppercase">{b.time.split(' - ')[1]}</div>
                          </td>
                          <td className="py-6 px-4">
                            <span className="text-xs font-black text-gray-400">A: {b.adults} | K: {b.kids}</span>
                          </td>
                          <td className="py-6 px-4 font-black text-blue-600">₹{b.totalAmount}</td>
                          <td className="py-6 px-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Paid</span>
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
            <div className="space-y-12 animate-fade max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Pricing Section */}
                <div className="space-y-8">
                  <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-[0.2em] flex items-center gap-3">
                    <i className="fas fa-tags text-blue-600"></i> Pricing Engine
                  </h4>
                  <div className="grid grid-cols-2 gap-6 bg-gray-50 p-8 rounded-[2rem]">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Morn. Adult</label>
                      <input type="number" className="input-field" value={draft.morningAdultRate} onChange={e => handleUpdate('morningAdultRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Morn. Kid</label>
                      <input type="number" className="input-field" value={draft.morningKidRate} onChange={e => handleUpdate('morningKidRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Eve. Adult</label>
                      <input type="number" className="input-field" value={draft.eveningAdultRate} onChange={e => handleUpdate('eveningAdultRate', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Eve. Kid</label>
                      <input type="number" className="input-field" value={draft.eveningKidRate} onChange={e => handleUpdate('eveningKidRate', Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* Promotions Section */}
                <div className="space-y-8">
                  <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-[0.2em] flex items-center gap-3">
                    <i className="fas fa-percent text-orange-600"></i> Smart Offers (Booking Based)
                  </h4>
                  <div className="grid grid-cols-1 gap-6 bg-orange-50/50 p-8 rounded-[2rem]">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-orange-600 uppercase">Tier 1 Discount % (Guests 0-100)</label>
                      <input type="number" className="input-field" value={draft.earlyBirdDiscount} onChange={e => handleUpdate('earlyBirdDiscount', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-600 uppercase">Tier 2 Discount % (Guests 101-200)</label>
                      <input type="number" className="input-field" value={draft.extraDiscountPercent} onChange={e => handleUpdate('extraDiscountPercent', Number(e.target.value))} />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase italic">Offers are applied automatically based on total bookings for the selected date and slot.</p>
                  </div>
                </div>
              </div>

              {/* Holiday Management */}
              <div className="space-y-8">
                <h4 className="font-black text-sm text-[#1B2559] uppercase tracking-[0.2em] flex items-center gap-3">
                  <i className="fas fa-calendar-alt text-red-600"></i> Closed/Holiday Dates
                </h4>
                <div className="flex gap-4">
                  <input type="date" className="input-field max-w-[300px]" value={newBlockedDate} onChange={e => setNewBlockedDate(e.target.value)} />
                  <button onClick={() => { if(newBlockedDate) { handleUpdate('blockedDates', [...draft.blockedDates, newBlockedDate]); setNewBlockedDate(''); } }} className="btn-primary px-8">Add Holiday</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {draft.blockedDates.map(d => (
                    <span key={d} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-3 border border-red-100">
                      {d}
                      <i className="fas fa-times cursor-pointer hover:scale-125" onClick={() => handleUpdate('blockedDates', draft.blockedDates.filter(bd => bd !== d))}></i>
                    </span>
                  ))}
                  {draft.blockedDates.length === 0 && <p className="text-gray-300 italic text-sm font-bold uppercase">No holidays set.</p>}
                </div>
              </div>

              <div className="pt-10 border-t flex justify-end">
                <button 
                  onClick={save} 
                  disabled={!changed}
                  className="btn-primary px-16 py-5 text-xl shadow-2xl disabled:opacity-50 disabled:grayscale"
                >
                  Save All Configurations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
