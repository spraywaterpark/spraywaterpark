
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, UserRole } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { COSTUME_RULES, LOCKER_RULES } from '../constants';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  // Set default mode based on role
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(
    role === 'staff1' ? 'entry' : 'issue'
  );
  
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

  // Gate Check-in States
  const [ticketInput, setTicketInput] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  
  const [activeLockers, setActiveLockers] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });
  const [costumeStock, setCostumeStock] = useState({ 
    male: COSTUME_RULES.MALE_COSTUME_TOTAL, 
    female: COSTUME_RULES.FEMALE_COSTUME_TOTAL 
  });

  const refreshActive = async () => {
    if (isSyncing) return;
    const rentals = await cloudSync.fetchRentals();
    if (rentals) {
      const activeRecords = rentals.filter(r => r.status === 'issued');
      const cloudMaleBusy = activeRecords.flatMap(r => Array.isArray(r.maleLockers) ? r.maleLockers : []);
      const cloudFemaleBusy = activeRecords.flatMap(r => Array.isArray(r.femaleLockers) ? r.femaleLockers : []);
      
      setActiveLockers({
        male: cloudMaleBusy,
        female: cloudFemaleBusy
      });

      let mIssued = activeRecords.reduce((sum, r) => sum + (Number(r.maleCostumes) || 0), 0);
      let fIssued = activeRecords.reduce((sum, r) => sum + (Number(r.femaleCostumes) || 0), 0);

      setCostumeStock({
        male: Math.max(0, COSTUME_RULES.MALE_COSTUME_TOTAL - mIssued),
        female: Math.max(0, COSTUME_RULES.FEMALE_COSTUME_TOTAL - fIssued)
      });
    }
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 15000); 
    return () => clearInterval(interval);
  }, [mode]);

  const handleCheckIn = async () => {
    if (!ticketInput) return;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/booking?type=checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticketInput.toUpperCase() })
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Welcome! Ticket ${ticketInput} verified.`);
        setTicketInput('');
      } else {
        alert(`❌ Error: ${data.details}`);
      }
    } catch (e) {
      alert("System Error. Check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const generateReceiptNo = () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `swp_receipt_count_${today}`;
    const count = Number(localStorage.getItem(key) || 0) + 1;
    localStorage.setItem(key, String(count));
    return `SWP-${String(count).padStart(2, '0')}`;
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
    const lockerDep = (mLockers * LOCKER_RULES.MALE_LOCKER_DEPOSIT) + (fLockers * LOCKER_RULES.FEMALE_LOCKER_DEPOSIT);
    
    const costumeRent = (mCostumes * COSTUME_RULES.MALE_COSTUME_RENT) + (fCostumes * COSTUME_RULES.FEMALE_COSTUME_RENT);
    const costumeDep = (mCostumes * COSTUME_RULES.MALE_COSTUME_DEPOSIT) + (fCostumes * COSTUME_RULES.FEMALE_COSTUME_DEPOSIT);

    const totalRent = lockerRent + costumeRent;
    const totalDeposit = lockerDep + costumeDep;

    return { 
      lockerRent, 
      lockerDep, 
      costumeRent, 
      costumeDep, 
      totalRent, 
      totalDeposit, 
      total: totalRent + totalDeposit 
    };
  };

  const generateReceipt = () => {
    if (!guestName) return alert("Please enter Guest Name.");
    if (!/^[789]\d{9}$/.test(guestMobile)) return alert("Invalid Mobile Number.");
    if (maleLockers.length === 0 && femaleLockers.length === 0 && maleCostumes === 0 && femaleCostumes === 0) {
      return alert("Please select at least one Locker or Costume.");
    }

    const { totalRent, totalDeposit, total } = calculateBreakdown();

    setReceipt({
      receiptNo: generateReceiptNo(),
      guestName, 
      guestMobile, 
      date: new Date().toISOString().split('T')[0],
      shift, 
      maleLockers, 
      femaleLockers, 
      maleCostumes: Number(maleCostumes), 
      femaleCostumes: Number(femaleCostumes),
      rentAmount: totalRent, 
      securityDeposit: totalDeposit, 
      totalCollected: total, 
      refundableAmount: totalDeposit,
      status: 'issued', 
      createdAt: new Date().toISOString()
    });
  };

  const confirmAndPrint = async () => {
    if (!receipt) return;
    setIsSyncing(true);
    const success = await cloudSync.saveRental(receipt);
    if (success) {
      window.print();
      setGuestName(''); 
      setGuestMobile(''); 
      setMaleLockers([]); 
      setFemaleLockers([]); 
      setMaleCostumes(0); 
      setFemaleCostumes(0); 
      setReceipt(null);
      refreshActive();
    } else {
      alert("Cloud Sync Failed. Check internet or Google Sheets setup.");
    }
    setIsSyncing(false);
  };

  const findReturn = async () => {
    if (!searchCode) return;
    setIsSyncing(true);
    const all = await cloudSync.fetchRentals();
    const found = all?.find(r => (r.receiptNo === searchCode || r.receiptNo.endsWith(searchCode)) && r.status === 'issued');
    setIsSyncing(false);
    if (!found) return alert("Active record not found for this code.");
    setReturnReceipt(found);
  };

  const confirmReturn = async () => {
    if (!returnReceipt) return;
    setIsSyncing(true);
    const success = await cloudSync.updateRental({ ...returnReceipt, status: 'returned', returnedAt: new Date().toISOString() });
    if (success) {
      alert("Assets Returned Successfully!");
      setReturnReceipt(null);
      setSearchCode('');
      refreshActive();
    }
    setIsSyncing(false);
  };

  const renderLockers = (gender: 'male' | 'female') =>
    Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
      const selected = gender === 'male' ? maleLockers : femaleLockers;
      const isBusy = activeLockers[gender].includes(num);
      return (
        <button key={num} disabled={isBusy} onClick={() => toggleLocker(num, gender)}
          className={`w-10 h-10 rounded-lg text-xs font-black border transition-all ${isBusy ? 'bg-red-600 text-white/30 cursor-not-allowed border-red-900' : selected.includes(num) ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 text-white/80 border-white/20 hover:border-white/50'}`}>
          {num}
        </button>
      );
    });

  return (
    <div className="w-full flex flex-col items-center py-6 text-white min-h-[90vh]">
      {/* Tab Switcher - Restricted based on Role */}
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
        <div className="bg-white/10 border border-white/20 rounded-[3rem] p-12 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-3xl animate-slide-up text-center no-print">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-4xl text-blue-400 mx-auto mb-6 border border-blue-500/20">
            <i className="fas fa-id-card"></i>
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight">Gate Verification</h3>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Logged in as: {role}</p>
          <input placeholder="ENTER TICKET ID" className="input-premium text-center !bg-slate-900/50 !text-white text-2xl font-black uppercase tracking-widest" value={ticketInput} onChange={e => setTicketInput(e.target.value)} />
          <button onClick={handleCheckIn} disabled={isSyncing || !ticketInput} className="btn-resort w-full h-16 !bg-blue-600 !text-white shadow-xl">
            {isSyncing ? 'VERIFYING...' : 'VALIDATE & CHECK-IN'}
          </button>
        </div>
      )}

      {mode === 'issue' && (role === 'staff2' || role === 'staff' || role === 'admin') && (
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-14 w-full max-w-6xl space-y-12 shadow-2xl backdrop-blur-3xl animate-slide-up no-print">
          <div className="text-center md:text-left mb-6">
            <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">Asset Issuance Terminal</p>
            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">Session User: {role}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-blue-500/20 text-center">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">M-Lockers Avail</p>
                  <p className="text-3xl font-black">{60 - activeLockers.male.length}</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-pink-500/20 text-center">
                  <p className="text-[9px] font-black text-pink-400 uppercase tracking-[0.2em] mb-2">F-Lockers Avail</p>
                  <p className="text-3xl font-black">{60 - activeLockers.female.length}</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-emerald-500/20 text-center">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">M-Costume Stock</p>
                  <p className="text-3xl font-black">{costumeStock.male}</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-emerald-500/20 text-center">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">F-Costume Stock</p>
                  <p className="text-3xl font-black">{costumeStock.female}</p>
              </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase">Guest Name</label>
                <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Full Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase">Mobile Number</label>
                <input className="input-premium !bg-slate-900/50 !text-white" placeholder="10 Digits" value={guestMobile} maxLength={10} onChange={e => setGuestMobile(e.target.value.replace(/\D/g,''))} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase">Shift Session</label>
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10 h-[56px]">
                    <button onClick={() => setShift('morning')} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${shift === 'morning' ? 'bg-white text-slate-900' : 'text-white/40'}`}>Morning</button>
                    <button onClick={() => setShift('evening')} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${shift === 'evening' ? 'bg-white text-slate-900' : 'text-white/40'}`}>Evening</button>
                </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5">
                <p className="font-black text-xs uppercase text-blue-400 tracking-widest flex items-center gap-3">
                   <i className="fas fa-mars"></i> Male Locker Selection
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">{renderLockers('male')}</div>
                
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-white/40">Male Costumes (Qty)</p>
                    <div className="flex items-center gap-6 bg-slate-900 p-2 rounded-2xl">
                        <button onClick={() => setMaleCostumes(Math.max(0, maleCostumes-1))} className="w-10 h-10 rounded-xl bg-white/5 text-white">-</button>
                        <span className="text-xl font-black w-8 text-center">{maleCostumes}</span>
                        <button onClick={() => setMaleCostumes(maleCostumes+1)} className="w-10 h-10 rounded-xl bg-white/5 text-white">+</button>
                    </div>
                </div>
            </div>

            <div className="space-y-8 bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5">
                <p className="font-black text-xs uppercase text-pink-400 tracking-widest flex items-center gap-3">
                    <i className="fas fa-venus"></i> Female Locker Selection
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">{renderLockers('female')}</div>
                
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-white/40">Female Costumes (Qty)</p>
                    <div className="flex items-center gap-6 bg-slate-900 p-2 rounded-2xl">
                        <button onClick={() => setFemaleCostumes(Math.max(0, femaleCostumes-1))} className="w-10 h-10 rounded-xl bg-white/5 text-white">-</button>
                        <span className="text-xl font-black w-8 text-center">{femaleCostumes}</span>
                        <button onClick={() => setFemaleCostumes(femaleCostumes+1)} className="w-10 h-10 rounded-xl bg-white/5 text-white">+</button>
                    </div>
                </div>
            </div>
          </div>

          <button onClick={generateReceipt} className="btn-resort w-full h-20 !bg-emerald-500 !text-slate-900 text-lg shadow-2xl uppercase font-black">Generate Booking Breakdown</button>
          
          {receipt && (
            <div className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
              <div className="bg-white text-slate-900 rounded-[3rem] w-full max-w-xl p-10 space-y-8 shadow-2xl border-t-[12px] border-emerald-500">
                <div className="text-center">
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1">ID: {receipt.receiptNo}</p>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Confirm Assets</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{receipt.guestName} | {receipt.guestMobile}</p>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4 text-sm font-bold border border-slate-100">
                    <div className="flex justify-between items-center border-b pb-3">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Lockers ({receipt.maleLockers.length + receipt.femaleLockers.length})</p>
                        </div>
                        <div className="text-right">
                            <p>Rent: ₹{(receipt.maleLockers.length + receipt.femaleLockers.length) * 100}</p>
                            <p className="text-emerald-600">Deposit: ₹{(receipt.maleLockers.length + receipt.femaleLockers.length) * 200}</p>
                        </div>
                    </div>
                    
                    {(receipt.maleCostumes > 0 || receipt.femaleCostumes > 0) && (
                        <div className="flex justify-between items-center border-b pb-3">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Costumes ({receipt.maleCostumes + receipt.femaleCostumes})</p>
                            </div>
                            <div className="text-right">
                                <p>Rent: ₹{(receipt.maleCostumes * 50) + (receipt.femaleCostumes * 100)}</p>
                                <p className="text-emerald-600">Deposit: ₹{(receipt.maleCostumes * 50) + (receipt.femaleCostumes * 100)}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-4 bg-white rounded-2xl border text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Usage Fee</p>
                            <p className="text-xl font-black">₹{receipt.rentAmount}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Refundable Amt</p>
                            <p className="text-xl font-black text-emerald-700">₹{receipt.securityDeposit}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-[2rem] flex justify-between items-center shadow-xl">
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Total to Collect</p>
                    <h3 className="text-5xl font-black tracking-tighter">₹{receipt.totalCollected}</h3>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setReceipt(null)} className="flex-1 py-5 rounded-2xl font-black text-xs uppercase bg-slate-100 text-slate-400">Back</button>
                    <button onClick={confirmAndPrint} disabled={isSyncing} className="flex-[2] btn-resort !bg-emerald-500 !text-slate-900">
                        {isSyncing ? 'SYNCING...' : 'CONFIRM & PRINT'}
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'return' && (role === 'staff2' || role === 'staff' || role === 'admin') && (
        <div className="bg-white/10 border border-white/20 rounded-[3rem] p-12 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-3xl animate-slide-up text-center no-print">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-4xl text-amber-400 mx-auto mb-6 border border-amber-500/20">
            <i className="fas fa-undo-alt"></i>
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight">Return & Refund</h3>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Logged in as: {role}</p>
          <input placeholder="SWP-01" className="input-premium text-center !bg-slate-900/50 !text-white text-2xl font-black uppercase tracking-widest" value={searchCode} onChange={e => setSearchCode(e.target.value.toUpperCase())} />
          <button onClick={findReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-amber-500 !text-slate-900 shadow-xl">
            {isSyncing ? 'SEARCHING...' : 'VERIFY RECEIPT'}
          </button>
          
          {returnReceipt && (
            <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 space-y-8 text-left border-b-[10px] border-emerald-500 animate-slide-up mt-8">
              <div>
                <h4 className="font-black text-2xl uppercase tracking-tighter">{returnReceipt.guestName}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{returnReceipt.receiptNo}</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl space-y-3 text-xs font-bold">
                  <div className="flex justify-between border-b pb-2 text-slate-500"><span>Male Lockers</span><span>{returnReceipt.maleLockers.join(', ') || 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-2 text-slate-500"><span>Female Lockers</span><span>{returnReceipt.femaleLockers.join(', ') || 'N/A'}</span></div>
                  <div className="flex justify-between pt-4 text-emerald-600 text-sm font-black uppercase">
                      <span>Security Refund</span>
                      <span className="text-xl">₹{returnReceipt.refundableAmount}</span>
                  </div>
              </div>
              
              <button onClick={confirmReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-slate-900 !text-white">PAY REFUND & COMPLETE</button>
            </div>
          )}
        </div>
      )}

      {/* Hidden Print Template */}
      {receipt && (
        <div ref={printRef} className="hidden print:block fixed inset-0 bg-white text-black p-10 font-mono text-center space-y-4">
            <h1 className="text-2xl font-bold border-b-2 border-black pb-2">SPRAY AQUA RESORT</h1>
            <p className="text-sm font-black border border-black p-1">OFFICIAL ASSET RECEIPT</p>
            <div className="text-left space-y-1 text-xs border-y py-4 grid grid-cols-2">
                <p>ID: <strong>{receipt.receiptNo}</strong></p>
                <p>DATE: {receipt.date}</p>
                <p>GUEST: {receipt.guestName}</p>
                <p>MOBILE: {receipt.guestMobile}</p>
            </div>
            <div className="text-left space-y-1 text-xs border-b pb-4">
                <p>M-LOCKERS: {receipt.maleLockers.join(', ') || 'NONE'}</p>
                <p>F-LOCKERS: {receipt.femaleLockers.join(', ') || 'NONE'}</p>
                <p>M-COSTUMES: {receipt.maleCostumes}</p>
                <p>F-COSTUMES: {receipt.femaleCostumes}</p>
            </div>
            <div className="text-right space-y-1 py-4 text-xs font-bold">
                <p>TOTAL RENT: ₹{receipt.rentAmount}</p>
                <p>SECURITY DEPOSIT: ₹{receipt.securityDeposit}</p>
                <p className="text-lg font-black pt-2 border-t">COLLECTED: ₹{receipt.totalCollected}</p>
                <p className="text-base font-black bg-gray-100 p-1">REFUNDABLE: ₹{receipt.securityDeposit}</p>
            </div>
            <p className="text-[9px] pt-4 italic">Please return this slip at the counter for your refund.</p>
        </div>
      )}
    </div>
  );
};

export default StaffPortal;
