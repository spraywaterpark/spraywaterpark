
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';
import { LOCKER_RULES, COSTUME_RULES } from '../constants';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  // Mode logic: staff1 -> entry, staff2 -> issue
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(
    role === 'staff1' ? 'entry' : 'issue'
  );
  
  // staff1 States (Unchanged as requested)
  const [scannedTicket, setScannedTicket] = useState<Booking | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [manualId, setManualId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // staff2 Issuance States
  const [issuanceStep, setIssuanceStep] = useState<'form' | 'review' | 'paid'>('form');
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [mLockers, setMLockers] = useState('');
  const [fLockers, setFLockers] = useState('');
  const [mCostumes, setMCostumes] = useState(0);
  const [fCostumes, setFCostumes] = useState(0);
  const [issuedReceipt, setIssuedReceipt] = useState<LockerReceipt | null>(null);

  // staff2 Return States
  const [activeRentals, setActiveRentals] = useState<LockerReceipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<LockerReceipt | null>(null);

  // IST HELPER
  const getISTInfo = () => {
    const d = new Date();
    const istStr = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istStr);
    return {
      todayStr: istDate.toLocaleDateString('en-CA'),
      currentHour: istDate.getHours()
    };
  };

  const refreshRentals = async () => {
    if (role === 'staff1') return;
    const data = await cloudSync.fetchRentals();
    if (data) setActiveRentals(data);
  };

  useEffect(() => {
    refreshRentals();
  }, [mode]);

  // --- staff1 Handlers ---
  const startScanner = () => {
    setScannedTicket(null);
    setIsScanning(true);
    setTimeout(() => {
      try {
        const html5QrCode = new (window as any).Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        html5QrCode.start(
          { facingMode: "environment" }, 
          { fps: 15, qrbox: { width: 250, height: 250 } }, 
          (decoded: string) => { stopScanner().then(() => fetchTicketDetails(decoded)); }, 
          () => {} 
        ).catch(() => setIsScanning(false));
      } catch (e) { setIsScanning(false); }
    }, 300);
  };

  const stopScanner = async () => { 
    if (scannerRef.current) {
        try { await scannerRef.current.stop(); scannerRef.current = null; } catch (e) { }
    }
    setIsScanning(false); 
  };

  const fetchTicketDetails = async (id: string) => {
    if (!id.trim()) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/booking?type=ticket_details&id=${id.trim().toUpperCase()}`);
      const data = await res.json();
      if (data.success) setScannedTicket(data.booking);
      else alert("TICKET NOT FOUND");
    } catch (e) { alert("Sync Error"); } finally { setIsSyncing(false); }
  };

  const confirmEntry = async () => {
    if (!scannedTicket) return;
    setIsSyncing(true);
    try {
        const res = await fetch('/api/booking?type=checkin', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ticketId: scannedTicket.id }) 
        });
        const data = await res.json();
        if (data.success) {
            notificationService.sendWelcomeMessage(scannedTicket).catch(() => {});
            alert("ENTRY CONFIRMED!");
            setScannedTicket(null);
        }
    } catch (e) { alert("Error"); } finally { setIsSyncing(false); }
  };

  // --- staff2 Handlers ---
  const calculateTotals = () => {
    const maleLockerCount = mLockers.split(',').filter(x => x.trim()).length;
    const femaleLockerCount = fLockers.split(',').filter(x => x.trim()).length;

    const rent = (maleLockerCount * LOCKER_RULES.MALE_LOCKER_RENT) + 
                 (femaleLockerCount * LOCKER_RULES.FEMALE_LOCKER_RENT) + 
                 (mCostumes * COSTUME_RULES.MALE_COSTUME_RENT) + 
                 (fCostumes * COSTUME_RULES.FEMALE_COSTUME_RENT);

    const deposit = (maleLockerCount * LOCKER_RULES.MALE_LOCKER_DEPOSIT) + 
                    (femaleLockerCount * LOCKER_RULES.FEMALE_LOCKER_DEPOSIT) + 
                    (mCostumes * COSTUME_RULES.MALE_COSTUME_DEPOSIT) + 
                    (fCostumes * COSTUME_RULES.FEMALE_COSTUME_DEPOSIT);

    return { rent, deposit, total: rent + deposit };
  };

  const handleFinalGenerate = async () => {
    setIsSyncing(true);
    const { todayStr, currentHour } = getISTInfo();
    const { rent, deposit, total } = calculateTotals();
    
    const receipt: LockerReceipt = {
      receiptNo: `LKR-${Date.now().toString().slice(-6)}`,
      guestName,
      guestMobile,
      date: todayStr,
      shift: currentHour < 15 ? 'morning' : 'evening',
      maleLockers: mLockers.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x)),
      femaleLockers: fLockers.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x)),
      maleCostumes: mCostumes,
      femaleCostumes: fCostumes,
      rentAmount: rent,
      securityDeposit: deposit,
      totalCollected: total,
      refundableAmount: deposit,
      status: 'issued',
      createdAt: new Date().toISOString()
    };

    const success = await cloudSync.saveRental(receipt);
    if (success) {
      setIssuedReceipt(receipt);
      // Clean up
      setIssuanceStep('form');
      setGuestName(''); setGuestMobile(''); setMLockers(''); setFLockers(''); setMCostumes(0); setFCostumes(0);
      refreshRentals();
    } else {
      alert("Database Sync Failed. Check Internet.");
    }
    setIsSyncing(false);
  };

  const handleReturnLocker = async (receipt: LockerReceipt) => {
    setIsSyncing(true);
    const updated = { ...receipt, status: 'returned' as const };
    const success = await cloudSync.updateRental(updated);
    if (success) {
      alert("Items Returned. Security Refunded.");
      setSelectedReturn(null);
      setSearchQuery('');
      refreshRentals();
    }
    setIsSyncing(false);
  };

  const findReturnReceipt = () => {
    const r = activeRentals.find(x => x.status === 'issued' && (x.receiptNo === searchQuery.toUpperCase() || x.guestMobile === searchQuery));
    if (r) setSelectedReturn(r);
    else alert("Active Receipt Not Found");
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-3 text-white min-h-[90vh]">
      
      {/* Role Based Navigation */}
      {(role === 'admin' || role === 'staff2' || !role) && (
        <div className="w-full max-w-md flex bg-white/10 rounded-full p-1 border border-white/10 mb-8">
            {role !== 'staff2' && (
              <button onClick={() => setMode('entry')} className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase tracking-widest ${mode === 'entry' ? 'bg-blue-600' : 'text-white/40'}`}>Gate</button>
            )}
            <button onClick={() => { setMode('issue'); setIssuanceStep('form'); setIssuedReceipt(null); }} className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase tracking-widest ${mode === 'issue' ? 'bg-emerald-600' : 'text-white/40'}`}>Issue</button>
            <button onClick={() => { setMode('return'); setSelectedReturn(null); }} className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase tracking-widest ${mode === 'return' ? 'bg-amber-600' : 'text-white/40'}`}>Return</button>
        </div>
      )}

      {/* Mode: Gate Entry (staff1) */}
      {mode === 'entry' && (
        <div className="w-full max-w-md space-y-6">
           <div className="bg-white/10 rounded-[2.5rem] p-6 text-center space-y-6 border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tight">Gate Entry</h3>
              <div className="space-y-3">
                <input type="text" placeholder="SAR/XXXXXX-XXX" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black uppercase text-sm" value={manualId} onChange={e => setManualId(e.target.value)} />
                <button onClick={() => fetchTicketDetails(manualId)} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">Search Ticket</button>
              </div>
              {!isScanning && !scannedTicket && (
                <button onClick={startScanner} className="w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-[2rem] font-black uppercase flex flex-col items-center justify-center gap-2">
                  <i className="fas fa-camera text-3xl"></i><span className="text-[10px]">Scan QR Code</span>
                </button>
              )}
              {isScanning && (
                <div className="space-y-4">
                   <div id="reader" className="w-full rounded-[2rem] overflow-hidden bg-black min-h-[250px]"></div>
                   <button onClick={stopScanner} className="text-red-400 font-black uppercase text-[10px] p-2">Cancel Camera</button>
                </div>
              )}
              {scannedTicket && (
                <div className="bg-white text-slate-900 rounded-[2rem] p-6 text-left space-y-4 border border-slate-100 shadow-2xl animate-slide-up">
                   <div className="flex justify-between items-start">
                      <h4 className="font-black text-lg break-all">{scannedTicket.id}</h4>
                      <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase bg-emerald-100 text-emerald-600`}>Confirmed</span>
                   </div>
                   <p className="text-xs font-bold text-slate-500 uppercase">{scannedTicket.name} — {scannedTicket.adults + scannedTicket.kids} Guests</p>
                   <div className="pt-2">
                      <button onClick={confirmEntry} disabled={isSyncing} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">
                        {isSyncing ? 'Syncing...' : 'Allow Entry'}
                      </button>
                   </div>
                   <button onClick={() => setScannedTicket(null)} className="w-full text-center text-[9px] font-black uppercase text-slate-400">Close</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Mode: Locker Issuance (staff2) */}
      {mode === 'issue' && !issuedReceipt && (
        <div className="w-full max-w-md space-y-6">
           <div className="bg-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl backdrop-blur-3xl">
              <h3 className="text-xl font-black uppercase tracking-widest text-center">
                {issuanceStep === 'form' ? 'Locker Issuance' : issuanceStep === 'review' ? 'Review & Pay' : 'Ready to Print'}
              </h3>
              
              {issuanceStep === 'form' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                      <input placeholder="GUEST NAME" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black uppercase text-sm" value={guestName} onChange={e=>setGuestName(e.target.value)} />
                      <input placeholder="MOBILE NUMBER" maxLength={10} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-sm" value={guestMobile} onChange={e=>setGuestMobile(e.target.value.replace(/\D/g,''))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-indigo-400 px-2">Male Lockers</label>
                        <input placeholder="e.g. 1, 5" className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 font-black text-sm" value={mLockers} onChange={e=>setMLockers(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-pink-400 px-2">Female Lockers</label>
                        <input placeholder="e.g. 2, 8" className="w-full bg-pink-500/10 border border-pink-500/20 rounded-2xl px-5 py-4 font-black text-sm" value={fLockers} onChange={e=>setFLockers(e.target.value)} />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-white/40 px-2">Male Costumes</label>
                        <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 p-1">
                            <button onClick={()=>setMCostumes(Math.max(0, mCostumes-1))} className="w-10 h-10 rounded-xl bg-white/5 font-black">-</button>
                            <span className="flex-1 text-center font-black">{mCostumes}</span>
                            <button onClick={()=>setMCostumes(mCostumes+1)} className="w-10 h-10 rounded-xl bg-white/5 font-black">+</button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-white/40 px-2">Female Costumes</label>
                        <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 p-1">
                            <button onClick={()=>setFCostumes(Math.max(0, fCostumes-1))} className="w-10 h-10 rounded-xl bg-white/5 font-black">-</button>
                            <span className="flex-1 text-center font-black">{fCostumes}</span>
                            <button onClick={()=>setFCostumes(fCostumes+1)} className="w-10 h-10 rounded-xl bg-white/5 font-black">+</button>
                        </div>
                      </div>
                  </div>
                  <button onClick={() => { if(!guestName || !guestMobile) alert("Missing Guest Info"); else setIssuanceStep('review'); }} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Calculate Bill</button>
                </div>
              )}

              {issuanceStep === 'review' && (
                <div className="space-y-8 animate-slide-up">
                   <div className="bg-white/5 p-6 rounded-3xl space-y-4 border border-white/10">
                      <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase"><span>Guest</span><span className="text-white">{guestName}</span></div>
                      <div className="h-px bg-white/5"></div>
                      <div className="flex justify-between items-center text-[11px] font-bold"><span>Total Rent</span><span className="text-white font-black">₹{calculateTotals().rent}</span></div>
                      <div className="flex justify-between items-center text-[11px] font-bold"><span>Security Deposit</span><span className="text-white font-black">₹{calculateTotals().deposit}</span></div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                         <span className="text-[10px] font-black uppercase text-emerald-400">Total to Collect</span>
                         <span className="text-4xl font-black text-emerald-400">₹{calculateTotals().total}</span>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <button onClick={() => setIssuanceStep('paid')} className="w-full bg-emerald-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl">Confirm Guest Paid</button>
                      <button onClick={() => setIssuanceStep('form')} className="w-full py-2 text-[9px] font-black uppercase text-white/40">Edit Details</button>
                   </div>
                </div>
              )}

              {issuanceStep === 'paid' && (
                <div className="space-y-8 text-center animate-slide-up">
                   <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto"><i className="fas fa-money-bill-wave"></i></div>
                   <div className="space-y-2">
                      <p className="text-sm font-black uppercase text-emerald-500">Payment Verified</p>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Click below to generate official receipt</p>
                   </div>
                   <button onClick={handleFinalGenerate} disabled={isSyncing} className="w-full bg-white text-slate-900 h-20 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">
                      {isSyncing ? 'Saving to Cloud...' : 'Print / Generate Receipt'}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Issuance Success (Printable View) */}
      {issuedReceipt && (
        <div className="w-full max-w-md animate-slide-up">
           <div className="bg-white text-slate-900 rounded-[3rem] p-8 space-y-8 shadow-2xl border border-slate-100">
              <div className="text-center space-y-1">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4"><i className="fas fa-print"></i></div>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Success!</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt: {issuedReceipt.receiptNo}</p>
              </div>
              <div className="space-y-4 border-y border-slate-100 py-6">
                 <div className="flex justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                    <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Paid & Issued</span>
                 </div>
                 <div className="flex justify-between"><span className="text-[9px] font-black text-slate-400 uppercase">Guest</span><span className="text-sm font-black uppercase">{issuedReceipt.guestName}</span></div>
                 {issuedReceipt.maleLockers.length > 0 && <div className="flex justify-between items-start"><span className="text-[9px] font-black text-indigo-400 uppercase">M-Lockers</span><span className="text-sm font-black text-right">{issuedReceipt.maleLockers.join(', ')}</span></div>}
                 {issuedReceipt.femaleLockers.length > 0 && <div className="flex justify-between items-start"><span className="text-[9px] font-black text-pink-400 uppercase">F-Lockers</span><span className="text-sm font-black text-right">{issuedReceipt.femaleLockers.join(', ')}</span></div>}
                 <div className="flex justify-between border-t border-slate-50 pt-4"><span className="text-[9px] font-black text-slate-400 uppercase">Refundable Dep.</span><span className="text-lg font-black text-emerald-600">₹{issuedReceipt.refundableAmount}</span></div>
              </div>
              <button onClick={()=>setIssuedReceipt(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Process Next Guest</button>
           </div>
        </div>
      )}

      {/* Mode: Locker Return (staff2) */}
      {mode === 'return' && (
        <div className="w-full max-w-md space-y-6">
           <div className="bg-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl backdrop-blur-3xl">
              <h3 className="text-xl font-black uppercase tracking-widest text-center">Process Return</h3>
              
              <div className="flex flex-col gap-3">
                 <input 
                   placeholder="MOBILE OR RECEIPT #" 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-black uppercase text-sm outline-none focus:border-amber-500" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
                 <button onClick={findReturnReceipt} className="w-full bg-amber-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Search Active Rental</button>
              </div>

              {selectedReturn && (
                <div className="bg-white text-slate-900 rounded-[2rem] p-6 space-y-6 shadow-2xl animate-slide-up">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-400">Return Checklist for</p>
                      <h4 className="text-xl font-black uppercase">{selectedReturn.guestName}</h4>
                   </div>

                   <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200 pb-2">Items to Collect</p>
                      <div className="space-y-2">
                         {selectedReturn.maleLockers.length > 0 && <div className="flex justify-between text-xs font-bold"><span className="text-indigo-600">Male Lockers:</span><span>{selectedReturn.maleLockers.join(', ')}</span></div>}
                         {selectedReturn.femaleLockers.length > 0 && <div className="flex justify-between text-xs font-bold"><span className="text-pink-600">Female Lockers:</span><span>{selectedReturn.femaleLockers.join(', ')}</span></div>}
                         {selectedReturn.maleCostumes > 0 && <div className="flex justify-between text-xs font-bold"><span>Male Costumes:</span><span>{selectedReturn.maleCostumes} Units</span></div>}
                         {selectedReturn.femaleCostumes > 0 && <div className="flex justify-between text-xs font-bold"><span>Female Costumes:</span><span>{selectedReturn.femaleCostumes} Units</span></div>}
                      </div>
                      <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                         <span className="text-[10px] font-black uppercase text-amber-600">Refund Amount</span>
                         <span className="text-3xl font-black text-amber-600">₹{selectedReturn.refundableAmount}</span>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <button onClick={()=>handleReturnLocker(selectedReturn)} disabled={isSyncing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
                        {isSyncing ? 'Processing...' : 'Confirm Return & Refund'}
                      </button>
                      <button onClick={()=>setSelectedReturn(null)} className="w-full py-1 text-[9px] font-black uppercase text-slate-400">Cancel Search</button>
                   </div>
                </div>
              )}

              {!selectedReturn && (
                <p className="text-center text-[9px] font-black text-white/20 uppercase py-10 tracking-[0.2em]">Enter ID or Mobile above to start return</p>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
export default StaffPortal;
