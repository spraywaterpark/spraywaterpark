
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { COSTUME_RULES, LOCKER_RULES } from '../constants';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(
    role === 'staff1' ? 'entry' : 'issue'
  );
  
  const [ticketInput, setTicketInput] = useState('');
  const [scannedTicket, setScannedTicket] = useState<Booking | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
  const [isSyncing, setIsSyncing] = useState(false);

  const [activeLockers, setActiveLockers] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });
  const [allRentals, setAllRentals] = useState<LockerReceipt[]>([]);
  const [costumeStock, setCostumeStock] = useState({ 
    male: COSTUME_RULES.MALE_COSTUME_TOTAL, 
    female: COSTUME_RULES.FEMALE_COSTUME_TOTAL 
  });

  const refreshActive = async () => {
    if (isSyncing) return;
    const rentals = await cloudSync.fetchRentals();
    if (rentals) {
      setAllRentals(rentals);
      const activeRecords = rentals.filter(r => r.status === 'issued');
      const cloudMaleBusy = activeRecords.flatMap(r => Array.isArray(r.maleLockers) ? r.maleLockers : []);
      const cloudFemaleBusy = activeRecords.flatMap(r => Array.isArray(r.femaleLockers) ? r.femaleLockers : []);
      setActiveLockers({ male: cloudMaleBusy, female: cloudFemaleBusy });
      let mIssued = activeRecords.reduce((sum, r) => sum + (Number(r.maleCostumes) || 0), 0);
      let fIssued = activeRecords.reduce((sum, r) => sum + (Number(r.femaleCostumes) || 0), 0);
      setCostumeStock({ male: Math.max(0, COSTUME_RULES.MALE_COSTUME_TOTAL - mIssued), female: Math.max(0, COSTUME_RULES.FEMALE_COSTUME_TOTAL - fIssued) });
    }
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 15000); 
    return () => clearInterval(interval);
  }, [mode]);

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      const html5QrCode = new (window as any).Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          stopScanner();
          setTicketInput(decodedText);
          fetchTicketDetails(decodedText);
        },
        () => {}
      );
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
  };

  const fetchTicketDetails = async (id?: string) => {
    const ticketId = (id || ticketInput).toUpperCase();
    if (!ticketId) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/booking?type=ticket_details&id=${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setScannedTicket(data.booking);
      } else {
        alert("Ticket not found.");
      }
    } catch (e) {
      alert("Error finding ticket.");
    } finally {
      setIsSyncing(false);
    }
  };

  const getEntryValidation = (ticket: Booking) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();

    if (ticket.date !== today) {
      return { isValid: false, reason: `Ticket is for ${ticket.date}. Today is ${today}.` };
    }

    const isMorning = ticket.time.toLowerCase().includes('morning');
    if (isMorning) {
      if (currentHour < 10 || currentHour >= 13) {
        return { isValid: false, reason: "Morning Entry window (10 AM - 1 PM) is closed." };
      }
    } else {
      if (currentHour < 16 || currentHour >= 19) {
        return { isValid: false, reason: "Evening Entry window (4 PM - 7 PM) is closed." };
      }
    }

    return { isValid: true, reason: "" };
  };

  const handleConfirmEntry = async () => {
    if (!scannedTicket) return;
    const validation = getEntryValidation(scannedTicket);
    if (!validation.isValid) return alert(validation.reason);

    setIsSyncing(true);
    try {
      const response = await fetch('/api/booking?type=checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: scannedTicket.id })
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Entry Confirmed! Welcome Message sent to ${scannedTicket.name}.`);
        setScannedTicket(null);
        setTicketInput('');
      } else {
        alert(`❌ Error: ${data.details}`);
      }
    } catch (e) {
      alert("Sync Error. Please check your internet.");
    } finally {
      setIsSyncing(false);
    }
  };

  const generateReceiptNo = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const datePart = `${dd}${mm}${yy}`;
    const shiftCode = shift === 'morning' ? '1' : '2';
    const todayStr = now.toISOString().split('T')[0];
    
    // Receipt numbering resets daily per shift
    const countToday = allRentals.filter(r => r.date === todayStr && r.shift === shift).length + 1;
    const seq = String(countToday).padStart(3, '0');
    return `SWP/${datePart}${shiftCode}-${seq}`;
  };

  const toggleLocker = (num: number, gender: 'male' | 'female') => {
    const list = gender === 'male' ? maleLockers : femaleLockers;
    const setList = gender === 'male' ? setMaleLockers : setFemaleLockers;
    setList(list.includes(num) ? list.filter(n => n !== num) : [...list, num]);
  };

  const calculateBreakdown = () => {
    const mLockers = maleLockers.length;
    const fLockers = femaleLockers.length;
    const mCostumes = Number(maleCostumes) || 0;
    const fCostumes = Number(femaleCostumes) || 0;

    const lockerRent = (mLockers * LOCKER_RULES.MALE_LOCKER_RENT) + (fLockers * LOCKER_RULES.FEMALE_LOCKER_RENT);
    const mCostumeRent = mCostumes * COSTUME_RULES.MALE_COSTUME_RENT;
    const fCostumeRent = fCostumes * COSTUME_RULES.FEMALE_COSTUME_RENT;

    const lockerDep = (mLockers * LOCKER_RULES.MALE_LOCKER_DEPOSIT) + (fLockers * LOCKER_RULES.FEMALE_LOCKER_DEPOSIT);
    const mCostumeDep = mCostumes * COSTUME_RULES.MALE_COSTUME_DEPOSIT;
    const fCostumeDep = fCostumes * COSTUME_RULES.FEMALE_COSTUME_DEPOSIT;

    const totalRent = lockerRent + mCostumeRent + fCostumeRent;
    const totalDeposit = lockerDep + mCostumeDep + fCostumeDep;

    return { 
      lockerRent, 
      mCostumeRent, 
      fCostumeRent, 
      lockerDep, 
      mCostumeDep, 
      fCostumeDep, 
      totalRent, 
      totalDeposit, 
      total: totalRent + totalDeposit 
    };
  };

  const generateReceipt = () => {
    // Check issue window rules
    const now = new Date();
    const hour = now.getHours();
    if (shift === 'morning' && (hour < 10 || hour >= 14)) {
      return alert("Morning Asset issue window is 10:00 AM to 02:00 PM.");
    }
    if (shift === 'evening' && (hour < 16 || hour >= 20)) {
      return alert("Evening Asset issue window is 04:00 PM to 08:00 PM.");
    }

    if (!guestName) return alert("Please enter Guest Name.");
    if (maleLockers.length === 0 && femaleLockers.length === 0 && maleCostumes === 0 && femaleCostumes === 0) {
      return alert("Select at least one asset (Locker or Costume).");
    }
    const { totalRent, totalDeposit, total } = calculateBreakdown();
    setReceipt({
      receiptNo: generateReceiptNo(), guestName, guestMobile, date: new Date().toISOString().split('T')[0],
      shift, maleLockers, femaleLockers, maleCostumes: Number(maleCostumes), femaleCostumes: Number(femaleCostumes),
      rentAmount: totalRent, securityDeposit: totalDeposit, totalCollected: total, refundableAmount: totalDeposit,
      status: 'issued', createdAt: new Date().toISOString()
    });
  };

  const confirmAndPrint = async () => {
    if (!receipt) return;
    setIsSyncing(true);
    try {
      const success = await cloudSync.saveRental(receipt);
      if (success) {
        window.print();
        setGuestName(''); setGuestMobile(''); setMaleLockers([]); setFemaleLockers([]); setMaleCostumes(0); setFemaleCostumes(0); setReceipt(null);
        await refreshActive();
      } else {
        alert("Sync failed. The database may be offline or incorrectly configured.");
      }
    } catch (err) {
      alert("Error saving data to cloud. Please check logs.");
    } finally {
      setIsSyncing(false);
    }
  };

  const findReturn = async () => {
    if (!searchCode) return;
    setIsSyncing(true);
    const all = await cloudSync.fetchRentals();
    const found = all?.find(r => (r.receiptNo === searchCode || r.receiptNo.endsWith(searchCode)) && r.status === 'issued');
    setIsSyncing(false);
    if (!found) return alert("Active record not found.");
    setReturnReceipt(found);
  };

  const confirmReturn = async () => {
    if (!returnReceipt) return;
    setIsSyncing(true);
    const success = await cloudSync.updateRental({ ...returnReceipt, status: 'returned', returnedAt: new Date().toISOString() });
    if (success) {
      alert("Assets Returned! Security Deposit Refunded.");
      setReturnReceipt(null); setSearchCode(''); refreshActive();
    }
    setIsSyncing(false);
  };

  const renderLockers = (gender: 'male' | 'female') =>
    Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
      const selected = gender === 'male' ? maleLockers : femaleLockers;
      const isBusy = activeLockers[gender].includes(num);
      return (
        <button key={num} disabled={isBusy} onClick={() => toggleLocker(num, gender)}
          className={`w-10 h-10 rounded-lg text-xs font-black border transition-all ${isBusy ? 'bg-red-600 text-white/30 border-red-900' : selected.includes(num) ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 text-white/80 border-white/20 hover:border-white/50'}`}>
          {num}
        </button>
      );
    });

  return (
    <div className="w-full flex flex-col items-center py-6 text-white min-h-[90vh]">
      <div className="w-full max-w-5xl flex justify-between items-center mb-10 px-4 no-print">
          <div className="flex bg-white/10 rounded-full p-1.5 border border-white/10 shadow-xl overflow-hidden">
            {(role === 'staff1' || role === 'staff' || role === 'admin') && (
              <button onClick={() => setMode('entry')} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'entry' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>GATE ENTRY</button>
            )}
            {(role === 'staff2' || role === 'staff' || role === 'admin') && (
              <>
                <button onClick={() => setMode('issue')} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'issue' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-white/50 hover:text-white'}`}>LOCKER ISSUE</button>
                <button onClick={() => setMode('return')} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'return' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-white/50 hover:text-white'}`}>LOCKER RETURN</button>
              </>
            )}
          </div>
          <button onClick={refreshActive} className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all">
             <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin text-emerald-400' : ''}`}></i>
          </button>
      </div>

      {mode === 'entry' && (role === 'staff1' || role === 'staff' || role === 'admin') && (
        <div className="w-full max-w-2xl space-y-8 animate-slide-up no-print">
          <div className="bg-white/10 border border-white/20 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl backdrop-blur-3xl">
             <div className="flex justify-center gap-4 mb-6">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-4xl text-blue-400 border border-blue-500/20">
                   <i className="fas fa-qrcode"></i>
                </div>
             </div>
             <h3 className="text-3xl font-black uppercase tracking-tight">Gate Check-In</h3>
             
             {!isScanning && !scannedTicket && (
               <div className="space-y-6">
                 <button onClick={startScanner} className="w-full h-24 bg-white/5 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center gap-4 hover:bg-white/10 transition-all group">
                    <i className="fas fa-camera text-2xl text-blue-400 group-hover:scale-110 transition-all"></i>
                    <span className="text-sm font-black uppercase tracking-widest">Open Camera Scanner</span>
                 </button>
                 <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                    <span className="text-[10px] font-black text-white/30 uppercase">OR MANUAL ENTRY</span>
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                 </div>
                 <div className="flex gap-2">
                    <input placeholder="SAR/DDMMYY1-001" className="input-premium !bg-slate-900/50 !text-white !text-xl text-center flex-1" value={ticketInput} onChange={e => setTicketInput(e.target.value.toUpperCase())} />
                    <button onClick={() => fetchTicketDetails()} disabled={isSyncing || !ticketInput} className="bg-blue-600 w-16 rounded-xl flex items-center justify-center text-white"><i className="fas fa-arrow-right"></i></button>
                 </div>
               </div>
             )}

             {isScanning && (
               <div className="space-y-6">
                  <div id="reader" className="w-full rounded-3xl overflow-hidden border-4 border-blue-500/30"></div>
                  <button onClick={stopScanner} className="text-xs font-black uppercase text-red-400 hover:text-red-300">Cancel Scanning</button>
               </div>
             )}

             {scannedTicket && (() => {
                const validation = getEntryValidation(scannedTicket);
                const isUsed = scannedTicket.status === 'checked-in';
                const canCheckIn = validation.isValid && !isUsed;

                return (
                    <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 space-y-8 text-left border-t-[15px] border-blue-600 animate-slide-up overflow-hidden">
                        <div className="bg-blue-50 -m-10 p-10 mb-6 border-b border-blue-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Gate Scan Report</p>
                            <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{scannedTicket.id}</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Name</p>
                                    <p className="text-lg font-black uppercase text-slate-900">{scannedTicket.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile No</p>
                                    <p className="text-lg font-black text-blue-600 tracking-tight">{scannedTicket.mobile}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Date</p>
                                    <p className={`text-lg font-black uppercase ${scannedTicket.date !== new Date().toISOString().split('T')[0] ? 'text-red-600' : 'text-slate-900'}`}>{scannedTicket.date}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                                    <p className="text-sm font-black text-blue-600 uppercase">{scannedTicket.time.split(':')[0]}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white rounded-3xl p-8 flex justify-around items-center shadow-2xl">
                                <div className="text-center">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Adults</p>
                                    <p className="text-4xl font-black">{scannedTicket.adults}</p>
                                </div>
                                <div className="h-12 w-[1px] bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Kids</p>
                                    <p className="text-4xl font-black">{scannedTicket.kids}</p>
                                </div>
                            </div>

                            {isUsed && (
                                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border-2 border-red-200 text-center">
                                    <p className="text-xs font-black uppercase tracking-widest">Ticket Already Used</p>
                                    <p className="text-[10px] font-bold uppercase mt-1">Checked-in at: {scannedTicket.checkinTime || 'N/A'}</p>
                                </div>
                            )}

                            {!isUsed && !validation.isValid && (
                                <div className="bg-amber-50 text-amber-700 p-6 rounded-2xl border-2 border-amber-200 text-center animate-shake">
                                    <i className="fas fa-exclamation-triangle mb-2 text-xl"></i>
                                    <p className="text-xs font-black uppercase tracking-widest">Entry Restricted</p>
                                    <p className="text-[10px] font-bold uppercase mt-1">{validation.reason}</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setScannedTicket(null)} className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest">Cancel</button>
                                <button 
                                    onClick={handleConfirmEntry} 
                                    disabled={isSyncing || !canCheckIn} 
                                    className={`flex-[2] h-20 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all ${canCheckIn ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                >
                                    {isSyncing ? 'SYNCING...' : 'CONFIRM ENTRY'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
             })()}
          </div>
        </div>
      )}

      {mode === 'issue' && (role === 'staff2' || role === 'staff' || role === 'admin') && (
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-14 w-full max-w-6xl space-y-12 shadow-2xl backdrop-blur-3xl animate-slide-up no-print">
          <div className="text-center md:text-left">
            <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">Asset Terminal</p>
            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">User: {role}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-blue-500/20 text-center">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">M-Lockers</p>
                  <p className="text-3xl font-black">{60 - activeLockers.male.length}</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-pink-500/20 text-center">
                  <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest">F-Lockers</p>
                  <p className="text-3xl font-black">{60 - activeLockers.female.length}</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-emerald-500/20 text-center">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">M-Costumes</p>
                  <p className="text-3xl font-black">{costumeStock.male}</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-emerald-500/20 text-center">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">F-Costumes</p>
                  <p className="text-3xl font-black">{costumeStock.female}</p>
              </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Guest Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Mobile" value={guestMobile} maxLength={10} onChange={e => setGuestMobile(e.target.value.replace(/\D/g,''))} />
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10">
                <button onClick={() => setShift('morning')} className={`flex-1 rounded-xl text-[10px] font-black uppercase ${shift === 'morning' ? 'bg-white text-slate-900' : 'text-white/40'}`}>Morning</button>
                <button onClick={() => setShift('evening')} className={`flex-1 rounded-xl text-[10px] font-black uppercase ${shift === 'evening' ? 'bg-white text-slate-900' : 'text-white/40'}`}>Evening</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Male Lockers</p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">{renderLockers('male')}</div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-white/40">M-Costumes</span>
                    <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl">
                        <button onClick={() => setMaleCostumes(Math.max(0, maleCostumes-1))} className="w-8 h-8 rounded-lg bg-white/5">-</button>
                        <span className="text-lg font-black">{maleCostumes}</span>
                        <button onClick={() => setMaleCostumes(maleCostumes+1)} className="w-8 h-8 rounded-lg bg-white/5">+</button>
                    </div>
                </div>
            </div>
            <div className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                <p className="text-[10px] font-black uppercase text-pink-400 tracking-widest">Female Lockers</p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">{renderLockers('female')}</div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-white/40">F-Costumes</span>
                    <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl">
                        <button onClick={() => setFemaleCostumes(Math.max(0, femaleCostumes-1))} className="w-8 h-8 rounded-lg bg-white/5">-</button>
                        <span className="text-lg font-black">{femaleCostumes}</span>
                        <button onClick={() => setFemaleCostumes(femaleCostumes+1)} className="w-8 h-8 rounded-lg bg-white/5">+</button>
                    </div>
                </div>
            </div>
          </div>

          <button onClick={generateReceipt} className="btn-resort w-full h-20 !bg-emerald-500 !text-slate-900 text-lg shadow-2xl">GENERATE BILL</button>
          
          {receipt && (() => {
            const breakdown = calculateBreakdown();
            return (
                <div className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
                    <div className="bg-white text-slate-900 rounded-[3rem] w-full max-w-xl p-10 space-y-8 shadow-2xl border-t-[12px] border-emerald-500 overflow-hidden">
                        <div className="text-center space-y-1">
                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">ID: {receipt.receiptNo}</p>
                            <h2 className="text-4xl font-black uppercase tracking-tighter">Asset Confirmation</h2>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Assets Details</span>
                                <span className="text-[11px] font-black text-slate-900 uppercase">Per Unit Fees</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Locker Rent ({maleLockers.length + femaleLockers.length} Units)</span>
                                    <span className="text-sm font-black text-slate-900">₹{breakdown.lockerRent}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Male Costume Rent ({maleCostumes})</span>
                                    <span className="text-sm font-black text-slate-900">₹{breakdown.mCostumeRent}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Female Costume Rent ({femaleCostumes})</span>
                                    <span className="text-sm font-black text-slate-900">₹{breakdown.fCostumeRent}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Rent</p>
                                    <p className="text-2xl font-black text-slate-900">₹{breakdown.totalRent}</p>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Refundable</p>
                                    <p className="text-2xl font-black text-emerald-700">₹{breakdown.totalDeposit}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex justify-between items-center shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Collect Cash</p>
                                <h3 className="text-6xl font-black tracking-tighter">₹{breakdown.total}</h3>
                            </div>
                            <div className="relative z-10 bg-white/10 w-20 h-20 rounded-full flex items-center justify-center text-3xl">
                                <i className="fas fa-wallet text-white/80"></i>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setReceipt(null)} className="flex-1 py-5 rounded-2xl bg-slate-100 font-black text-[10px] uppercase text-slate-400 hover:bg-slate-200 transition-all">Edit Items</button>
                            <button onClick={confirmAndPrint} disabled={isSyncing} className="flex-[2] bg-emerald-500 text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:bg-emerald-400 active:scale-95 transition-all">
                                {isSyncing ? 'SYNCING...' : 'Confirm & Print'}
                            </button>
                        </div>
                    </div>
                </div>
            );
          })()}
        </div>
      )}

      {mode === 'return' && (role === 'staff2' || role === 'staff' || role === 'admin') && (
        <div className="bg-white/10 border border-white/20 rounded-[3rem] p-12 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-3xl animate-slide-up text-center no-print">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-3xl text-amber-400 mx-auto border border-amber-500/20">
            <i className="fas fa-undo-alt"></i>
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight">Return Assets</h3>
          <input placeholder="SWP/DDMMYY1-001" className="input-premium text-center !bg-slate-900/50 !text-white text-2xl font-black uppercase tracking-widest" value={searchCode} onChange={e => setSearchCode(e.target.value.toUpperCase())} />
          <button onClick={findReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-amber-500 !text-slate-900 shadow-xl">FIND RECEIPT</button>
          
          {returnReceipt && (
            <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 space-y-8 text-left border-b-[10px] border-emerald-500 animate-slide-up mt-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Guest Name</p>
                <h4 className="font-black text-2xl uppercase tracking-tighter text-slate-900">{returnReceipt.guestName}</h4>
              </div>

              {/* Items Collection Checklist */}
              <div className="bg-slate-900 text-white rounded-[1.5rem] p-6 space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 border-b border-white/10 pb-3">Checklist: Items to Collect</p>
                  
                  <div className="space-y-4">
                      {/* Locker Keys */}
                      {(returnReceipt.maleLockers.length > 0 || returnReceipt.femaleLockers.length > 0) && (
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase opacity-60">Locker Keys to Return:</p>
                            <div className="flex flex-wrap gap-2">
                                {returnReceipt.maleLockers.map(num => (
                                    <span key={`m-${num}`} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-black border border-blue-400">M-{num}</span>
                                ))}
                                {returnReceipt.femaleLockers.map(num => (
                                    <span key={`f-${num}`} className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-black border border-pink-400">F-{num}</span>
                                ))}
                            </div>
                        </div>
                      )}

                      {/* Costumes */}
                      {(returnReceipt.maleCostumes > 0 || returnReceipt.femaleCostumes > 0) && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            {returnReceipt.maleCostumes > 0 && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-[8px] font-black uppercase opacity-60 mb-1">M-Costumes</p>
                                    <p className="text-xl font-black text-blue-400">{returnReceipt.maleCostumes}</p>
                                </div>
                            )}
                            {returnReceipt.femaleCostumes > 0 && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-[8px] font-black uppercase opacity-60 mb-1">F-Costumes</p>
                                    <p className="text-xl font-black text-pink-400">{returnReceipt.femaleCostumes}</p>
                                </div>
                            )}
                        </div>
                      )}
                  </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl space-y-1 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Refundable Security</p>
                  <p className="text-3xl text-emerald-700 font-black">₹{returnReceipt.refundableAmount}</p>
              </div>

              <button onClick={confirmReturn} disabled={isSyncing} className="btn-resort w-full h-20 !bg-slate-900 !text-white text-sm shadow-xl">
                 <i className="fas fa-check-double mr-2"></i> COMPLETE REFUND
              </button>
            </div>
          )}
        </div>
      )}

      {receipt && (() => {
        const breakdown = calculateBreakdown();
        return (
            <div ref={printRef} className="hidden print:block fixed inset-0 bg-white text-black p-10 font-mono text-center space-y-4">
                <h1 className="text-2xl font-bold border-b-2 border-black pb-2">SPRAY AQUA RESORT</h1>
                <p className="text-xs">RECEIPT: {receipt.receiptNo} | DATE: {receipt.date}</p>
                <p className="text-left py-4 text-xs">GUEST: {receipt.guestName} | {receipt.guestMobile}</p>
                
                <div className="text-left text-xs border-y py-4 space-y-2">
                    <p className="font-bold border-b">ASSETS ISSUED:</p>
                    {receipt.maleLockers.length > 0 && <p>MALE LOCKERS: {receipt.maleLockers.join(',')}</p>}
                    {receipt.femaleLockers.length > 0 && <p>FEMALE LOCKERS: {receipt.femaleLockers.join(',')}</p>}
                    {receipt.maleCostumes > 0 && <p>MALE COSTUMES: {receipt.maleCostumes} Units</p>}
                    {receipt.femaleCostumes > 0 && <p>FEMALE COSTUMES: {receipt.femaleCostumes} Units</p>}
                </div>

                <div className="text-right py-4 space-y-1 text-xs font-bold">
                    <div className="flex justify-between"><span>LOCKER RENT:</span><span>₹{breakdown.lockerRent}</span></div>
                    <div className="flex justify-between"><span>COSTUME RENT (M/F):</span><span>₹{breakdown.mCostumeRent + breakdown.fCostumeRent}</span></div>
                    <div className="flex justify-between border-t pt-1"><span>TOTAL RENT:</span><span>₹{breakdown.totalRent}</span></div>
                    <div className="flex justify-between text-blue-700"><span>REFUNDABLE SECURITY:</span><span>₹{breakdown.totalDeposit}</span></div>
                    <div className="flex justify-between text-lg border-t-2 border-black pt-2"><span>NET COLLECTED:</span><span>₹{breakdown.total}</span></div>
                </div>

                <p className="text-[10px] pt-10 border-t border-dashed">Please keep this receipt safe for security refund.</p>
            </div>
        );
      })()}
    </div>
  );
};

export default StaffPortal;
