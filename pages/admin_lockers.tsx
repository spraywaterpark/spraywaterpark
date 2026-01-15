
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockerReceipt, ShiftType } from '../types';
import { cloudSync } from '../services/cloud_sync';

const AdminLockers: React.FC = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<LockerReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  
  // Summary Filters
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryShift, setSummaryShift] = useState<ShiftType | 'all'>('all');

  const reportPrintRef = useRef<HTMLDivElement>(null);

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

  const handleShiftCheckout = async () => {
    if (!confirm("Caution: This will mark ALL currently issued lockers as 'Returned' and RESET receipt counter to 0001 for all staff members. Proceed?")) return;
    
    setIsLoading(true);
    const success = await cloudSync.checkoutShift();
    if (success) {
      alert("Shift Checkout Complete! All lockers reset and receipt counters cleared.");
      await fetchLiveRentals();
    } else {
      alert("Checkout failed. Please check your cloud connection.");
    }
    setIsLoading(false);
  };

  const stats = useMemo(() => {
    const active = rentals.filter(r => r.status === 'issued');
    return {
      activeCount: active.length,
      securityHeld: active.reduce((s, r) => s + r.refundableAmount, 0),
      maleBusy: active.flatMap(r => r.maleLockers).length,
      femaleBusy: active.flatMap(r => r.femaleLockers).length,
    };
  }, [rentals]);

  // SHIFT REPORT CALCULATION
  const shiftReport = useMemo(() => {
    const filtered = rentals.filter(r => {
      const matchDate = r.date === summaryDate;
      const matchShift = summaryShift === 'all' || r.shift === summaryShift;
      return matchDate && matchShift;
    });

    const lockersIssued = filtered.reduce((sum, r) => sum + (r.maleLockers?.length || 0) + (r.femaleLockers?.length || 0), 0);
    const maleCostumes = filtered.reduce((sum, r) => sum + (Number(r.maleCostumes) || 0), 0);
    const femaleCostumes = filtered.reduce((sum, r) => sum + (Number(r.femaleCostumes) || 0), 0);
    
    const totalCollection = filtered.reduce((sum, r) => sum + (Number(r.totalCollected) || 0), 0);
    const totalRefund = filtered.filter(r => r.status === 'returned').reduce((sum, r) => sum + (Number(r.refundableAmount) || 0), 0);
    const netCollection = totalCollection - totalRefund;

    return {
      count: filtered.length,
      lockersIssued,
      maleCostumes,
      femaleCostumes,
      totalCollection,
      totalRefund,
      netCollection
    };
  }, [rentals, summaryDate, summaryShift]);

  const printReport = () => {
    const content = reportPrintRef.current?.innerHTML;
    const win = window.open('', '', 'width=900,height=1000');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Shift Summary Report - Spray Aqua Resort</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; text-transform: uppercase; font-size: 28px; }
              .header p { margin: 5px 0; font-weight: bold; font-size: 14px; letter-spacing: 2px; color: #666; }
              .meta-grid { display: grid; grid-cols: 2; gap: 20px; margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
              .report-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .report-table th, .report-table td { border: 1px solid #ddd; padding: 15px; text-align: left; }
              .report-table th { background: #f2f2f2; font-size: 12px; text-transform: uppercase; color: #555; }
              .report-table td { font-size: 16px; font-weight: bold; }
              .total-row { background: #eee; font-size: 18px; }
              .footer { margin-top: 60px; display: flex; justify-content: space-between; }
              .sign-box { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 10px; font-size: 12px; font-weight: bold; }
              .highlight { color: #0284c7; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      win.document.close();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  };

  return (
    <div className="p-4 sm:p-10 glass-card rounded-[2.5rem] border border-white/30 space-y-12 animate-fade max-w-7xl mx-auto my-6 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
      
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/admin')} className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all border border-white/20">
              <i className="fas fa-chevron-left"></i>
           </button>
           <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Locker Analytics</h2>
              <p className="text-blue-300 text-[11px] font-black uppercase tracking-[0.4em] mt-2 shadow-sm">Real-time Asset Control</p>
           </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto flex-wrap">
            <button onClick={() => setShowSummary(true)} className="flex-1 md:flex-none bg-emerald-500 text-slate-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-400 transition-all border border-emerald-400">
               <i className="fas fa-file-invoice mr-2"></i> Shift Summary
            </button>
            <button onClick={handleShiftCheckout} disabled={isLoading} className="flex-1 md:flex-none bg-red-600/90 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-red-700 transition-all border border-red-500">
               <i className="fas fa-sign-out-alt mr-2"></i> End Shift & Reset
            </button>
            <button onClick={fetchLiveRentals} className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all border border-blue-400">
              <i className={`fas fa-sync-alt mr-2 ${isLoading ? 'fa-spin' : ''}`}></i> Refresh Data
            </button>
        </div>
      </div>

      {/* High Visibility Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryItem label="Active Sessions" value={stats.activeCount} icon="fa-user-tag" color="bg-blue-500" />
        <SummaryItem label="Cash Security Held" value={`₹${stats.securityHeld.toLocaleString()}`} icon="fa-vault" color="bg-emerald-500" />
        <SummaryItem label="Male Lockers Busy" value={`${stats.maleBusy} / 60`} icon="fa-male" color="bg-indigo-600" />
        <SummaryItem label="Female Lockers Busy" value={`${stats.femaleBusy} / 60`} icon="fa-female" color="bg-pink-600" />
      </div>

      {/* Main Data Table */}
      <div className="bg-slate-900/80 border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/20 flex justify-between items-center bg-slate-900/50">
           <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Live Transaction Stream</h4>
           <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]"></span>
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Active Syncing</span>
           </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-center border-collapse">
            <thead className="bg-slate-900 text-[11px] font-black uppercase tracking-widest text-blue-300 border-b border-white/10">
              <tr>
                <th className="p-6 text-left">Receipt ID</th>
                <th className="text-left">Guest Info</th>
                <th>Assets Assigned</th>
                <th>Shift</th>
                <th>Deposit</th>
                <th>Live Status</th>
              </tr>
            </thead>
            <tbody className="text-white text-xs divide-y divide-white/10 font-medium">
              {rentals.length === 0 ? (
                <tr><td colSpan={6} className="p-24 opacity-60 font-black uppercase tracking-widest text-sm text-white">No rental records available in cloud</td></tr>
              ) : rentals.map((r, i) => (
                <tr key={i} className={`hover:bg-white/10 transition-all ${r.status === 'issued' ? 'bg-blue-500/10' : ''}`}>
                  <td className="p-6 text-left font-black text-blue-300 text-sm">{r.receiptNo}</td>
                  <td className="text-left py-6">
                    <p className="font-black uppercase tracking-tight text-white text-sm">{r.guestName}</p>
                    <p className="text-[10px] font-bold text-white/60">{r.guestMobile}</p>
                  </td>
                  <td className="font-bold text-[11px]">
                    <div className="space-y-1">
                      {r.maleLockers.length > 0 && <span className="block text-indigo-300">Male Lockers: {r.maleLockers.join(',')}</span>}
                      {r.femaleLockers.length > 0 && <span className="block text-pink-300">Female Lockers: {r.femaleLockers.join(',')}</span>}
                      {(r.maleCostumes + r.femaleCostumes > 0) && <span className="block text-emerald-300">Costumes: {r.maleCostumes + r.femaleCostumes}</span>}
                    </div>
                  </td>
                  <td className="font-black uppercase text-[11px] text-white/80">{r.shift}</td>
                  <td className="font-black text-base text-emerald-400">₹{r.securityDeposit}</td>
                  <td className="p-6">
                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'issued' ? 'bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'bg-emerald-500 text-slate-950'}`}>
                      {r.status}
                    </span>
                    {r.returnedAt && (
                      <p className="text-[9px] font-bold text-white/40 mt-2">Closed: {new Date(r.returnedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="flex justify-between items-center opacity-40 px-4">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">Spray Aqua Resort Systems</p>
          <div className="flex gap-5">
              <i className="fas fa-lock text-white"></i>
              <i className="fas fa-cloud text-white"></i>
          </div>
      </div>

      {/* SHIFT SUMMARY MODAL */}
      {showSummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 z-[1000] animate-fade">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Shift Summary Report</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Configure parameters for report</p>
               </div>
               <button onClick={() => setShowSummary(false)} className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors">
                  <i className="fas fa-times"></i>
               </button>
            </div>

            <div className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Date</label>
                     <input type="date" className="input-premium border-2 border-slate-200" value={summaryDate} onChange={e => setSummaryDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Shift</label>
                     <select className="input-premium border-2 border-slate-200" value={summaryShift} onChange={e => setSummaryShift(e.target.value as any)}>
                        <option value="all">Full Day (All Shifts)</option>
                        <option value="morning">Morning Shift</option>
                        <option value="evening">Evening Shift</option>
                     </select>
                  </div>
               </div>

               {/* Hidden Report Content for Print */}
               <div ref={reportPrintRef} className="hidden print:block">
                  <div className="header">
                      <h1>Spray Aqua Resort</h1>
                      <p>SHIFT RECONCILIATION REPORT</p>
                  </div>

                  <div className="meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <div>
                          <p><span style={{color: '#888'}}>Report Date:</span> ${summaryDate}</p>
                          <p><span style={{color: '#888'}}>Shift Name:</span> ${summaryShift === 'all' ? 'FULL DAY' : summaryShift.toUpperCase()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                          <p><span style={{color: '#888'}}>Records Found:</span> ${shiftReport.count}</p>
                          <p><span style={{color: '#888'}}>Generated At:</span> ${new Date().toLocaleString()}</p>
                      </div>
                  </div>

                  <table className="report-table">
                      <thead>
                        <tr><th>Category</th><th>Quantity / Value</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>Lockers Issued</td><td>${shiftReport.lockersIssued} Units</td></tr>
                        <tr><td>Male Costumes Issued</td><td>${shiftReport.maleCostumes} Units</td></tr>
                        <tr><td>Female Costumes Issued</td><td>${shiftReport.femaleCostumes} Units</td></tr>
                        <tr><td>Total Gross Collection (Rent + Security)</td><td>₹${shiftReport.totalCollection.toLocaleString()}</td></tr>
                        <tr><td>Total Security Refunded</td><td>₹${shiftReport.totalRefund.toLocaleString()}</td></tr>
                        <tr className="total-row"><td>NET REVENUE COLLECTION</td><td>₹${shiftReport.netCollection.toLocaleString()}</td></tr>
                      </tbody>
                  </table>

                  <div className="footer">
                      <div className="sign-box">SHIFT MANAGER SIGNATURE</div>
                      <div className="sign-box">AUDITOR / ACCOUNTS DEPT</div>
                  </div>
               </div>

               {/* Visual Preview for UI */}
               <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 uppercase text-[10px]">Lockers Issued:</span>
                      <span className="font-black text-slate-900">{shiftReport.lockersIssued}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 uppercase text-[10px]">Total Costumes:</span>
                      <span className="font-black text-slate-900">{shiftReport.maleCostumes + shiftReport.femaleCostumes}</span>
                  </div>
                  <div className="pt-4 border-t-2 border-dashed border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Gross Collection:</span>
                        <span className="font-bold text-slate-900">₹{shiftReport.totalCollection}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Total Refunds:</span>
                        <span className="font-bold text-red-600">₹{shiftReport.totalRefund}</span>
                      </div>
                      <div className="flex justify-between items-center bg-emerald-500 text-white p-4 rounded-xl shadow-lg">
                        <span className="font-black uppercase text-xs">Net Cash Collection:</span>
                        <span className="font-black text-2xl tracking-tighter">₹{shiftReport.netCollection}</span>
                      </div>
                  </div>
               </div>

               <button onClick={printReport} className="w-full btn-resort h-16 shadow-2xl !bg-slate-900 text-white font-black">
                  <i className="fas fa-print mr-2"></i> Print Official Report
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryItem = ({ label, value, icon, color }: any) => (
  <div className="bg-slate-900/80 p-6 rounded-[2rem] border border-white/20 flex items-center gap-6 shadow-2xl hover:border-white/50 transition-all group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color} shadow-2xl transition-transform group-hover:scale-110`}>
      <i className={`fas ${icon} text-xl`}></i>
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">{label}</p>
      <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    </div>
  </div>
);

export default AdminLockers;
