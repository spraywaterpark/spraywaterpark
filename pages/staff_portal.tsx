
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
  const [costumeStock, setCostumeStock] = useState({ 
    male: COSTUME_RULES.MALE_COSTUME_TOTAL, 
    female: COSTUME_RULES.FEMALE_COSTUME_TOTAL 
  });
  
  // Local cache for recently returned lockers
  const [returnedLockersCache, setReturnedLockersCache] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });

  const refreshActive = async () => {
    if (isSyncing) return;

    const rentals = await cloudSync.fetchRentals();
    if (rentals) {
      // 1. Get ONLY active 'issued' records
      const active = rentals.filter(r => r.status === 'issued' && r.receiptNo);
      
      // 2. Process Busy Lockers
      let cloudMaleBusy = active.flatMap(r => Array.isArray(r.maleLockers) ? r.maleLockers : []);
      let cloudFemaleBusy = active.flatMap(r => Array.isArray(r.femaleLockers) ? r.femaleLockers : []);

      setActiveLockers({
        male: cloudMaleBusy.filter(n => !returnedLockersCache.male.includes(n)),
        female: cloudFemaleBusy.filter(n => !returnedLockersCache.female.includes(n))
      });

      // 3. IDENTICAL LOGIC FOR MALE AND FEMALE COSTUMES
      // Directly copy the female logic that works perfectly
      const issuedMale = active.reduce((sum, r) => sum + (Number(r.maleCostumes) || 0), 0);
      const issuedFemale = active.reduce((sum, r) => sum + (Number(r.femaleCostumes) || 0), 0);

      setCostumeStock({
        male: Math.max(0, COSTUME_RULES.MALE_COSTUME_TOTAL - issuedMale),
        female: Math.max(0, COSTUME_RULES.FEMALE_COSTUME_TOTAL - issuedFemale)
      });
    }

    // Handle shift reset trigger from admin
    const settings = await cloudSync.fetchSettings();
    if (settings?.lastShiftReset) {
      const localLastReset = localStorage.getItem('swp_last_shift_reset');
      if (settings.lastShiftReset !== localLastReset) {
        localStorage.setItem('swp_last_shift_reset', settings.lastShiftReset);
        const d = new Date();
        const key = `swp_rc_${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        localStorage.setItem(key, '0');
      }
    }
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 10000); // More frequent sync
    return () => clearInterval(interval);
  }, [mode, returnedLockersCache]);

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
      return alert("Select at least one asset");
    }

    const mQty = Number(maleCostumes) || 0;
    const fQty = Number(femaleCostumes) || 0;

    // Direct check against state
    if (mQty > costumeStock.male) return alert(`Not enough Male Costumes! Left: ${costumeStock.male}`);
    if (fQty > costumeStock.female) return alert(`Not enough Female Costumes! Left: ${costumeStock.female}`);

    const lockersCount = maleLockers.length + femaleLockers.length;
    const rent = (lockersCount * 100) + (mQty * 50) + (fQty * 100);
    const deposit = (lockersCount * 200) + (mQty * 50) + (fQty * 100);

    setReceipt({
      receiptNo: generateReceiptNo(),
      guestName,
      guestMobile,
      date: new Date().toISOString().split('T')[0],
      shift,
      maleLockers,
      femaleLockers,
      maleCostumes: mQty,
      femaleCostumes: fQty,
      rentAmount: rent,
      securityDeposit: deposit,
      totalCollected: rent + deposit,
      refundableAmount: deposit,
      status: 'issued',
      createdAt: new Date().toISOString()
    });
  };

  const printReceipt = async () => {
    if (!receipt || !printRef.current) return;
    setIsSyncing(true);

    const success = await cloudSync.saveRental(receipt);
    if (!success) {
      alert("Error: Cloud Sync Failed!");
      setIsSyncing(false);
      return;
    }

    // Print
    const win = window.open('', '', 'width=800,height=900');
    if (win) {
      win.document.write(`<html><head><title>Receipt</title></head><body>${printRef.current.innerHTML}</body></html>`);
      win.document.close();
      win.print();
      win.close();
    }
    
    // Immediate state update for snappy UI
    setActiveLockers(prev => ({
      male: [...prev.male, ...receipt.maleLockers],
      female: [...prev.female, ...receipt.femaleLockers]
    }));
    
    setCostumeStock(prev => ({
      male: prev.male - receipt.maleCostumes,
      female: prev.female - receipt.femaleCostumes
    }));

    setTimeout(refreshActive, 1000); 
    setIsSyncing(false);
    resetForm();
  };

  const findReturn = async () => {
    if (!searchCode) return alert("Enter last 4 digits");
    setIsSyncing(true);
    const all = await cloudSync.fetchRentals();
    const found = all?.find(r => r.receiptNo.endsWith(searchCode) && r.status === 'issued');
    setIsSyncing(false);
    if (!found) return alert("Active record not found.");
    setReturnReceipt(found);
  };

  const confirmReturn = async () => {
    if (!returnReceipt) return;
    setIsSyncing(true);
    const updated = { ...returnReceipt, status: 'returned' as const, returnedAt: new Date().toISOString() };
    const success = await cloudSync.updateRental(updated);
    
    if (success) {
      // Mark as returned in local cache to keep colors correct until cloud syncs
      setReturnedLockersCache(prev => ({
        male: [...prev.male, ...returnReceipt.maleLockers],
        female: [...prev.female, ...returnReceipt.femaleLockers]
      }));
      
      // Update local stock immediately
      setCostumeStock(prev => ({
        male: prev.male + returnReceipt.maleCostumes,
        female: prev.female + returnReceipt.femaleCostumes
      }));

      alert("Return Successful!");
      setReturnReceipt(null);
      setSearchCode('');
      
      // Clear cache after a minute to allow background sync to take over
      setTimeout(() => {
        setReturnedLockersCache(prev => ({
          male: prev.male.filter(n => !returnReceipt.maleLockers.includes(n)),
          female: prev.female.filter(n => !returnReceipt.femaleLockers.includes(n))
        }));
      }, 60000);
      
      await refreshActive();
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
          <div className="flex bg-white/10 rounded-full p-1 border border-white/10">
            <button onClick={() => setMode('issue')} className={`px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest ${mode === 'issue' ? 'bg-emerald-500 text-slate-900' : 'text-white/70'}`}>ISSUE</button>
            <button onClick={() => setMode('return')} className={`px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest ${mode === 'return' ? 'bg-emerald-500 text-slate-900' : 'text-white/70'}`}>RETURN</button>
          </div>
          <button onClick={refreshActive} disabled={isSyncing} className="bg-white/10 p-3 rounded-full border border-white/10">
             <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i>
          </button>
      </div>

      {mode === 'issue' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-8 md:p-12 w-full max-w-5xl space-y-10 shadow-2xl backdrop-blur-xl animate-slide-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/10 text-center">
              <div className="bg-slate-900/40 p-4 rounded-2xl">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">M-Lockers</p>
                  <p className="text-xl font-black text-blue-400">{60 - activeLockers.male.length}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">F-Lockers</p>
                  <p className="text-xl font-black text-pink-400">{60 - activeLockers.female.length}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">M-Costume</p>
                  <p className={`text-xl font-black ${costumeStock.male < 10 ? 'text-red-500' : 'text-emerald-400'}`}>{costumeStock.male}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-2xl">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">F-Costume</p>
                  <p className={`text-xl font-black ${costumeStock.female < 10 ? 'text-red-500' : 'text-emerald-400'}`}>{costumeStock.female}</p>
              </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Guest Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Mobile Number" value={guestMobile} onChange={e => setGuestMobile(e.target.value.replace(/\D/g,''))} />
          </div>

          <div className="flex gap-4">
            <button onClick={() => setShift('morning')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase border ${shift === 'morning' ? 'bg-white text-slate-900' : 'bg-white/5'}`}>Morning</button>
            <button onClick={() => setShift('evening')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase border ${shift === 'evening' ? 'bg-white text-slate-900' : 'bg-white/5'}`}>Evening</button>
          </div>

          <div className="space-y-6">
            <p className="font-black text-xs uppercase tracking-widest text-blue-400">Male Lockers</p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">{renderLockers('male')}</div>
          </div>

          <div className="space-y-6">
            <p className="font-black text-xs uppercase tracking-widest text-pink-400">Female Lockers</p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">{renderLockers('female')}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40">Male Costume Qty</label>
              <input type="number" min={0} className="input-premium !bg-slate-900/50 !text-white" value={maleCostumes} onChange={e => setMaleCostumes(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40">Female Costume Qty</label>
              <input type="number" min={0} className="input-premium !bg-slate-900/50 !text-white" value={femaleCostumes} onChange={e => setFemaleCostumes(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
          </div>

          <button onClick={generateReceipt} className="btn-resort w-full h-16 !bg-emerald-500 !text-slate-900 text-sm font-black uppercase">Generate Receipt</button>
          
          {receipt && (
            <div ref={printRef} className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 shadow-2xl border-4 border-slate-900">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="font-black text-xl uppercase">Spray Aqua Resort</h2>
                  <p className="text-[9px] font-bold uppercase tracking-widest">Inventory Voucher</p>
              </div>
              <div className="grid grid-cols-2 text-xs font-bold gap-y-2">
                  <p>Receipt ID:</p><p className="text-right">{receipt.receiptNo}</p>
                  <p>Guest:</p><p className="text-right">{receipt.guestName}</p>
                  <p>Lockers:</p><p className="text-right">M:{receipt.maleLockers.length} / F:{receipt.femaleLockers.length}</p>
                  <p>Costumes:</p><p className="text-right">M:{receipt.maleCostumes} / F:{receipt.femaleCostumes}</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                  <div><p className="text-[9px] font-black uppercase opacity-50">Collected</p><p className="text-2xl font-black">₹{receipt.totalCollected}</p></div>
                  <div className="text-right"><p className="text-[9px] font-black uppercase opacity-50">Refundable</p><p className="text-lg font-black text-emerald-400">₹{receipt.refundableAmount}</p></div>
              </div>
              <button onClick={printReceipt} disabled={isSyncing} className="btn-resort w-full h-14 !bg-slate-900 !text-white">{isSyncing ? 'Syncing...' : 'Print & Confirm'}</button>
            </div>
          )}
        </div>
      )}

      {mode === 'return' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-10 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-xl animate-slide-up text-center">
          <input placeholder="Receipt Last 4 Digits" className="input-premium text-center !bg-slate-900/50 !text-white text-2xl font-black" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
          <button onClick={findReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-blue-600 !text-white text-sm">{isSyncing ? 'Searching...' : 'Search Receipt'}</button>
          
          {returnReceipt && (
            <div className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 text-left shadow-2xl border-4 border-emerald-500">
              <h4 className="font-black text-lg uppercase">{returnReceipt.guestName}</h4>
              <div className="space-y-3 bg-slate-50 p-5 rounded-xl text-xs font-bold">
                  <div className="flex justify-between"><span>Lockers:</span><span>{ [...returnReceipt.maleLockers, ...returnReceipt.femaleLockers].join(',') || 'None' }</span></div>
                  <div className="flex justify-between"><span>Costumes:</span><span>M:{returnReceipt.maleCostumes} F:{returnReceipt.femaleCostumes}</span></div>
                  <div className="flex justify-between pt-3 border-t text-emerald-600 font-black text-lg"><span>Refund:</span><span>₹{returnReceipt.refundableAmount}</span></div>
              </div>
              <button onClick={confirmReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-emerald-500 !text-slate-900 font-black uppercase">Complete Return</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffPortal;
