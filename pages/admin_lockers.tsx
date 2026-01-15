
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockerReceipt } from '../types';
import { cloudSync } from '../services/cloud_sync';

const AdminLockers: React.FC = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<LockerReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveRentals = async () => {
    setIsLoading(true);
    const data = await cloudSync.fetchRentals();
    if (data) setRentals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLiveRentals();
    const interval = setInterval(fetchLiveRentals, 15000); 
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const active = rentals.filter(r => r.status === 'issued');
    return {
      activeCount: active.length,
      securityHeld: active.reduce((s, r) => s + r.refundableAmount, 0),
      maleBusy: active.flatMap(r => r.maleLockers).length,
      femaleBusy: active.flatMap(r => r.femaleLockers).length,
    };
  }, [rentals]);

  return (
    <div className="p-4 sm:p-10 glass-card rounded-[2.5rem] border border-white/20 space-y-12 animate-fade max-w-7xl mx-auto my-6 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
      
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/admin')} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10">
              <i className="fas fa-chevron-left"></i>
           </button>
           <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Locker Analytics</h2>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Inventory Management Terminal</p>
           </div>
        </div>
        
        <button onClick={fetchLiveRentals} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all border border-blue-400/50">
          <i className={`fas fa-sync-alt mr-2 ${isLoading ? 'fa-spin' : ''}`}></i> Live Sync Refresh
        </button>
      </div>

      {/* High Visibility Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryItem label="Active Guest Sessions" value={stats.activeCount} icon="fa-user-tag" color="bg-blue-500" />
        <SummaryItem label="Total Cash Security" value={`₹${stats.securityHeld.toLocaleString()}`} icon="fa-money-bill-wave" color="bg-emerald-500" />
        <SummaryItem label="Male Lockers In-Use" value={`${stats.maleBusy} / 60`} icon="fa-male" color="bg-indigo-600" />
        <SummaryItem label="Female Lockers In-Use" value={`${stats.femaleBusy} / 60`} icon="fa-female" color="bg-pink-600" />
      </div>

      {/* Main Data Table */}
      <div className="bg-slate-900/50 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/30">
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Rental Transaction Stream</h4>
           <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Live Cloud Data</span>
           </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-center border-collapse">
            <thead className="bg-slate-900/80 text-[10px] font-black uppercase tracking-widest text-blue-400 border-b border-white/5">
              <tr>
                <th className="p-6 text-left">Ticket ID</th>
                <th className="text-left">Guest / Contact</th>
                <th>Asset Allocation</th>
                <th>Shift</th>
                <th>Deposit</th>
                <th>Action Status</th>
              </tr>
            </thead>
            <tbody className="text-white text-xs divide-y divide-white/5">
              {rentals.length === 0 ? (
                <tr><td colSpan={6} className="p-24 opacity-40 font-black uppercase tracking-widest text-sm">No rental records available in cloud</td></tr>
              ) : rentals.map((r, i) => (
                <tr key={i} className={`hover:bg-white/5 transition-all ${r.status === 'issued' ? 'bg-blue-500/5' : ''}`}>
                  <td className="p-6 text-left font-black text-blue-300">{r.receiptNo}</td>
                  <td className="text-left py-6">
                    <p className="font-black uppercase tracking-tight text-white">{r.guestName}</p>
                    <p className="text-[9px] font-bold text-white/50">{r.guestMobile}</p>
                  </td>
                  <td className="font-bold text-[11px]">
                    <div className="space-y-1">
                      {r.maleLockers.length > 0 && <span className="block text-indigo-400">M-Lockers: {r.maleLockers.join(',')}</span>}
                      {r.femaleLockers.length > 0 && <span className="block text-pink-400">F-Lockers: {r.femaleLockers.join(',')}</span>}
                      {(r.maleCostumes + r.femaleCostumes > 0) && <span className="block text-emerald-400">Costumes: {r.maleCostumes + r.femaleCostumes}</span>}
                    </div>
                  </td>
                  <td className="font-black uppercase text-[10px] text-white/60">{r.shift}</td>
                  <td className="font-black text-sm text-emerald-400">₹{r.securityDeposit}</td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'issued' ? 'bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-emerald-500 text-slate-900'}`}>
                      {r.status}
                    </span>
                    {r.returnedAt && (
                      <p className="text-[8px] font-bold text-white/30 mt-2">Ret: {new Date(r.returnedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="flex justify-between items-center opacity-30 px-4">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Spray Aqua Resort Operations</p>
          <div className="flex gap-4">
              <i className="fas fa-shield-alt text-lg text-white"></i>
              <i className="fas fa-database text-lg text-white"></i>
          </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, icon, color }: any) => (
  <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/10 flex items-center gap-6 shadow-xl hover:border-white/30 transition-all group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color} shadow-2xl transition-transform group-hover:scale-110`}>
      <i className={`fas ${icon} text-xl`}></i>
    </div>
    <div>
      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    </div>
  </div>
);

export default AdminLockers;
