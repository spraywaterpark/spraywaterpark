
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
    if (!window.confirm("RESET WARNING: This will mark all currently issued lockers as returned and reset counters to ZERO. Continue?")) return;
    setIsLoading(true);
    const success = await cloudSync.checkoutShift();
    if (success) {
      alert("Shift Reset Successful. All counters are now zero.");
      await fetchLiveRentals(); // Force refresh to show zero
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
    const costumesIssued = filtered.reduce((sum, r) => sum + (Number(r.maleCostumes) || 0) + (Number(r.femaleCostumes) || 0), 0);
    const totalCollection = filtered.reduce((sum, r) => sum + (Number(r.totalCollected) || 0), 0);
    const totalRefund = filtered.filter(r => r.status === 'returned').reduce((sum, r) => sum + (Number(r.refundableAmount) || 0), 0);

    return {
      count: filtered.length,
      lockersIssued,
      costumesIssued,
      totalCollection,
      totalRefund,
      netCollection: totalCollection - totalRefund
    };
  }, [rentals, summaryDate, summaryShift]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-10 glass-card rounded-[2.5rem] border border-white/30 space-y-10 animate-slide-up max-w-7xl mx-auto my-6 shadow-2xl relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/admin')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl font-black text-[10px] uppercase">
              <i className="fas fa-arrow-left"></i> BACK
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
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

      <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm no-print">
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
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 z-[2000] no-print">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 space-y-8 animate-slide-up shadow-2xl relative">
              <button onClick={() => setShowSummary(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <i className="fas fa-times"></i>
              </button>
              
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Shift Summary</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Revenue & Asset Report</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-400 px-2">Report Date</p>
                    <input type="date" className="input-premium !py-3 !text-sm" value={summaryDate} onChange={e => setSummaryDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-400 px-2">Session</p>
                    <select className="input-premium !py-3 !text-sm" value={summaryShift} onChange={e => setSummaryShift(e.target.value as any)}>
                        <option value="all">Full Day</option>
                        <option value="morning">Morning Shift</option>
                        <option value="evening">Evening Shift</option>
                    </select>
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] space-y-5 border border-slate-100">
                 <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Locker Keys Issued</span>
                    <span className="text-sm font-black text-slate-900">{shiftReport.lockersIssued} Units</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Costumes Issued</span>
                    <span className="text-sm font-black text-slate-900">{shiftReport.costumesIssued} Units</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gross Collection</span>
                    <span className="text-sm font-black text-slate-900">₹{shiftReport.totalCollection}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Security Refunded</span>
                    <span className="text-sm font-black text-red-600">₹{shiftReport.totalRefund}</span>
                 </div>
                 <div className="flex justify-between items-center pt-4">
                    <span className="text-xs font-black uppercase text-slate-900">Net Revenue</span>
                    <span className="text-4xl font-black text-emerald-600 tracking-tighter">₹{shiftReport.netCollection}</span>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                  <button onClick={handlePrintReport} className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                      <i className="fas fa-print"></i> Print Official Report
                  </button>
                  <button onClick={() => setShowSummary(false)} className="w-full py-4 text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all">Close Analytics</button>
              </div>
           </div>
        </div>
      )}

      {/* Hidden Print Report Layout */}
      <div className="hidden print:block fixed inset-0 bg-white p-12 text-black font-mono space-y-10 z-[3000]">
          <div className="text-center border-b-2 border-black pb-4">
              <h1 className="text-3xl font-bold uppercase">Spray Aqua Resort</h1>
              <p className="text-sm font-bold mt-1">Locker & Asset Shift Report</p>
          </div>
          
          <div className="grid grid-cols-2 gap-y-4 text-sm font-bold border-b pb-6">
              <p>REPORT DATE:</p><p className="text-right">{summaryDate}</p>
              <p>SHIFT TYPE:</p><p className="text-right uppercase">{summaryShift}</p>
              <p>GENERATED AT:</p><p className="text-right">{new Date().toLocaleString()}</p>
          </div>

          <div className="space-y-4 pt-6 text-lg font-bold">
              <div className="flex justify-between"><span>LOCKER KEYS ISSUED:</span><span>{shiftReport.lockersIssued} Units</span></div>
              <div className="flex justify-between"><span>COSTUMES ISSUED:</span><span>{shiftReport.costumesIssued} Units</span></div>
              <div className="flex justify-between pt-4 border-t"><span>GROSS COLLECTION:</span><span>₹{shiftReport.totalCollection}</span></div>
              <div className="flex justify-between"><span>SECURITY REFUNDED:</span><span>- ₹{shiftReport.totalRefund}</span></div>
              <div className="flex justify-between text-2xl border-t-2 border-black pt-4"><span>NET CASH REVENUE:</span><span>₹{shiftReport.netCollection}</span></div>
          </div>

          <div className="pt-24 flex justify-between px-10">
              <div className="text-center border-t border-black w-40 pt-2"><p className="text-[10px]">Staff Signature</p></div>
              <div className="text-center border-t border-black w-40 pt-2"><p className="text-[10px]">Manager Signature</p></div>
          </div>
      </div>

      <style>{`
        @media print {
            body * { visibility: hidden !important; }
            .print\\:block, .print\\:block * { visibility: visible !important; }
            .print\\:block { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminLockers;
