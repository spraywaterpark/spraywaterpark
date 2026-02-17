
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { COSTUME_RULES, LOCKER_RULES } from '../constants';

const StaffPortal: React.FC = () => {
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>('entry');
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
  const [checkedGuest, setCheckedGuest] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);
  
  const [activeLockers, setActiveLockers] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });
  const [costumeStock, setCostumeStock] = useState({ 
    male: COSTUME_RULES.MALE_COSTUME_TOTAL, 
    female: COSTUME_RULES.FEMALE_COSTUME_TOTAL 
  });
  
  const [returnedLockersCache, setReturnedLockersCache] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });

  const refreshActive = async () => {
    if (isSyncing) return;
    const rentals = await cloudSync.fetchRentals();
    if (rentals) {
      const activeRecords = rentals.filter(r => r.status === 'issued' && r.receiptNo);
      let cloudMaleBusy = activeRecords.flatMap(r => Array.isArray(r.maleLockers) ? r.maleLockers : []);
      let cloudFemaleBusy = activeRecords.flatMap(r => Array.isArray(r.femaleLockers) ? r.femaleLockers : []);
      setActiveLockers({
        male: cloudMaleBusy.filter(n => !returnedLockersCache.male.includes(n)),
        female: cloudFemaleBusy.filter(n => !returnedLockersCache.female.includes(n))
      });
      let mIssued = 0;
      let fIssued = 0;
      activeRecords.forEach(r => {
        mIssued += (Number(r.maleCostumes) || 0);
        fIssued += (Number(r.femaleCostumes) || 0);
      });
      setCostumeStock({
        male: Math.max(0, COSTUME_RULES.MALE_COSTUME_TOTAL - mIssued),
        female: Math.max(0, COSTUME_RULES.FEMALE_COSTUME_TOTAL - fIssued)
      });
    }
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 10000); 
    return () => clearInterval(interval);
  }, [mode, returnedLockersCache]);

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
        alert(`✅ Welcome! Ticket ${ticketInput} verified and checked in.`);
        setTicketInput('');
      } else {
        alert(`❌ Error: ${data.details}`);
      }
    } catch (e) {
      alert("System Error. Try manual entry.");
    } finally {
      setIsSyncing(false);
    }
  };

  const generateReceiptNo = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `swp_rc_${yy}${mm}${dd}`;
    const count = Number(localStorage.getItem(key) || 0) + 1;
    localStorage.setItem(key, String(count));
    return `SWP-${yy}${mm}${dd}-${String(count).padStart(4, '0')}`;
  };

  const resetForm = () => {
    setGuestName(''); setGuestMobile(''); setMaleLockers([]); setFemaleLockers([]); setMaleCostumes(0); setFemaleCostumes(0); setReceipt(null);
  };

  const toggleLocker = (num: number, gender: 'male' | 'female') => {
    const list = gender === 'male' ? maleLockers : femaleLockers;
    const setList = gender === 'male' ? setMaleLockers : setFemaleLockers;
    setList(list.includes(num) ? list.filter(n => n !== num) : [...list, num]);
  };

  const generateReceipt = () => {
    if (!guestName) return alert("Enter guest name");
    if (!/^[789]\d{9}$/.test(guestMobile)) return alert("Invalid Mobile Number.");
    if (maleLockers.length === 0 && femaleLockers.length === 0 && maleCostumes === 0 && femaleCostumes === 0) return alert("Select at least one asset");

    const mQty = Number(maleCostumes) || 0;
    const fQty = Number(femaleCostumes) || 0;
    const lockersCount = maleLockers.length + femaleLockers.length;
    const rent = (lockersCount * 100) + (mQty * 50) + (fQty * 100);
    const deposit = (lockersCount * 200) + (mQty * 50) + (fQty * 100);

    setReceipt({
      receiptNo: generateReceiptNo(),
      guestName, guestMobile, date: new Date().toISOString().split('T')[0],
      shift, maleLockers, femaleLockers, maleCostumes: mQty, femaleCostumes: fQty,
      rentAmount: rent, securityDeposit: deposit, totalCollected: rent + deposit, refundableAmount: deposit,
      status: 'issued', createdAt: new Date().toISOString()
    });
  };

  const printReceipt = async () => {
    if (!receipt || !printRef.current) return;
    setIsSyncing(true);
    const success = await cloudSync.saveRental(receipt);
    if (!success) { alert("Error: Cloud Sync Failed!"); setIsSyncing(false); return; }
    window.print();
    setIsSyncing(false);
    resetForm();
  };

  const findReturn = async () => {
    if (!searchCode) return;
    setIsSyncing(true);
    const all = await cloudSync.fetchRentals();
    const found = all?.find(r => r.receiptNo.endsWith(searchCode) && r.status === 'issued');
    setIsSyncing(false);
    if (!found) return alert("Record not found.");
    setReturnReceipt(found);
  };

  const confirmReturn = async () => {
    if (!returnReceipt) return;
    setIsSyncing(true);
    const success = await cloudSync.updateRental({ ...returnReceipt, status: 'returned', returnedAt: new Date().toISOString() });
    if (success) {
      alert("Return Successful!");
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
          className={`w-10 h-10 rounded-lg text-xs font-black border transition-all ${isBusy ? 'bg-red-600 text-white/40 cursor-not-allowed border-red-900 shadow-inner' : selected.includes(num) ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 text-white/80 border-white/20'}`}>
          {num}
        </button>
      );
    });

  return (
    <div className="w-full flex flex-col items-center py-6 text-white min-h-[90vh]">
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 px-4">
          <div className="flex bg-white/10 rounded-full p-1 border border-white/10 shadow-lg">
            <button onClick={() => setMode('entry')} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'entry' ? 'bg-blue-500 text-white' : 'text-white/70'}`}>GATE</button>
            <button onClick={() => setMode('issue')} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'issue' ? 'bg-emerald-500 text-slate-900' : 'text-white/70'}`}>ISSUE</button>
            <button onClick={() => setMode('return')} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'return' ? 'bg-emerald-500 text-slate-900' : 'text-white/70'}`}>RETURN</button>
          </div>
          <button onClick={refreshActive} className="bg-white/10 p-3 rounded-full border border-white/10">
             <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin text-emerald-400' : ''}`}></i>
          </button>
      </div>

      {mode === 'entry' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-10 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-xl animate-slide-up text-center">
          <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center text-4xl text-blue-400 mx-auto mb-6">
            <i className="fas fa-qrcode"></i>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Gate Entry Control</h3>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Scan QR or enter Ticket ID (SWP-XXXXXX)</p>
          <input 
            placeholder="TICKET ID" 
            className="input-premium text-center !bg-slate-900/50 !text-white text-2xl font-black placeholder:text-white/10" 
            value={ticketInput} 
            onChange={e => setTicketInput(e.target.value)} 
          />
          <button 
            onClick={handleCheckIn} 
            disabled={isSyncing || !ticketInput}
            className="btn-resort w-full h-16 !bg-blue-600 !text-white text-sm shadow-xl disabled:opacity-30"
          >
            {isSyncing ? 'Verifying...' : 'Validate Entry'}
          </button>
          
          <div className="pt-6 grid grid-cols-2 gap-4">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Capacity Alert</p>
                <p className="text-lg font-black text-emerald-400">Normal</p>
             </div>
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Staff Status</p>
                <p className="text-lg font-black text-blue-400">Live</p>
             </div>
          </div>
        </div>
      )}

      {mode === 'issue' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-8 md:p-12 w-full max-w-5xl space-y-10 shadow-2xl backdrop-blur-xl animate-slide-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/10 text-center">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">M-Lockers</p>
                  <p className="text-xl font-black text-blue-400">{60 - activeLockers.male.length}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">F-Lockers</p>
                  <p className="text-xl font-black text-pink-400">{60 - activeLockers.female.length}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">M-Costume</p>
                  <p className="text-xl font-black text-emerald-400">{costumeStock.male}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">F-Costume</p>
                  <p className="text-xl font-black text-emerald-400">{costumeStock.female}</p>
              </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Guest Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Mobile" value={guestMobile} maxLength={10} onChange={e => setGuestMobile(e.target.value.replace(/\D/g,''))} />
          </div>

          <div className="flex gap-4">
            <button onClick={() => setShift('morning')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase border transition-all ${shift === 'morning' ? 'bg-white text-slate-900' : 'bg-white/5 border-white/10'}`}>Morning</button>
            <button onClick={() => setShift('evening')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase border transition-all ${shift === 'evening' ? 'bg-white text-slate-900' : 'bg-white/5 border-white/10'}`}>Evening</button>
          </div>

          <div className="space-y-6">
            <p className="font-black text-xs uppercase text-blue-400 tracking-widest">Male Lockers</p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">{renderLockers('male')}</div>
          </div>

          <div className="space-y-6">
            <p className="font-black text-xs uppercase text-pink-400 tracking-widest">Female Lockers</p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">{renderLockers('female')}</div>
          </div>

          <button onClick={generateReceipt} className="btn-resort w-full h-16 !bg-emerald-500 !text-slate-900 font-black uppercase">Generate Receipt</button>
          
          {receipt && (
            <div ref={printRef} className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 border-4 border-slate-900 animate-slide-up no-print">
              <h2 className="font-black text-center text-xl uppercase">Spray Aqua Resort</h2>
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                  <div><p className="text-[9px] uppercase opacity-50">Total</p><p className="text-2xl font-black">₹{receipt.totalCollected}</p></div>
                  <div className="text-right"><p className="text-[9px] uppercase opacity-50">Refundable</p><p className="text-lg font-black text-emerald-400">₹{receipt.refundableAmount}</p></div>
              </div>
              <button onClick={printReceipt} disabled={isSyncing} className="btn-resort w-full h-14 !bg-slate-900 !text-white">Print & Confirm</button>
            </div>
          )}
        </div>
      )}

      {mode === 'return' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-10 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-xl animate-slide-up text-center">
          <input placeholder="Receipt Last 4 Digits" className="input-premium text-center !bg-slate-900/50 !text-white text-2xl font-black" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
          <button onClick={findReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-blue-600 !text-white">Search Receipt</button>
          {returnReceipt && (
            <div className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 text-left border-4 border-emerald-500 animate-slide-up">
              <h4 className="font-black text-lg uppercase">{returnReceipt.guestName}</h4>
              <p className="text-xs font-bold text-emerald-600">Refundable Security: ₹{returnReceipt.refundableAmount}</p>
              <button onClick={confirmReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-emerald-500 !text-slate-900">Complete Return</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffPortal;
