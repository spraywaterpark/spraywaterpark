
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { COSTUME_RULES, LOCKER_RULES } from '../constants';

const StaffPortal: React.FC = () => {
  const [mode, setMode] = useState<'issue' | 'return'>('issue');
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

  const printRef = useRef<HTMLDivElement>(null);
  
  // Track Inventory State
  const [activeLockers, setActiveLockers] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });
  const [costumeStock, setCostumeStock] = useState({ male: COSTUME_RULES.MALE_COSTUME_TOTAL, female: COSTUME_RULES.FEMALE_COSTUME_TOTAL });

  const refreshActive = async () => {
    // Avoid refreshing if we are in the middle of a transaction
    if (isSyncing) return;

    const rentals = await cloudSync.fetchRentals();
    if (rentals) {
      const active = rentals.filter(r => r.status === 'issued');
      
      // Update Busy Lockers
      setActiveLockers({
        male: active.flatMap(r => Array.isArray(r.maleLockers) ? r.maleLockers : []),
        female: active.flatMap(r => Array.isArray(r.femaleLockers) ? r.femaleLockers : [])
      });

      // FIX: Ensure numeric addition using Number() to prevent string concatenation bug (-1799 bug)
      const issuedMaleCostumes = active.reduce((sum, r) => sum + Number(r.maleCostumes || 0), 0);
      const issuedFemaleCostumes = active.reduce((sum, r) => sum + Number(r.femaleCostumes || 0), 0);

      setCostumeStock({
        male: Math.max(0, COSTUME_RULES.MALE_COSTUME_TOTAL - issuedMaleCostumes),
        female: Math.max(0, COSTUME_RULES.FEMALE_COSTUME_TOTAL - issuedFemaleCostumes)
      });
    }

    // Receipt Counter Reset Detection
    const settings = await cloudSync.fetchSettings();
    if (settings?.lastShiftReset) {
      const localLastReset = localStorage.getItem('swp_last_shift_reset');
      if (settings.lastShiftReset !== localLastReset) {
        localStorage.setItem('swp_last_shift_reset', settings.lastShiftReset);
        const d = new Date();
        const key = `swp_rc_${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        localStorage.setItem(key, '0');
        console.log("Admin Shift Reset Triggered: Counter is now 0001.");
      }
    }
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 25000); 
    return () => clearInterval(interval);
  }, [mode]);

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
    setGuestName('');
    setGuestMobile('');
    setMaleLockers([]);
    setFemaleLockers([]);
    setMaleCostumes(0);
    setFemaleCostumes(0);
    setReceipt(null);
  };

  const toggleLocker = (num: number, gender: 'male' | 'female') => {
    const list = gender === 'male' ? maleLockers : femaleLockers;
    const setList = gender === 'male' ? setMaleLockers : setFemaleLockers;
    setList(list.includes(num) ? list.filter(n => n !== num) : [...list, num]);
  };

  const generateReceipt = () => {
    if (!guestName || !guestMobile) return alert("Enter guest details");
    if (maleLockers.length === 0 && femaleLockers.length === 0 && maleCostumes === 0 && femaleCostumes === 0) {
      return alert("Select at least one asset (Locker or Costume)");
    }

    // FINAL STOCK VALIDATION
    if (maleCostumes > costumeStock.male) {
      return alert(`Insufficient Stock: Only ${costumeStock.male} Male Costumes available.`);
    }
    if (femaleCostumes > costumeStock.female) {
      return alert(`Insufficient Stock: Only ${costumeStock.female} Female Costumes available.`);
    }

    const lockersCount = maleLockers.length + femaleLockers.length;
    const rent = (lockersCount * 100) + (maleCostumes * 50) + (femaleCostumes * 100);
    const deposit = (lockersCount * 200) + (maleCostumes * 50) + (femaleCostumes * 100);

    const data: LockerReceipt = {
      receiptNo: generateReceiptNo(),
      guestName,
      guestMobile,
      date: new Date().toISOString().split('T')[0],
      shift,
      maleLockers,
      femaleLockers,
      maleCostumes,
      femaleCostumes,
      rentAmount: rent,
      securityDeposit: deposit,
      totalCollected: rent + deposit,
      refundableAmount: deposit,
      status: 'issued',
      createdAt: new Date().toISOString()
    };
    setReceipt(data);
  };

  const printReceipt = async () => {
    if (!receipt || !printRef.current) return;
    setIsSyncing(true);

    const success = await cloudSync.saveRental(receipt);
    if (!success) {
      alert("Error: Cloud Sync Failed. Check internet connection.");
      setIsSyncing(false);
      return;
    }

    const win = window.open('', '', 'width=800,height=900');
    if (win) {
      win.document.write(`<html><head><title>Print Receipt</title></head><body>${printRef.current.innerHTML}</body></html>`);
      win.document.close();
      win.print();
      win.close();
    }
    
    // Immediate Update of local inventory to prevent double booking
    setActiveLockers(prev => ({
      male: [...prev.male, ...receipt.maleLockers],
      female: [...prev.female, ...receipt.femaleLockers]
    }));

    setTimeout(refreshActive, 2000); 
    setIsSyncing(false);
    resetForm();
  };

  const findReturn = async () => {
    if (!searchCode) return alert("Enter receipt suffix (Last 4 digits)");
    setIsSyncing(true);
    const all = await cloudSync.fetchRentals();
    // Search only for 'issued' receipts to prevent double refund
    const found = all?.find(r => r.receiptNo.endsWith(searchCode) && r.status === 'issued');
    setIsSyncing(false);
    
    if (!found) return alert("Error: Receipt not found, already returned, or cleared in shift checkout.");
    setReturnReceipt(found);
  };

  const confirmReturn = async () => {
    if (!returnReceipt) return;
    setIsSyncing(true);

    const updated = {
      ...returnReceipt,
      status: 'returned' as const,
      returnedAt: new Date().toISOString()
    };

    const success = await cloudSync.updateRental(updated);
    
    if (success) {
      // CRITICAL: Immediate local update to UI colors so they turn green instantly
      setActiveLockers(prev => ({
        male: prev.male.filter(n => !returnReceipt.maleLockers.includes(n)),
        female: prev.female.filter(n => !returnReceipt.femaleLockers.includes(n))
      }));
      
      alert("Return Confirmed! Security refund processed and assets released.");
      setReturnReceipt(null);
      setSearchCode('');
      
      // Delay cloud refresh slightly so Google Sheets has time to commit the status change
      setTimeout(refreshActive, 3000);
    } else {
      alert("Error: Update failed. Please check connection and try again.");
    }
    setIsSyncing(false);
  };

  const renderLockers = (gender: 'male' | 'female') =>
    Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
      const selected = gender === 'male' ? maleLockers : femaleLockers;
      const isBusy = activeLockers[gender].includes(num);
      return (
        <button
          key={num}
          disabled={isBusy}
          onClick={() => toggleLocker(num, gender)}
          className={`w-10 h-10 rounded-lg text-xs font-black border transition-all
          ${isBusy ? 'bg-red-600 text-white/40 cursor-not-allowed border-red-900'
          : selected.includes(num) ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
          : 'bg-white/10 text-white/80 border-white/20 hover:border-white/50'}`}
        >
          {num}
        </button>
      );
    });

  return (
    <div className="w-full flex flex-col items-center py-6 text-white min-h-[90vh]">
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 px-4">
          <div className="flex bg-white/10 rounded-full p-1 border border-white/10 shadow-lg">
            <button onClick={() => setMode('issue')} className={`px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'issue' ? 'bg-emerald-500 text-slate-900' : 'text-white/70 hover:text-white'}`}>ISSUE</button>
            <button onClick={() => setMode('return')} className={`px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'return' ? 'bg-emerald-500 text-slate-900' : 'text-white/70 hover:text-white'}`}>RETURN</button>
          </div>
          
          <button onClick={refreshActive} disabled={isSyncing} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all border border-white/10">
             <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i>
          </button>
      </div>

      {mode === 'issue' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-8 md:p-12 w-full max-w-5xl space-y-10 shadow-2xl backdrop-blur-xl animate-slide-up">
          {/* Header Inventory Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/10">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">M-Lockers Avail</p>
                  <p className="text-xl font-black text-blue-400">{60 - activeLockers.male.length}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">F-Lockers Avail</p>
                  <p className="text-xl font-black text-pink-400">{60 - activeLockers.female.length}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">M-Costume Stock</p>
                  <p className={`text-xl font-black ${costumeStock.male < 5 ? 'text-red-500' : 'text-emerald-400'}`}>{costumeStock.male}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">F-Costume Stock</p>
                  <p className={`text-xl font-black ${costumeStock.female < 5 ? 'text-red-500' : 'text-emerald-400'}`}>{costumeStock.female}</p>
              </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Guest Details</label>
              <input className="input-premium !bg-slate-900/50 !text-white !border-white/20" placeholder="Full Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Contact No.</label>
              <input className="input-premium !bg-slate-900/50 !text-white !border-white/20" placeholder="Mobile Number" value={guestMobile} onChange={e => setGuestMobile(e.target.value.replace(/\D/g,''))} />
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setShift('morning')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${shift === 'morning' ? 'bg-white text-slate-900 border-white shadow-lg' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>Morning Slot</button>
            <button onClick={() => setShift('evening')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${shift === 'evening' ? 'bg-white text-slate-900 border-white shadow-lg' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>Evening Slot</button>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-white/10 pb-2">
              <p className="font-black text-xs uppercase tracking-[0.2em] text-blue-400">Male Locker Inventory</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{maleLockers.length} Selected</p>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">{renderLockers('male')}</div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-white/10 pb-2">
              <p className="font-black text-xs uppercase tracking-[0.2em] text-pink-400">Female Locker Inventory</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{femaleLockers.length} Selected</p>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">{renderLockers('female')}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Male Costume Qty (Max: {costumeStock.male})</label>
              <input type="number" min={0} className={`input-premium !bg-slate-900/50 !text-white ${maleCostumes > costumeStock.male ? '!border-red-500' : '!border-white/20'}`} value={maleCostumes} onChange={e => setMaleCostumes(Math.max(0, +e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Female Costume Qty (Max: {costumeStock.female})</label>
              <input type="number" min={0} className={`input-premium !bg-slate-900/50 !text-white ${femaleCostumes > costumeStock.female ? '!border-red-500' : '!border-white/20'}`} value={femaleCostumes} onChange={e => setFemaleCostumes(Math.max(0, +e.target.value))} />
            </div>
          </div>

          <button onClick={generateReceipt} className="btn-resort w-full h-16 shadow-2xl !bg-emerald-500 !text-slate-900 text-sm font-black">Generate & Review Receipt</button>
          
          {receipt && (
            <div ref={printRef} className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 shadow-2xl border-4 border-slate-900 animate-slide-up">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="font-black text-2xl uppercase tracking-tighter">Spray Aqua Resort</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500">Inventory Rental Voucher</p>
              </div>
              <div className="grid grid-cols-2 text-xs font-bold gap-y-3">
                  <p className="text-slate-400 uppercase text-[9px]">Receipt ID:</p><p className="text-right">{receipt.receiptNo}</p>
                  <p className="text-slate-400 uppercase text-[9px]">Guest:</p><p className="text-right uppercase">{receipt.guestName}</p>
                  <p className="text-slate-400 uppercase text-[9px]">Lockers:</p><p className="text-right">M:{receipt.maleLockers.length} / F:{receipt.femaleLockers.length}</p>
                  <p className="text-slate-400 uppercase text-[9px]">Costumes:</p><p className="text-right">M:{receipt.maleCostumes} / F:{receipt.femaleCostumes}</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                  <div>
                      <p className="text-[9px] font-black uppercase text-white/50 mb-1">Total Cash Recd</p>
                      <p className="text-3xl font-black">₹{receipt.totalCollected}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-emerald-400 mb-1">Refundable Amt</p>
                      <p className="text-xl font-black text-emerald-400">₹{receipt.refundableAmount}</p>
                  </div>
              </div>
              <button onClick={printReceipt} disabled={isSyncing} className="btn-resort w-full h-14 !bg-slate-900 !text-white shadow-xl">
                 {isSyncing ? 'Syncing Cloud Stock...' : 'Print & Release Assets'}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'return' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-10 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-xl animate-slide-up text-center">
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Guest Asset Return</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Enter receipt code suffix (e.g. 0005)</p>
          </div>
          <input placeholder="Last 4 Digits" className="input-premium text-center !bg-slate-900/50 !text-white !border-white/20 text-2xl font-black" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
          <button onClick={findReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-blue-600 !text-white text-sm shadow-xl">{isSyncing ? 'Searching...' : 'Locate Active Record'}</button>
          
          {returnReceipt && (
            <div className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 text-left shadow-2xl animate-slide-up border-4 border-emerald-500">
              <div className="flex justify-between items-center">
                  <h4 className="font-black text-lg uppercase">{returnReceipt.guestName}</h4>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">{returnReceipt.shift} Slot</span>
              </div>
              <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Lockers Returning:</span><span>{ [...returnReceipt.maleLockers, ...returnReceipt.femaleLockers].join(',') || 'None' }</span></div>
                  <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Costumes Returning:</span><span>{returnReceipt.maleCostumes + returnReceipt.femaleCostumes} Units</span></div>
                  <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-3"><span className="text-slate-600 uppercase text-[10px]">Cash Refund to Guest:</span><span className="text-emerald-600 text-xl font-black">₹{returnReceipt.refundableAmount}</span></div>
              </div>
              <button onClick={confirmReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-emerald-500 !text-slate-900 font-black shadow-xl">
                 {isSyncing ? 'Updating Inventory...' : 'Confirm Refund & Return Assets'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffPortal;
