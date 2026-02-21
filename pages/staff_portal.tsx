
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';
import { COSTUME_RULES, LOCKER_RULES } from '../constants';

interface ScannedResult {
  booking: Booking;
  validation: string;
}

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(
    role === 'staff1' ? 'entry' : 'issue'
  );
  
  const [scannedResult, setScannedResult] = useState<ScannedResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [manualId, setManualId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // --- STAFF 2 / LOCKER STATES ---
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
    const activeRecords = (Array.isArray(allRentals) ? allRentals : []).filter(r => r.status === 'issued');
    const mBusy = activeRecords.flatMap(r => r.maleLockers || []);
    const fBusy = activeRecords.flatMap(r => r.femaleLockers || []);
    const mIssuedCostumes = activeRecords.reduce((s, r) => s + (Number(r.maleCostumes) || 0), 0);
    const fIssuedCostumes = activeRecords.reduce((s, r) => s + (Number(r.femaleCostumes) || 0), 0);
    return {
      maleBusy: mBusy, femaleBusy: fBusy,
      maleLockersRem: LOCKER_RULES.MALE_LOCKERS_TOTAL - mBusy.length,
      femaleLockersRem: LOCKER_RULES.FEMALE_LOCKERS_TOTAL - fBusy.length,
      maleCostumesRem: COSTUME_RULES.MALE_COSTUME_TOTAL - mIssuedCostumes,
      femaleCostumesRem: COSTUME_RULES.FEMALE_COSTUME_TOTAL - fIssuedCostumes
    };
  }, [allRentals]);

  const refreshActive = async () => {
    setIsSyncing(true);
    try {
      const rentals = await cloudSync.fetchRentals();
      if (Array.isArray(rentals)) setAllRentals(rentals);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const getISTHour = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})).getHours();
  };

  useEffect(() => {
    const istHour = getISTHour();
    const suggestedShift = istHour < 15 ? 'morning' : 'evening';
    setShift(suggestedShift);
    refreshActive();
  }, [mode]);

  const startScanner = () => {
    setScannedResult(null);
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
      if (data.success) {
        setScannedResult({ booking: data.booking, validation: data.validation });
      } else alert("TICKET NOT FOUND");
    } catch (e) { alert("Sync Error"); } finally { setIsSyncing(false); }
  };

  const confirmEntry = async () => {
    if (!scannedResult || scannedResult.validation !== 'VALID') return;
    setIsSyncing(true);
    try {
        const res = await fetch('/api/booking?type=checkin', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ticketId: scannedResult.booking.id }) 
        });
        const data = await res.json();
        if (data.success) {
            await notificationService.sendWelcomeMessage(scannedResult.booking);
            alert("ENTRY CONFIRMED & WELCOME SENT!");
            setScannedResult(null);
            setManualId('');
        }
    } catch (e) { alert("Error updating entry."); } finally { setIsSyncing(false); }
  };

  const calculateBreakdown = () => {
    const mLockers = maleLockers.length, fLockers = femaleLockers.length;
    const mCostumesNum = Math.max(0, Number(maleCostumes) || 0);
    const fCostumesNum = Math.max(0, Number(femaleCostumes) || 0);
    const lockerRent = (mLockers * LOCKER_RULES.MALE_LOCKER_RENT) + (fLockers * LOCKER_RULES.FEMALE_LOCKER_RENT);
    const costumeRent = (mCostumesNum * COSTUME_RULES.MALE_COSTUME_RENT) + (fCostumesNum * COSTUME_RULES.FEMALE_COSTUME_RENT);
    const lockerDep = (mLockers * LOCKER_RULES.MALE_LOCKER_DEPOSIT) + (fLockers * LOCKER_RULES.FEMALE_LOCKER_DEPOSIT);
    const costumeDep = (mCostumesNum * COSTUME_RULES.MALE_COSTUME_DEPOSIT) + (fCostumesNum * COSTUME_RULES.FEMALE_COSTUME_DEPOSIT);
    const totalRent = lockerRent + costumeRent;
    const totalDeposit = lockerDep + costumeDep;
    return { lockerRent, costumeRent, totalRent, totalDeposit, total: totalRent + totalDeposit };
  };

  const handleGenerateBill = () => {
    if (!guestName) return alert("Please enter Guest Name.");
    if (maleCostumes < 0 || femaleCostumes < 0) return alert("Costume quantity cannot be negative.");
    
    const { totalRent, totalDeposit, total } = calculateBreakdown();
    const newReceipt: LockerReceipt = {
      receiptNo: `SWP/${new Date().getTime().toString().slice(-6)}`, 
      guestName, guestMobile, date: new Date().toLocaleDateString('en-CA'),
      shift, maleLockers, femaleLockers, maleCostumes: Math.max(0, maleCostumes), femaleCostumes: Math.max(0, femaleCostumes),
      rentAmount: totalRent, securityDeposit: totalDeposit, totalCollected: total, refundableAmount: totalDeposit,
      status: 'issued', createdAt: new Date().toISOString()
    };
    setReceipt(newReceipt);
  };

  const confirmAndSave = async () => {
    if (!receipt) return;
    setIsSyncing(true);
    if (await cloudSync.saveRental(receipt)) {
      setTimeout(() => {
        window.print();
        setGuestName(''); setGuestMobile(''); setMaleLockers([]); setFemaleLockers([]); setMaleCostumes(0); setFemaleCostumes(0); setReceipt(null);
        refreshActive();
      }, 500);
    } else alert("Sync failed.");
    setIsSyncing(false);
  };

  const renderGrid = (gender: 'male' | 'female') => {
    const list = gender === 'male' ? maleLockers : femaleLockers;
    const setList = gender === 'male' ? setMaleLockers : setFemaleLockers;
    const busyList = gender === 'male' ? inventory.maleBusy : inventory.femaleBusy;
    return Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
      const isBusy = busyList.includes(num); const isSelected = list.includes(num);
      return (
        <button key={num} disabled={isBusy} onClick={() => setList(isSelected ? list.filter(n => n !== num) : [...list, num])}
          className={`w-10 h-10 rounded-lg text-[10px] font-black border transition-all ${isBusy ? 'bg-red-600 text-white/30 border-red-900' : isSelected ? 'bg-emerald-500 text-white shadow-lg scale-110 z-10' : 'bg-white/5 text-white/80 border-white/10'}`}>
          {num}
        </button>
      );
    });
  };

  // Helper function to render validation status badge
  const renderValidationBadge = (status: string) => {
    switch (status) {
      case 'VALID': return <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Valid Ticket</span>;
      case 'ALREADY_USED': return <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Already Used</span>;
      case 'EXPIRED': return <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Expired Date</span>;
      case 'FUTURE_DATE': return <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Future Date</span>;
      case 'EXPIRED_SLOT': return <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Slot Expired</span>;
      case 'FUTURE_SLOT': return <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Future Slot</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Invalid</span>;
    }
  };

  const istHourNow = getISTHour();
  const isMorningDisabled = istHourNow >= 15;

  return (
    <div className="w-full flex flex-col items-center py-4 px-3 text-white min-h-[90vh]">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-receipt, #print-receipt * { visibility: visible !important; }
          #print-receipt { position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 10px !important; color: black !important; background: white !important; font-family: 'Courier New', monospace !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Tabs */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 px-4 no-print">
          <div className="flex bg-slate-800 rounded-full p-1 border border-white/10 shadow-2xl backdrop-blur-md">
            {(role === 'staff1' || role === 'staff' || role === 'admin') && (
              <button onClick={() => setMode('entry')} className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'entry' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>GATE</button>
            )}
            {(role === 'staff2' || role === 'staff' || role === 'admin') && (
              <>
                <button onClick={() => setMode('issue')} className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'issue' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-white/40 hover:text-white'}`}>ISSUE</button>
                <button onClick={() => setMode('return')} className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'return' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-white/40 hover:text-white'}`}>RETURN</button>
              </>
            )}
          </div>
          <button onClick={refreshActive} className="bg-white/10 w-12 h-12 rounded-full border border-white/10 active:scale-90 transition-all flex items-center justify-center">
            <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i>
          </button>
      </div>

      {mode === 'issue' && (
        <div className="w-full max-w-6xl space-y-6 animate-slide-up no-print">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
             <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">M-Lockers Avail</p>
                <p className="text-xl font-black text-white">{inventory.maleLockersRem}</p>
             </div>
             <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">F-Lockers Avail</p>
                <p className="text-xl font-black text-white">{inventory.femaleLockersRem}</p>
             </div>
             <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">M-Costumes Avail</p>
                <p className="text-xl font-black text-white">{inventory.maleCostumesRem}</p>
             </div>
             <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">F-Costumes Avail</p>
                <p className="text-xl font-black text-white">{inventory.femaleCostumesRem}</p>
             </div>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-[3rem] p-6 md:p-10 space-y-8 backdrop-blur-3xl shadow-2xl">
            <div className="grid md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 px-4">Guest Name</label>
                  <input className="input-premium !bg-slate-800 !text-white !py-4" placeholder="Full Name" value={guestName} onChange={e=>setGuestName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 px-4">Mobile</label>
                  <input className="input-premium !bg-slate-800 !text-white !py-4" placeholder="10 Digits" value={guestMobile} maxLength={10} onChange={e=>setGuestMobile(e.target.value.replace(/\D/g,''))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/30 px-4">Shift</label>
                  <div className="flex bg-slate-800 p-1 rounded-2xl border border-white/10">
                    <button disabled={isMorningDisabled} onClick={()=>setShift('morning')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${shift === 'morning' ? 'bg-white text-slate-900 shadow-md' : 'text-white/40 disabled:opacity-20'}`}>Morning</button>
                    <button onClick={()=>setShift('evening')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${shift === 'evening' ? 'bg-white text-slate-900 shadow-md' : 'text-white/40'}`}>Evening</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-blue-400 px-2">M-Costume</label>
                      <input type="number" min="0" className="input-premium !bg-slate-800 !text-white !py-4 text-center" value={maleCostumes} onChange={e=>setMaleCostumes(Math.max(0, parseInt(e.target.value)||0))} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-pink-400 px-2">F-Costume</label>
                      <input type="number" min="0" className="input-premium !bg-slate-800 !text-white !py-4 text-center" value={femaleCostumes} onChange={e=>setFemaleCostumes(Math.max(0, parseInt(e.target.value)||0))} />
                   </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-900/30 p-6 rounded-[2rem] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Male Lockers</p>
                       <span className="text-[9px] font-black text-white/30 uppercase">{maleLockers.length} Selected</span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">{renderGrid('male')}</div>
                </div>
                <div className="bg-slate-900/30 p-6 rounded-[2rem] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest">Female Lockers</p>
                       <span className="text-[9px] font-black text-white/30 uppercase">{femaleLockers.length} Selected</span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">{renderGrid('female')}</div>
                </div>
            </div>

            <button onClick={handleGenerateBill} className="w-full h-20 bg-emerald-500 text-slate-900 rounded-[2rem] font-black uppercase text-lg shadow-2xl hover:scale-[1.01] transition-all">
               GENERATE BILL
            </button>
          </div>
          {receipt && (
            <div className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 no-print">
              <div className="bg-white text-slate-900 rounded-[3rem] w-full max-w-xl p-10 space-y-8 shadow-2xl animate-scale-in">
                <div className="text-center">
                  <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest">Receipt ID: {receipt.receiptNo}</p>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mt-1">Confirmation</h2>
                </div>
                <div className="bg-slate-50 p-8 rounded-2xl space-y-3 text-[13px] font-bold border border-slate-100 shadow-inner">
                   <div className="flex justify-between"><span>Guest:</span><span className="uppercase">{receipt.guestName}</span></div>
                   <div className="flex justify-between"><span>Mobile:</span><span>{receipt.guestMobile}</span></div>
                   <hr className="opacity-40" />
                   <div className="flex justify-between"><span>Locker Charge:</span><span>₹{receipt.rentAmount - ((receipt.maleCostumes * COSTUME_RULES.MALE_COSTUME_RENT) + (receipt.femaleCostumes * COSTUME_RULES.FEMALE_COSTUME_RENT))}</span></div>
                   <div className="flex justify-between"><span>Costume Charge:</span><span>₹{(receipt.maleCostumes * COSTUME_RULES.MALE_COSTUME_RENT) + (receipt.femaleCostumes * COSTUME_RULES.FEMALE_COSTUME_RENT)}</span></div>
                   <div className="flex justify-between"><span>Security Deposit:</span><span className="text-blue-600">₹{receipt.securityDeposit}</span></div>
                   <div className="flex justify-between pt-4 border-t-2 border-slate-200 font-black text-xl">
                     <span>Total Bill:</span>
                     <span className="text-slate-900">₹{receipt.totalCollected}</span>
                   </div>
                   <div className="mt-4 bg-emerald-100 p-4 rounded-xl border border-emerald-500/20 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-600">Refund Amount</span>
                      <span className="text-2xl font-black text-emerald-700">₹{receipt.refundableAmount}</span>
                   </div>
                </div>
                <button onClick={confirmAndSave} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Confirm & Print</button>
                <button onClick={()=>setReceipt(null)} className="w-full text-slate-400 uppercase text-[10px] font-black tracking-widest">Go Back</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entry and Return sections stay same */}
      {mode === 'entry' && (
        <div className="w-full max-w-2xl no-print animate-slide-up">
           <div className="bg-slate-900/60 rounded-[3rem] p-10 md:p-14 text-center border border-white/10 shadow-2xl backdrop-blur-3xl">
              <h3 className="text-4xl font-black uppercase mb-10 tracking-tighter">GATE ENTRY</h3>
              <div className="space-y-4 mb-10">
                <input placeholder="SAR/XXXXXX-XXX" className="w-full bg-slate-800 border border-white/10 rounded-2xl px-8 py-6 font-black uppercase text-xl text-center outline-none focus:border-blue-500 transition-all text-white" value={manualId} onChange={e => setManualId(e.target.value)} />
                <button onClick={() => fetchTicketDetails(manualId)} className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg">SEARCH</button>
              </div>
              {!isScanning && !scannedResult && (
                <button onClick={startScanner} className="w-full h-44 bg-white/5 border-2 border-dashed border-white/20 rounded-[2.5rem] font-black uppercase flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all text-white/50 hover:text-white">
                  <i className="fas fa-camera text-4xl"></i><span className="text-[11px] tracking-widest">SCAN QR CODE</span>
                </button>
              )}
              {isScanning && (
                <div className="space-y-6"><div id="reader" className="w-full rounded-[2.5rem] overflow-hidden bg-black min-h-[300px] border-4 border-blue-500/20"></div><button onClick={stopScanner} className="text-red-400 font-black uppercase text-[11px]">CANCEL SCAN</button></div>
              )}
              {scannedResult && (
                <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 text-left space-y-6 border border-slate-100 shadow-2xl animate-slide-up">
                   <div className="flex justify-between items-start">
                      <div><p className="text-[9px] font-black uppercase text-slate-400 mb-1">Pass ID</p><h4 className="font-black text-2xl break-all">{scannedResult.booking.id}</h4></div>
                      {renderValidationBadge(scannedResult.validation)}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[8px] font-black uppercase text-slate-400 mb-1">Guest Name</p><p className="font-black uppercase text-sm">{scannedResult.booking.name}</p></div>
                      <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[8px] font-black uppercase text-slate-400 mb-1">Schedule</p><p className="font-black uppercase text-xs">{scannedResult.booking.date} | {scannedResult.booking.time}</p></div>
                   </div>
                   <button onClick={confirmEntry} disabled={isSyncing || scannedResult.validation !== 'VALID'} 
                    className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all ${scannedResult.validation === 'VALID' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                        {isSyncing ? 'Processing...' : 'CONFIRM CHECK-IN'}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {mode === 'return' && (
        <div className="w-full max-w-md no-print animate-slide-up">
           <div className="bg-slate-900/60 rounded-[3rem] p-12 text-center border border-white/10 shadow-2xl">
              <h3 className="text-3xl font-black uppercase mb-8 tracking-tighter text-amber-500">Return Assets</h3>
              <input placeholder="Receipt ID" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-black uppercase text-2xl text-center mb-6 text-white" value={searchCode} onChange={e=>setSearchCode(e.target.value.toUpperCase())} />
              <button onClick={async ()=>{ const rentals = await cloudSync.fetchRentals(); const found = rentals?.find(r=>(r.receiptNo === searchCode || r.receiptNo.endsWith(searchCode)) && r.status === 'issued'); if(found) setReturnReceipt(found); else alert("NOT FOUND OR ALREADY RETURNED"); }} className="w-full bg-amber-500 text-slate-900 h-16 rounded-2xl font-black uppercase shadow-xl">FIND RECEIPT</button>
              {returnReceipt && (
                <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 mt-10 space-y-8 text-left border-b-[10px] border-emerald-500 animate-slide-up shadow-2xl">
                   <h4 className="font-black text-2xl uppercase tracking-tighter">{returnReceipt.guestName}</h4>
                   <div className="space-y-2">
                     <p className="font-bold text-xs uppercase text-slate-400">Lockers Used:</p>
                     <p className="font-black text-sm">
                       {returnReceipt.maleLockers.map(n=>`m${n}`).join(', ')} 
                       {returnReceipt.femaleLockers.length > 0 ? ', ' : ''}
                       {returnReceipt.femaleLockers.map(n=>`f${n}`).join(', ')}
                     </p>
                   </div>
                   <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-600">Refundable Amount</span>
                      <span className="text-2xl font-black text-emerald-700">₹{returnReceipt.refundableAmount}</span>
                   </div>
                   <button onClick={async()=>{ setIsSyncing(true); if(await cloudSync.updateRental({...returnReceipt, status:'returned'})){ alert("Refund Completed."); setReturnReceipt(null); refreshActive(); } setIsSyncing(false); }} className="w-full bg-slate-900 text-white h-20 rounded-2xl font-black uppercase shadow-lg">COMPLETE REFUND</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Hidden Thermal Print Receipt Layout */}
      {receipt && (
        <div id="print-receipt" className="hidden print:block text-black bg-white">
           <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>SPRAY AQUA RESORT</h2>
              <p style={{ fontSize: '10px', margin: '2px 0' }}>Locker & Asset Receipt</p>
           </div>
           
           <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Receipt #:</span><span>{receipt.receiptNo}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mobile:</span><span>{receipt.guestMobile}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date/Shift:</span><span>{receipt.date} | {receipt.shift}</span></div>
              <hr style={{ border: 'none', borderTop: '1px dashed black', margin: '8px 0' }} />
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Lockers:</div>
              <div style={{ fontSize: '11px', marginBottom: '8px', wordBreak: 'break-all' }}>
                {receipt.maleLockers.map(n=>`m${n}`).join(', ')}
                {receipt.femaleLockers.length > 0 && receipt.maleLockers.length > 0 ? ', ' : ''}
                {receipt.femaleLockers.map(n=>`f${n}`).join(', ')}
                {receipt.maleLockers.length === 0 && receipt.femaleLockers.length === 0 && 'NONE'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Male Costumes:</span><span>{receipt.maleCostumes}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Female Costumes:</span><span>{receipt.femaleCostumes}</span></div>
              
              <hr style={{ border: 'none', borderTop: '1px dashed black', margin: '8px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                <span>TOTAL PAID:</span><span>₹{receipt.totalCollected}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', color: '#555' }}>
                <span>(Includes Deposit):</span><span>₹{receipt.securityDeposit}</span>
              </div>

              <div style={{ marginTop: '15px', backgroundColor: '#eee', padding: '8px', textAlign: 'center', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>REFUNDABLE AMOUNT</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>₹{receipt.refundableAmount}</div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                *** PLEASE KEEP THIS RECEIPT SAFE ***<br/>
                SHOW THIS TO COLLECT YOUR CASH REFUND
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default StaffPortal;
