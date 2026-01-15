
import React, { useState, useEffect, useMemo } from 'react';
import { LockerReceipt } from '../types';
import { cloudSync } from '../services/cloud_sync';

const AdminLockers: React.FC = () => {
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
    const interval = setInterval(fetchLiveRentals, 15000); // 15s live update
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
    <div className="p-8 glass-card rounded-3xl border border-white/10 space-y-10 animate-fade">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Locker Management</h2>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Live Asset Inventory Tracking</p>
        </div>
        <button onClick={fetchLiveRentals} className="bg-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/20">
          <i className={`fas fa-sync-alt mr-2 ${isLoading ? 'fa-spin' : ''}`}></i> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryItem label="Active Receipts" value={stats.activeCount} icon="fa-file-invoice" color="bg-blue-500" />
        <SummaryItem label="Cash Security Held" value={`₹${stats.securityHeld}`} icon="fa-vault" color="bg-emerald-500" />
        <SummaryItem label="Male Lockers Busy" value={`${stats.maleBusy}/60`} icon="fa-male" color="bg-indigo-500" />
        <SummaryItem label="Female Lockers Busy" value={`${stats.femaleBusy}/60`} icon="fa-female" color="bg-pink-500" />
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-center">
            <thead className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
              <tr>
                <th className="p-5 text-left">Receipt</th>
                <th>Guest</th>
                <th>Assets</th>
                <th>Deposit</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody className="text-white/80 text-xs">
              {rentals.length === 0 ? (
                <tr><td colSpan={6} className="p-20 opacity-30 italic">No records found</td></tr>
              ) : rentals.map((r, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-5 text-left font-black">{r.receiptNo}</td>
                  <td className="text-left py-4">
                    <p className="font-bold">{r.guestName}</p>
                    <p className="text-[9px] opacity-40">{r.guestMobile}</p>
                  </td>
                  <td className="font-bold">
                    {r.maleLockers.length + r.femaleLockers.length > 0 && `L: ${[...r.maleLockers, ...r.femaleLockers].join(',')}`}
                    {(r.maleCostumes + r.femaleCostumes > 0) && ` | C: ${r.maleCostumes + r.femaleCostumes}`}
                  </td>
                  <td className="font-black text-emerald-400">₹{r.securityDeposit}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${r.status === 'issued' ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-[9px] opacity-50">{new Date(r.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, icon, color }: any) => (
  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center gap-5">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg shadow-${color}/20`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  </div>
);

export default AdminLockers;
