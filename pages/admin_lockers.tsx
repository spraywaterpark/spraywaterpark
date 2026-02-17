
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockerReceipt, ShiftType } from '../types';
import { cloudSync } from '../services/cloud_sync';

const AdminLockers: React.FC = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<LockerReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryShift, setSummaryShift] = useState<ShiftType | 'all'>('all');

  const reportPrintRef = useRef<HTMLDivElement>(null);

  const fetchLiveRentals = async () => {
    setIsLoading(true);
    try {
      const data = await cloudSync.fetchRentals();
      setRentals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setRentals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRentals();
    const interval = setInterval(fetchLiveRentals, 20000); 
    return () => clearInterval(interval);
  }, []);

  const handleShiftCheckout = async () => {
    if (!window.confirm("RESET WARNING: This will mark all currently issued lockers as returned and reset counters. Continue?")) return;
    setIsLoading(true);
    const success = await cloudSync.checkoutShift();
    if (success) {
      alert("Shift Reset Successful.");
      await fetchLiveRentals();
    } else {
      alert("Reset failed. Check Cloud Sync.");
    }
    setIsLoading(false);
  };

  const stats = useMemo(() => {
    const active = rentals.filter(r => r.status === 'issued');
    return {
      activeCount: active.length,
      securityHeld: active.reduce((s, r) => s + (Number(r.refundableAmount) || 0), 0),
      maleBusy: active.flatMap(r => Array.isArray(r.maleLockers) ? r.maleLockers : []).length,
      femaleBusy: active.flatMap(r => Array.isArray(r.femaleLockers) ? r.femaleLockers : []).length,
    };
  }, [rentals]);

  const shiftReport = useMemo(() => {
    const filtered = rentals.filter(r => {
      const matchDate = r.date === summaryDate;
      const matchShift = summaryShift === 'all' || r.shift === summaryShift;
      return matchDate && matchShift;
    });

    const lockersIssued = filtered.reduce((sum, r) => sum + (r.maleLockers?.length || 0) + (r.femaleLockers?.length || 0), 0);
    const totalCollection = filtered.reduce((sum, r) => sum + (Number(r.totalCollected) || 0), 0);
    const totalRefund = filtered.filter(r => r.status === 'returned').reduce((sum, r) => sum + (Number(r.refundableAmount) || 0), 0);

    return {
      count: filtered.length,
      lockersIssued,
      totalCollection,
      totalRefund,
      netCollection: totalCollection - totalRefund
    };
  }, [rentals, summaryDate, summaryShift]);

  return (
    <div className="p-4 md:p-10 glass-card rounded-[2.5rem] border border-white/30 space-y-10 animate-slide-up max-w-7xl mx-auto my-6 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/admin')} className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 transition-all">
              <i className="fas fa-arrow-left"></i>
           </button>
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Locker Analytics</h2>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Cloud Asset Management</p>
           </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
            <button onClick={() => setShowSummary(true)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Summary Report</button>
            <button onClick={handleShiftCheckout} className="bg-red-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Reset Shift</button>
            <button onClick={fetchLiveRentals} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                {isLoading ? <i className="fas fa-sync fa-spin"></i> : 'Sync Now'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Active Lockers</p>
            <p className="text-2xl font-black text-slate-900">{stats.activeCount}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
            <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Security Cash</p>
            <p className="text-2xl font-black text-blue-600">₹{stats.securityHeld}</p>
        </div>
        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
            <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Male Busy</p>
            <p className="text-2xl font-black text-indigo-600">{stats.maleBusy}</p>
        </div>
        <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100 text-center">
            <p className="text-[9px] font-black text-pink-400 uppercase mb-1">Female Busy</p>
            <p className="text-2xl font-black text-pink-600">{stats.femaleBusy}</p>
        </div>
      </div>

      <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b">
              <tr>
                <th className="p-6 text-left">Receipt</th>
                <th className="text-left">Guest</th>
                <th>Assets</th>
                <th>Security</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold divide-y">
              {rentals.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-slate-400 uppercase">No locker records found.</td></tr>
              ) : rentals.map((r, i) => (
                <tr key={i} className={r.status === 'issued' ? 'bg-amber-50/50' : ''}>
                  <td className="p-6 text-left text-blue-600">{r.receiptNo}</td>
                  <td className="text-left py-4">
                    <p className="text-slate-900 font-black uppercase">{r.guestName}</p>
                    <p className="text-[9px] text-slate-400">{r.guestMobile}</p>
                  </td>
                  <td>
                    <div className="text-[9px] uppercase space-y-0.5">
                      {r.maleLockers.length > 0 && <span className="block text-indigo-600">M: {r.maleLockers.join(',')}</span>}
                      {r.femaleLockers.length > 0 && <span className="block text-pink-600">F: {r.femaleLockers.join(',')}</span>}
                    </div>
                  </td>
                  <td className="text-slate-900">₹{r.securityDeposit}</td>
                  <td>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${r.status === 'issued' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSummary && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 z-[2000]">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 space-y-8 animate-slide-up shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900 uppercase text-center tracking-tighter">Shift Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="input-premium" value={summaryDate} onChange={e => setSummaryDate(e.target.value)} />
                <select className="input-premium" value={summaryShift} onChange={e => setSummaryShift(e.target.value as any)}>
                   <option value="all">Full Day</option>
                   <option value="morning">Morning</option>
                   <option value="evening">Evening</option>
                </select>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl space-y-4 border border-slate-100">
                 <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black uppercase text-slate-400">Lockers Issued</span><span className="font-black">{shiftReport.lockersIssued}</span></div>
                 <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black uppercase text-slate-400">Gross Collected</span><span className="font-black">₹{shiftReport.totalCollection}</span></div>
                 <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black uppercase text-slate-400">Total Refunded</span><span className="font-black text-red-600">₹{shiftReport.totalRefund}</span></div>
                 <div className="flex justify-between pt-4"><span className="text-xs font-black uppercase text-slate-900">Net Revenue</span><span className="text-2xl font-black text-emerald-600">₹{shiftReport.netCollection}</span></div>
              </div>
              <button onClick={() => setShowSummary(false)} className="w-full btn-resort">Close Report</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminLockers;
