
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, AdminSettings } from '../types';
import { cloudSync } from '../services/cloud_sync';

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
  const [activeLockers, setActiveLockers] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });

  const refreshActive = async () => {
    setIsSyncing(true);
    const rentals = await cloudSync.fetchRentals();
    if (rentals) {
      const active = rentals.filter(r => r.status === 'issued');
      setActiveLockers({
        male: active.flatMap(r => r.maleLockers),
        female: active.flatMap(r => r.femaleLockers)
      });
    }

    // Check for shift reset to restart receipt count
    const settings = await cloudSync.fetchSettings();
    if (settings?.lastShiftReset) {
      const localLastReset = localStorage.getItem('swp_last_shift_reset');
      if (settings.lastShiftReset !== localLastReset) {
        // Shift has been reset by Admin!
        localStorage.setItem('swp_last_shift_reset', settings.lastShiftReset);
        const d = new Date();
        const key = `swp_rc_${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        localStorage.setItem(key, '0'); // Reset counter
        console.log("Shift reset detected. Receipt counter set to 0001.");
      }
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 20000); // Polling for updates
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

    const lockers = maleLockers.length + femaleLockers.length;
    const rent = lockers * 100 + maleCostumes * 50 + femaleCostumes * 100;
    const deposit = lockers * 200 + maleCostumes * 50 + femaleCostumes * 100;

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
      alert("Cloud Sync Failed. Check Connection.");
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
    
    await refreshActive(); 
    setIsSyncing(false);
    resetForm();
  };

  const findReturn = async () => {
    setIsSyncing(true);
    const all = await cloudSync.fetchRentals();
    const found = all?.find(r => r.receiptNo.endsWith(searchCode) && r.status === 'issued');
    setIsSyncing(false);
    
    if (!found) return alert("Receipt not found or already returned");
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
      alert("Refund Done! Assets are now back in stock.");
      setReturnReceipt(null);
      setSearchCode('');
      await refreshActive();
    } else {
      alert("Update failed. Please try again.");
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
            <button onClick={() => setMode('issue')} className={`px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'issue' ? 'bg-emerald-500 text-slate-900' : 'text-white/70 hover:text-white'}`}>ISSUE</button>
            <button onClick={() => setMode('return')} className={`px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'return' ? 'bg-emerald-500 text-slate-900' : 'text-white/70 hover:text-white'}`}>RETURN</button>
          </div>
          
          <button onClick={refreshActive} disabled={isSyncing} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all border border-white/10">
             <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i>
          </button>
      </div>

      {mode === 'issue' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-8 md:p-12 w-full max-w-5xl space-y-10 shadow-2xl backdrop-blur-xl animate-slide-up">
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
            <button onClick={() => setShift('morning')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${shift === 'morning' ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white border-white/10'}`}>Morning Slot</button>
            <button onClick={() => setShift('evening')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${shift === 'evening' ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white border-white/10'}`}>Evening Slot</button>
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
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Male Costume Qty</label>
              <input type="number" min={0} className="input-premium !bg-slate-900/50 !text-white !border-white/20" value={maleCostumes} onChange={e => setMaleCostumes(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] ml-1">Female Costume Qty</label>
              <input type="number" min={0} className="input-premium !bg-slate-900/50 !text-white !border-white/20" value={femaleCostumes} onChange={e => setFemaleCostumes(+e.target.value)} />
            </div>
          </div>

          <button onClick={generateReceipt} className="btn-resort w-full h-16 shadow-2xl !bg-emerald-500 !text-slate-900 text-sm">Review & Generate Receipt</button>
          
          {receipt && (
            <div ref={printRef} className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 shadow-2xl border-4 border-slate-900 animate-slide-up">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="font-black text-2xl uppercase tracking-tighter">Spray Aqua Resort</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500">Rental Receipt</p>
              </div>
              <div className="grid grid-cols-2 text-xs font-bold gap-y-3">
                  <p className="text-slate-400 uppercase text-[9px]">Receipt No:</p><p className="text-right">{receipt.receiptNo}</p>
                  <p className="text-slate-400 uppercase text-[9px]">Guest Name:</p><p className="text-right uppercase">{receipt.guestName}</p>
                  <p className="text-slate-400 uppercase text-[9px]">Male Lockers:</p><p className="text-right">{receipt.maleLockers.join(', ') || 'N/A'}</p>
                  <p className="text-slate-400 uppercase text-[9px]">Female Lockers:</p><p className="text-right">{receipt.femaleLockers.join(', ') || 'N/A'}</p>
                  <p className="text-slate-400 uppercase text-[9px]">Costumes Issued:</p><p className="text-right">{receipt.maleCostumes + receipt.femaleCostumes} Units</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                  <div>
                      <p className="text-[9px] font-black uppercase text-white/50 mb-1">Total Payable</p>
                      <p className="text-3xl font-black">₹{receipt.totalCollected}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-emerald-400 mb-1">Refundable Security</p>
                      <p className="text-xl font-black text-emerald-400">₹{receipt.refundableAmount}</p>
                  </div>
              </div>
              <button onClick={printReceipt} disabled={isSyncing} className="btn-resort w-full h-14 !bg-slate-900 !text-white shadow-xl">
                 {isSyncing ? 'Processing Cloud...' : 'Print & Handover Receipt'}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'return' && (
        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-10 w-full max-w-xl space-y-8 shadow-2xl backdrop-blur-xl animate-slide-up text-center">
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Asset Return</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Enter the last 4 digits of the receipt code</p>
          </div>
          <input placeholder="Ex: 0042" className="input-premium text-center !bg-slate-900/50 !text-white !border-white/20 text-2xl font-black" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
          <button onClick={findReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-blue-600 !text-white text-sm shadow-xl">{isSyncing ? 'Searching...' : 'Locate Receipt'}</button>
          
          {returnReceipt && (
            <div className="bg-white text-slate-900 rounded-[2rem] p-8 space-y-6 text-left shadow-2xl animate-slide-up border-4 border-emerald-500">
              <div className="flex justify-between items-center">
                  <h4 className="font-black text-lg uppercase">{returnReceipt.guestName}</h4>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">Issued: {new Date(returnReceipt.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Male Lockers:</span><span>{returnReceipt.maleLockers.join(', ') || '-'}</span></div>
                  <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Female Lockers:</span><span>{returnReceipt.femaleLockers.join(', ') || '-'}</span></div>
                  <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-3"><span className="text-slate-600 uppercase text-[10px]">Security Refund Due:</span><span className="text-emerald-600 text-xl font-black">₹{returnReceipt.refundableAmount}</span></div>
              </div>
              <button onClick={confirmReturn} disabled={isSyncing} className="btn-resort w-full h-16 !bg-emerald-500 !text-slate-900 font-black shadow-xl">
                 {isSyncing ? 'Updating Inventory...' : 'Confirm Return & Refund Done'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffPortal;
