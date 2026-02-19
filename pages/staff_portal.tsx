
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';
import { COSTUME_RULES, LOCKER_RULES } from '../constants';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(
    role === 'staff1' ? 'entry' : 'issue'
  );
  
  // --- STAFF 1 STATES (PRESERVED) ---
  const [scannedTicket, setScannedTicket] = useState<Booking | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [manualId, setManualId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // --- STAFF 2 STATES (RESTORED GRID & ASSETS) ---
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [shift, setShift] = useState<ShiftType>('morning');
  const [maleLockers, setMaleLockers] = useState<number[]>([]);
  const [femaleLockers, setFemaleLockers] = useState<number[]>([]);
  const [maleCostumes, setMaleCostumes] = useState(0);
  const [femaleCostumes, setFemaleCostumes] = useState(0);

  const [receipt, setReceipt] = useState<LockerReceipt | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [returnReceipt, setReturnReceipt] = useState<LockerReceipt | null>(null);

  const [allRentals, setAllRentals] = useState<LockerReceipt[]>([]);
  
  const inventory = useMemo(() => {
    const activeRecords = allRentals.filter(r => r.status === 'issued');
    const mBusy = activeRecords.flatMap(r => r.maleLockers || []);
    const fBusy = activeRecords.flatMap(r => r.femaleLockers || []);
    const mIssuedCostumes = activeRecords.reduce((s, r) => s + (r.maleCostumes || 0), 0);
    const fIssuedCostumes = activeRecords.reduce((s, r) => s + (r.femaleCostumes || 0), 0);

    return {
      maleBusy: mBusy,
      femaleBusy: fBusy,
      maleRem: COSTUME_RULES.MALE_COSTUME_TOTAL - mIssuedCostumes,
      femaleRem: COSTUME_RULES.FEMALE_COSTUME_TOTAL - fIssuedCostumes
    };
  }, [allRentals]);

  const refreshActive = async () => {
    if (isSyncing) return;
    const rentals = await cloudSync.fetchRentals();
    if (rentals) {
      setAllRentals(rentals);
    }
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 15000); 
    return () => clearInterval(interval);
  }, [mode]);

  // --- HANDLERS ---
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

  const calculateBreakdown = () => {
    const mLockers = maleLockers.length;
    const fLockers = femaleLockers.length;
    const mCostumesNum = Number(maleCostumes) || 0;
    const fCostumesNum = Number(femaleCostumes) || 0;

    const lockerRent = (mLockers * LOCKER_RULES.MALE_LOCKER_RENT) + (fLockers * LOCKER_RULES.FEMALE_LOCKER_RENT);
    const mCostumeRent = mCostumesNum * COSTUME_RULES.MALE_COSTUME_RENT;
    const fCostumeRent = fCostumesNum * COSTUME_RULES.FEMALE_COSTUME_RENT;

    const lockerDep = (mLockers * LOCKER_RULES.MALE_LOCKER_DEPOSIT) + (fLockers * LOCKER_RULES.FEMALE_LOCKER_DEPOSIT);
    const mCostumeDep = mCostumesNum * COSTUME_RULES.MALE_COSTUME_DEPOSIT;
    const fCostumeDep = fCostumesNum * COSTUME_RULES.FEMALE_COSTUME_DEPOSIT;

    const totalRent = lockerRent + mCostumeRent + fCostumeRent;
    const totalDeposit = lockerDep + mCostumeDep + fCostumeDep;

    return { 
      lockerRent, mCostumeRent, fCostumeRent, 
      lockerDep, mCostumeDep, fCostumeDep, 
      totalRent, totalDeposit, total: totalRent + totalDeposit 
    };
  };

  const generateReceiptNo = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const shiftCode = shift === 'morning' ? '1' : '2';
    const seq = String(allRentals.length + 1).padStart(3, '0');
    return `SWP/${dd}${mm}${yy}${shiftCode}-${seq}`;
  };

  const handleGenerateBill = () => {
    if (!guestName) return alert("Please enter Guest Name.");
    if (maleLockers.length === 0 && femaleLockers.length === 0 && maleCostumes === 0 && femaleCostumes === 0) {
      return alert("Select at least one asset.");
    }
    const { totalRent, totalDeposit, total } = calculateBreakdown();
    setReceipt({
      receiptNo: generateReceiptNo(), guestName, guestMobile, date: new Date().toISOString().split('T')[0],
      shift, maleLockers, femaleLockers, maleCostumes, femaleCostumes,
      rentAmount: totalRent, securityDeposit: totalDeposit, totalCollected: total, refundableAmount: totalDeposit,
      status: 'issued', createdAt: new Date().toISOString()
    });
  };

  const confirmAndSave = async () => {
    if (!receipt) return;
    setIsSyncing(true);
    const success = await cloudSync.saveRental(receipt);
    if (success) {
      // Trigger browser print
      setTimeout(() => window.print(), 500);
      alert("SUCCESS: Bill Saved & Printing...");
      setGuestName(''); setGuestMobile(''); setMaleLockers([]); setFemaleLockers([]); setMaleCostumes(0); setFemaleCostumes(0); setReceipt(null);
      await refreshActive();
    } else alert("Sync failed.");
    setIsSyncing(false);
  };

  const renderGrid = (gender: 'male' | 'female') => {
    const list = gender === 'male' ? maleLockers : femaleLockers;
    const setList = gender === 'male' ? setMaleLockers : setFemaleLockers;
    const busyList = gender === 'male' ? inventory.maleBusy : inventory.femaleBusy;

    return Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
      const isBusy = busyList.includes(num);
      const isSelected = list.includes(num);
      return (
        <button 
          key={num} 
          disabled={isBusy}
          onClick={() => setList(isSelected ? list.filter(n => n !== num) : [...list, num])}
          className={`w-10 h-10 rounded-lg text-[10px] font-black border transition-all ${
            isBusy ? 'bg-red-600 text-white/30 border-red-900' : 
            isSelected ? 'bg-emerald-500 text-white border-emerald-400' : 
            'bg-white/5 text-white/80 border-white/10 hover:border-white/40'
          }`}
        >
          {num}
        </button>
      );
    });
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-3 text-white min-h-[90vh]">
      {/* Navigation & Refresh */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-10 px-4 no-print">
          <div className="flex bg-white/5 rounded-full p-1.5 border border-white/10 shadow-xl overflow-hidden backdrop-blur-md">
            {(role === 'staff1' || role === 'staff' || role === 'admin') && (
              <button onClick={() => setMode('entry')} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'entry' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40'}`}>GATE</button>
            )}
            {(role === 'staff2' || role === 'staff' || role === 'admin') && (
              <>
                <button onClick={() => { setMode('issue'); setReceipt(null); }} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'issue' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-white/40'}`}>LOCKER ISSUE</button>
                <button onClick={() => { setMode('return'); setReturnReceipt(null); }} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'return' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-white/40'}`}>LOCKER RETURN</button>
              </>
            )}
          </div>
          <button onClick={refreshActive} className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all shadow-xl">
             <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin text-emerald-400' : ''}`}></i>
          </button>
      </div>

      {/* --- STAFF 1: GATE ENTRY (NO TOUCH) --- */}
      {mode === 'entry' && (
        <div className="w-full max-w-2xl space-y-6">
           <div className="bg-slate-900/60 rounded-[3rem] p-10 md:p-14 text-center space-y-10 border border-white/10 shadow-2xl backdrop-blur-3xl animate-slide-up">
              <h3 className="text-4xl font-black uppercase tracking-tight text-white mb-4">GATE ENTRY</h3>
              
              <div className="space-y-4">
                <input 
                  placeholder="SAR/XXXXXX-XXX" 
                  className="w-full bg-slate-800/80 border border-white/10 rounded-2xl px-8 py-6 font-black uppercase text-xl text-center outline-none focus:border-blue-500 transition-all" 
                  value={manualId} 
                  onChange={e => setManualId(e.target.value)} 
                />
                <button 
                  onClick={() => fetchTicketDetails(manualId)} 
                  className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                  SEARCH TICKET
                </button>
              </div>

              {!isScanning && !scannedTicket && (
                <button 
                  onClick={startScanner} 
                  className="w-full h-44 bg-white/5 border-2 border-dashed border-white/20 rounded-[2.5rem] font-black uppercase flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all group"
                >
                  <i className="fas fa-camera text-4xl text-white group-hover:scale-110 transition-all"></i>
                  <span className="text-[11px] tracking-widest">OPEN QR SCANNER</span>
                </button>
              )}

              {isScanning && (
                <div className="space-y-6">
                  <div id="reader" className="w-full rounded-[2.5rem] overflow-hidden bg-black min-h-[300px] border-4 border-blue-500/20"></div>
                  <button onClick={stopScanner} className="text-red-400 font-black uppercase text-[11px] tracking-widest p-2 hover:text-red-300">CANCEL SCANNING</button>
                </div>
              )}

              {scannedTicket && (
                <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 text-left space-y-6 border border-slate-100 shadow-2xl animate-slide-up relative overflow-hidden">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Pass ID</p>
                        <h4 className="font-black text-2xl break-all tracking-tighter">{scannedTicket.id}</h4>
                      </div>
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">CONFIRMED</div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Guest Name</p>
                        <p className="font-black uppercase text-sm">{scannedTicket.name}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Guest Pax</p>
                        <p className="font-black uppercase text-sm">{scannedTicket.adults + scannedTicket.kids} Total</p>
                      </div>
                   </div>

                   <button 
                    onClick={confirmEntry} 
                    disabled={isSyncing} 
                    className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
                   >
                        {isSyncing ? 'Processing...' : 'ALLOW ENTRY'}
                   </button>
                   <button onClick={() => setScannedTicket(null)} className="w-full text-center text-[9px] font-black uppercase text-slate-400 hover:text-slate-600">Dismiss Details</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* --- STAFF 2: ISSUE --- */}
      {mode === 'issue' && (
        <div className="bg-slate-900/60 border border-white/10 rounded-[3rem] p-8 md:p-14 w-full max-w-6xl space-y-12 shadow-2xl backdrop-blur-3xl animate-slide-up no-print">
          <div className="text-center md:text-left"><p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">Asset Terminal</p><p className="text-white/40 text-[8px] font-black uppercase tracking-widest">User: Staff2</p></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/50 p-8 rounded-3xl border border-blue-500/20 text-center"><p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">M-Lockers</p><p className="text-4xl font-black">{60 - inventory.maleBusy.length}</p></div>
              <div className="bg-slate-900/50 p-8 rounded-3xl border border-pink-500/20 text-center"><p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">F-Lockers</p><p className="text-4xl font-black">{60 - inventory.femaleBusy.length}</p></div>
              <div className="bg-slate-900/50 p-8 rounded-3xl border border-emerald-500/20 text-center"><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">M-Costumes</p><p className="text-4xl font-black">{inventory.maleRem}</p></div>
              <div className="bg-slate-900/50 p-8 rounded-3xl border border-emerald-500/20 text-center"><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">F-Costumes</p><p className="text-4xl font-black">{inventory.femaleRem}</p></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Guest Name" value={guestName} onChange={e=>setGuestName(e.target.value)} />
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Mobile" value={guestMobile} maxLength={10} onChange={e=>setGuestMobile(e.target.value.replace(/\D/g,''))} />
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10">
                <button onClick={()=>setShift('morning')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${shift === 'morning' ? 'bg-white text-slate-900' : 'text-white/40'}`}>Morning</button>
                <button onClick={()=>setShift('evening')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${shift === 'evening' ? 'bg-white text-slate-900' : 'text-white/40'}`}>Evening</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Male Lockers</p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">{renderGrid('male')}</div>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-white/40">M-Costumes</span>
                    <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-white/10">
                        <button onClick={()=>setMaleCostumes(Math.max(0, maleCostumes-1))} className="w-10 h-10 rounded-lg bg-white/5">-</button>
                        <span className="text-xl font-black">{maleCostumes}</span>
                        <button onClick={()=>setMaleCostumes(maleCostumes+1)} className="w-10 h-10 rounded-lg bg-white/5">+</button>
                    </div>
                </div>
            </div>
            <div className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest">Female Lockers</p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">{renderGrid('female')}</div>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-white/40">F-Costumes</span>
                    <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-white/10">
                        <button onClick={()=>setFemaleCostumes(Math.max(0, femaleCostumes-1))} className="w-10 h-10 rounded-lg bg-white/5">-</button>
                        <span className="text-xl font-black">{femaleCostumes}</span>
                        <button onClick={()=>setFemaleCostumes(femaleCostumes+1)} className="w-10 h-10 rounded-lg bg-white/5">+</button>
                    </div>
                </div>
            </div>
          </div>

          <button onClick={handleGenerateBill} className="w-full h-20 bg-emerald-500 text-slate-900 rounded-3xl font-black uppercase text-lg tracking-widest shadow-2xl hover:bg-emerald-400 transition-all">GENERATE BILL</button>
          
          {receipt && (() => {
            const breakdown = calculateBreakdown();
            return (
                <div className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
                    <div className="bg-white text-slate-900 rounded-[3rem] w-full max-w-xl p-10 space-y-8 shadow-2xl border-t-[12px] border-emerald-500 overflow-hidden">
                        <div className="text-center space-y-1">
                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">ID: {receipt.receiptNo}</p>
                            <h2 className="text-4xl font-black uppercase tracking-tighter">Asset Confirmation</h2>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100 text-xs font-bold text-slate-700">
                            <div className="flex justify-between border-b pb-2"><span className="text-slate-400">ASSETS DETAILS</span><span>TOTAL FEES</span></div>
                            <div className="flex justify-between"><span>Locker Rent ({maleLockers.length + femaleLockers.length} Units)</span><span>₹{breakdown.lockerRent}</span></div>
                            <div className="flex justify-between"><span>Male Costume Rent ({maleCostumes})</span><span>₹{breakdown.mCostumeRent}</span></div>
                            <div className="flex justify-between"><span>Female Costume Rent ({femaleCostumes})</span><span>₹{breakdown.fCostumeRent}</span></div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="text-center"><p className="text-[9px] text-slate-400">TOTAL RENT</p><p className="text-2xl font-black">₹{breakdown.totalRent}</p></div>
                                <div className="text-center border-l"><p className="text-[9px] text-emerald-600">REFUNDABLE</p><p className="text-2xl font-black text-emerald-700">₹{breakdown.totalDeposit}</p></div>
                            </div>
                        </div>
                        <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] flex justify-between items-center shadow-2xl">
                            <div><p className="text-[10px] font-black uppercase opacity-60">Collect Cash</p><h3 className="text-6xl font-black tracking-tighter">₹{breakdown.total}</h3></div>
                            <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center text-3xl"><i className="fas fa-wallet"></i></div>
                        </div>
                        <div className="flex gap-4"><button onClick={()=>setReceipt(null)} className="flex-1 py-5 rounded-2xl bg-slate-100 font-black text-[10px] uppercase text-slate-400">Edit Items</button><button onClick={confirmAndSave} className="flex-[2] bg-emerald-500 text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">Confirm & Print</button></div>
                    </div>
                </div>
            );
          })()}
        </div>
      )}

      {/* --- STAFF 2: RETURN --- */}
      {mode === 'return' && (
        <div className="w-full max-w-md space-y-6 no-print">
           <div className="bg-slate-900/60 rounded-[3rem] p-12 text-center space-y-8 border border-white/10 shadow-2xl backdrop-blur-xl">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-3xl text-amber-400 mx-auto border border-amber-500/20"><i className="fas fa-undo"></i></div>
              <h3 className="text-3xl font-black uppercase tracking-tight">Return Assets</h3>
              <input placeholder="SWP/DDMMYYX-NNN" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-black uppercase text-2xl text-center outline-none focus:border-amber-500" value={searchCode} onChange={e=>setSearchCode(e.target.value.toUpperCase())} />
              <button onClick={async ()=>{
                const rentals = await cloudSync.fetchRentals();
                const found = rentals?.find(r=>(r.receiptNo === searchCode || r.receiptNo.endsWith(searchCode)) && r.status === 'issued');
                if(found) setReturnReceipt(found); else alert("NOT FOUND");
              }} className="w-full bg-amber-500 text-slate-900 h-16 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl">Find Receipt</button>
              
              {returnReceipt && (
                <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 space-y-8 text-left border-b-[10px] border-emerald-500 animate-slide-up shadow-2xl">
                   <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Guest Name</p><h4 className="font-black text-2xl uppercase tracking-tighter">{returnReceipt.guestName}</h4></div>
                   <div className="bg-slate-900 text-white rounded-[1.5rem] p-6 space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 border-b border-white/10 pb-3">Checklist: Items to Collect</p>
                      <div className="space-y-4">
                         {(returnReceipt.maleLockers.length > 0 || returnReceipt.femaleLockers.length > 0) && (
                            <div className="space-y-3">
                               <p className="text-[9px] font-black uppercase opacity-60">Locker Keys to Return:</p>
                               <div className="flex flex-wrap gap-2">
                                  {returnReceipt.maleLockers.map(n=><span key={`m-${n}`} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-black border border-blue-400">M-{n}</span>)}
                                  {returnReceipt.femaleLockers.map(n=><span key={`f-${n}`} className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-black border border-pink-400">F-{n}</span>)}
                               </div>
                            </div>
                         )}
                         <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-[8px] font-black opacity-60">M-Costumes</p><p className="text-xl font-black text-blue-400">{returnReceipt.maleCostumes}</p></div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-[8px] font-black opacity-60">F-Costumes</p><p className="text-xl font-black text-pink-400">{returnReceipt.femaleCostumes}</p></div>
                         </div>
                      </div>
                   </div>
                   <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase">Refundable Security</p>
                      <p className="text-3xl text-emerald-700 font-black">₹{returnReceipt.refundableAmount}</p>
                   </div>
                   <button onClick={async()=>{
                     setIsSyncing(true);
                     const success = await cloudSync.updateRental({...returnReceipt, status:'returned', returnedAt: new Date().toISOString()});
                     if(success){ alert("Return Complete."); setReturnReceipt(null); setSearchCode(''); refreshActive(); }
                     setIsSyncing(false);
                   }} className="w-full bg-slate-900 text-white h-20 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl"><i className="fas fa-check-double mr-2"></i> Complete Refund</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Hidden Receipt for Printing (Staff 2) */}
      {receipt && (
        <div className="hidden print:block fixed inset-0 bg-white text-black font-mono p-10 z-[6000]">
           <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h2 className="text-2xl font-bold uppercase">Spray Aqua Resort</h2>
              <p className="text-xs uppercase font-bold">Locker & Asset Receipt</p>
           </div>
           <div className="grid grid-cols-2 gap-y-2 text-xs font-bold border-b pb-4 mb-4">
              <p>Receipt No:</p><p className="text-right">{receipt.receiptNo}</p>
              <p>Guest Name:</p><p className="text-right uppercase">{receipt.guestName}</p>
              <p>Mobile:</p><p className="text-right">{receipt.guestMobile}</p>
              <p>Date:</p><p className="text-right">{receipt.date}</p>
           </div>
           <div className="space-y-4 text-sm font-bold border-b pb-4 mb-4">
              <div className="flex justify-between"><span>Locker Keys Issued:</span><span>M:{receipt.maleLockers.join(',')} F:{receipt.femaleLockers.join(',')}</span></div>
              <div className="flex justify-between"><span>Male Costumes:</span><span>{receipt.maleCostumes}</span></div>
              <div className="flex justify-between"><span>Female Costumes:</span><span>{receipt.femaleCostumes}</span></div>
           </div>
           <div className="space-y-3 text-sm font-bold border-b pb-4 mb-4">
              <div className="flex justify-between"><span>Total Rent Paid:</span><span>₹{receipt.rentAmount}</span></div>
              <div className="flex justify-between text-lg border-t pt-2"><span>Security Deposit:</span><span>₹{receipt.securityDeposit}</span></div>
              <div className="flex justify-between text-xl border-t-2 border-black pt-2"><span>Total Collected:</span><span>₹{receipt.totalCollected}</span></div>
           </div>
           <p className="text-[10px] text-center font-bold">* Keep this receipt safe to collect your security refund. *</p>
        </div>
      )}

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
export default StaffPortal;
