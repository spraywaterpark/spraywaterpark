
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';
import { LOCKER_RULES, COSTUME_RULES } from '../constants';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(
    role === 'staff1' ? 'entry' : 'issue'
  );
  
  // Staff1 States (Unchanged)
  const [scannedTicket, setScannedTicket] = useState<Booking | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [manualId, setManualId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Staff2 Issuance States
  const [issuanceStep, setIssuanceStep] = useState<'form' | 'review' | 'paid'>('form');
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [selectedMLockers, setSelectedMLockers] = useState<number[]>([]);
  const [selectedFLockers, setSelectedFLockers] = useState<number[]>([]);
  const [mCostumes, setMCostumes] = useState(0);
  const [fCostumes, setFCostumes] = useState(0);
  const [issuedReceipt, setIssuedReceipt] = useState<LockerReceipt | null>(null);

  // Staff2 Return States
  const [activeRentals, setActiveRentals] = useState<LockerReceipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<LockerReceipt | null>(null);

  // Inventory Calculation
  const inventory = useMemo(() => {
    const active = activeRentals.filter(r => r.status === 'issued');
    const busyM = new Set(active.flatMap(r => r.maleLockers));
    const busyF = new Set(active.flatMap(r => r.femaleLockers));
    const issuedMCostumes = active.reduce((s, r) => s + r.maleCostumes, 0);
    const issuedFCostumes = active.reduce((s, r) => s + r.femaleCostumes, 0);

    return {
      busyM,
      busyF,
      remMCostumes: COSTUME_RULES.MALE_COSTUME_TOTAL - issuedMCostumes,
      remFCostumes: COSTUME_RULES.FEMALE_COSTUME_TOTAL - issuedFCostumes
    };
  }, [activeRentals]);

  const getISTInfo = () => {
    const d = new Date();
    const istStr = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istStr);
    return { todayStr: istDate.toLocaleDateString('en-CA'), currentHour: istDate.getHours() };
  };

  const refreshRentals = async () => {
    if (role === 'staff1') return;
    const data = await cloudSync.fetchRentals();
    if (data) setActiveRentals(data);
  };

  useEffect(() => { refreshRentals(); }, [mode]);

  // Handlers
  const toggleLocker = (num: number, gender: 'm' | 'f') => {
    if (gender === 'm') {
      if (inventory.busyM.has(num)) return;
      setSelectedMLockers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
    } else {
      if (inventory.busyF.has(num)) return;
      setSelectedFLockers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
    }
  };

  const calculateTotals = () => {
    const rent = (selectedMLockers.length * LOCKER_RULES.MALE_LOCKER_RENT) + 
                 (selectedFLockers.length * LOCKER_RULES.FEMALE_LOCKER_RENT) + 
                 (mCostumes * COSTUME_RULES.MALE_COSTUME_RENT) + 
                 (fCostumes * COSTUME_RULES.FEMALE_COSTUME_RENT);

    const deposit = (selectedMLockers.length * LOCKER_RULES.MALE_LOCKER_DEPOSIT) + 
                    (selectedFLockers.length * LOCKER_RULES.FEMALE_LOCKER_DEPOSIT) + 
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
      guestName, guestMobile, date: todayStr,
      shift: currentHour < 15 ? 'morning' : 'evening',
      maleLockers: selectedMLockers, femaleLockers: selectedFLockers,
      maleCostumes: mCostumes, femaleCostumes: fCostumes,
      rentAmount: rent, securityDeposit: deposit,
      totalCollected: total, refundableAmount: deposit,
      status: 'issued', createdAt: new Date().toISOString()
    };

    const success = await cloudSync.saveRental(receipt);
    if (success) {
      setIssuedReceipt(receipt);
      setIssuanceStep('form');
      setGuestName(''); setGuestMobile(''); setSelectedMLockers([]); setSelectedFLockers([]); setMCostumes(0); setFCostumes(0);
      refreshRentals();
    } else { alert("Sync Failed"); }
    setIsSyncing(false);
  };

  // UI Components
  const LockerGrid = ({ gender }: { gender: 'm' | 'f' }) => {
    const total = gender === 'm' ? LOCKER_RULES.MALE_LOCKERS_TOTAL : LOCKER_RULES.FEMALE_LOCKERS_TOTAL;
    const busySet = gender === 'm' ? inventory.busyM : inventory.busyF;
    const selected = gender === 'm' ? selectedMLockers : selectedFLockers;

    return (
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-[250px] overflow-y-auto p-2 bg-black/20 rounded-2xl custom-scrollbar">
        {Array.from({ length: total }, (_, i) => i + 1).map(num => {
          const isBusy = busySet.has(num);
          const isSelected = selected.includes(num);
          return (
            <button
              key={num}
              disabled={isBusy}
              onClick={() => toggleLocker(num, gender)}
              className={`aspect-square rounded-md text-[9px] font-black transition-all ${
                isBusy ? 'bg-red-500/40 text-white/20 cursor-not-allowed' :
                isSelected ? 'bg-emerald-500 text-white shadow-lg scale-110 z-10' :
                'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-3 text-white min-h-screen">
      {/* Navigation */}
      {(role === 'admin' || role === 'staff2' || !role) && (
        <div className="w-full max-w-md flex bg-white/10 rounded-full p-1 border border-white/10 mb-6">
            {role !== 'staff2' && <button onClick={() => setMode('entry')} className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase ${mode === 'entry' ? 'bg-blue-600' : 'text-white/40'}`}>Gate</button>}
            <button onClick={() => { setMode('issue'); setIssuanceStep('form'); setIssuedReceipt(null); }} className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase ${mode === 'issue' ? 'bg-emerald-600' : 'text-white/40'}`}>Issue</button>
            <button onClick={() => { setMode('return'); setSelectedReturn(null); }} className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase ${mode === 'return' ? 'bg-amber-600' : 'text-white/40'}`}>Return</button>
        </div>
      )}

      {/* Mode: Issue (Restored Visuals) */}
      {mode === 'issue' && !issuedReceipt && (
        <div className="w-full max-w-xl space-y-6">
           <div className="bg-slate-900/60 rounded-[2.5rem] p-6 sm:p-8 space-y-8 border border-white/10 shadow-2xl backdrop-blur-3xl animate-slide-up">
              <div className="flex justify-between items-center px-2">
                 <h3 className="text-xl font-black uppercase tracking-widest">
                    {issuanceStep === 'form' ? 'Locker Issuance' : 'Bill Preview'}
                 </h3>
                 <div className="flex gap-2">
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg text-center"><p className="text-[7px] font-black opacity-40 uppercase">M-Stock</p><p className="text-[10px] font-black text-blue-400">{inventory.remMCostumes}</p></div>
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg text-center"><p className="text-[7px] font-black opacity-40 uppercase">F-Stock</p><p className="text-[10px] font-black text-pink-400">{inventory.remFCostumes}</p></div>
                 </div>
              </div>

              {issuanceStep === 'form' && (
                <div className="space-y-6">
                  {/* Guest Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input placeholder="GUEST NAME" className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black uppercase text-xs" value={guestName} onChange={e=>setGuestName(e.target.value)} />
                    <input placeholder="MOBILE NUMBER" maxLength={10} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-xs" value={guestMobile} onChange={e=>setGuestMobile(e.target.value.replace(/\D/g,''))} />
                  </div>

                  {/* Locker Selection */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between px-2"><span className="text-[9px] font-black uppercase text-blue-400">Male Lockers ({selectedMLockers.length})</span><span className="text-[8px] opacity-40 uppercase">Select numbers below</span></div>
                      <LockerGrid gender="m" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between px-2"><span className="text-[9px] font-black uppercase text-pink-400">Female Lockers ({selectedFLockers.length})</span><span className="text-[8px] opacity-40 uppercase">Select numbers below</span></div>
                      <LockerGrid gender="f" />
                    </div>
                  </div>

                  {/* Costume Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-white/40 px-2 tracking-widest">Male Costumes</label>
                      <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 p-1">
                        <button onClick={()=>setMCostumes(Math.max(0, mCostumes-1))} className="w-10 h-10 rounded-xl bg-white/5 font-black">-</button>
                        <span className="flex-1 text-center font-black text-xs">{mCostumes}</span>
                        <button onClick={()=>setMCostumes(mCostumes+1)} className="w-10 h-10 rounded-xl bg-white/5 font-black">+</button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-white/40 px-2 tracking-widest">Female Costumes</label>
                      <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 p-1">
                        <button onClick={()=>setFCostumes(Math.max(0, fCostumes-1))} className="w-10 h-10 rounded-xl bg-white/5 font-black">-</button>
                        <span className="flex-1 text-center font-black text-xs">{fCostumes}</span>
                        <button onClick={()=>setFCostumes(fCostumes+1)} className="w-10 h-10 rounded-xl bg-white/5 font-black">+</button>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => { if(!guestName || !guestMobile) alert("Guest info needed"); else setIssuanceStep('review'); }} className="w-full bg-blue-600 h-16 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Review Selection & Bill</button>
                </div>
              )}

              {issuanceStep === 'review' && (
                <div className="space-y-8 animate-slide-up">
                   <div className="bg-white/5 p-6 rounded-3xl space-y-4 border border-white/10">
                      <div className="flex justify-between text-[11px] font-bold"><span>Total Rent</span><span className="text-white">₹{calculateTotals().rent}</span></div>
                      <div className="flex justify-between text-[11px] font-bold"><span>Security Deposit</span><span className="text-white">₹{calculateTotals().deposit}</span></div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                         <span className="text-[10px] font-black uppercase text-emerald-400">Total to Collect</span>
                         <span className="text-4xl font-black text-emerald-400">₹{calculateTotals().total}</span>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <button onClick={() => setIssuanceStep('paid')} className="w-full bg-emerald-600 h-16 rounded-2xl font-black uppercase text-xs">Guest Paid Cash</button>
                      <button onClick={() => setIssuanceStep('form')} className="w-full py-2 text-[9px] font-black uppercase text-white/40">Edit Selection</button>
                   </div>
                </div>
              )}

              {issuanceStep === 'paid' && (
                <div className="space-y-8 text-center animate-slide-up">
                   <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto"><i className="fas fa-money-check"></i></div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Payment Confirmed. Ready to Sync.</p>
                   <button onClick={handleFinalGenerate} disabled={isSyncing} className="w-full bg-white text-slate-900 h-20 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl">
                      {isSyncing ? 'Processing...' : 'Generate Official Receipt'}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Return Mode (Itemized Checklist) */}
      {mode === 'return' && (
        <div className="w-full max-w-md space-y-6">
           <div className="bg-slate-900/60 rounded-[2.5rem] p-6 space-y-6 border border-white/10 shadow-2xl backdrop-blur-xl">
              <h3 className="text-xl font-black uppercase text-center">Receipt Return</h3>
              <div className="flex flex-col gap-3">
                 <input placeholder="ENTER RECEIPT # OR MOBILE" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-black uppercase text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                 <button onClick={() => {
                   const r = activeRentals.find(x => x.status === 'issued' && (x.receiptNo === searchQuery.toUpperCase() || x.guestMobile === searchQuery));
                   if (r) setSelectedReturn(r); else alert("Receipt Not Found");
                 }} className="w-full bg-amber-500 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Load Details</button>
              </div>

              {selectedReturn && (
                <div className="bg-white text-slate-900 rounded-[2rem] p-6 space-y-6 shadow-2xl animate-slide-up">
                   <div className="space-y-1 text-center">
                      <p className="text-[9px] font-black uppercase text-slate-400">Collect Items from</p>
                      <h4 className="text-xl font-black uppercase">{selectedReturn.guestName}</h4>
                   </div>
                   <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 border-b pb-2">Checklist</p>
                      <div className="space-y-2 text-xs font-bold">
                         {selectedReturn.maleLockers.length > 0 && <div className="flex justify-between"><span>Male Lockers:</span><span className="text-blue-600">{selectedReturn.maleLockers.join(', ')}</span></div>}
                         {selectedReturn.femaleLockers.length > 0 && <div className="flex justify-between"><span>Female Lockers:</span><span className="text-pink-600">{selectedReturn.femaleLockers.join(', ')}</span></div>}
                         {selectedReturn.maleCostumes > 0 && <div className="flex justify-between"><span>Male Costumes:</span><span>{selectedReturn.maleCostumes}</span></div>}
                         {selectedReturn.femaleCostumes > 0 && <div className="flex justify-between"><span>Female Costumes:</span><span>{selectedReturn.femaleCostumes}</span></div>}
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                         <span className="text-[10px] font-black uppercase text-emerald-600">Refund Security</span>
                         <span className="text-3xl font-black text-emerald-600">₹{selectedReturn.refundableAmount}</span>
                      </div>
                   </div>
                   <button onClick={() => {
                     if (window.confirm("Refund ₹" + selectedReturn.refundableAmount + "?")) {
                       cloudSync.updateRental({...selectedReturn, status: 'returned'}).then(() => {
                         alert("Return Successful"); setSelectedReturn(null); setSearchQuery(''); refreshRentals();
                       });
                     }
                   }} className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black uppercase text-xs">Confirm Return & Refund</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Mode: Gate (staff1) - Preserved exactly as requested */}
      {mode === 'entry' && (
        <div className="w-full max-w-md space-y-6">
           <div className="bg-white/10 rounded-[2.5rem] p-6 text-center space-y-6 border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tight">Gate Entry</h3>
              <div className="space-y-3">
                <input type="text" placeholder="SAR/XXXXXX-XXX" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black uppercase text-sm" value={manualId} onChange={e => setManualId(e.target.value)} />
                <button onClick={() => {
                  fetch(`/api/booking?type=ticket_details&id=${manualId.toUpperCase()}`).then(r=>r.json()).then(d=>{ if(d.success) setScannedTicket(d.booking); else alert("NOT FOUND"); });
                }} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-[11px]">Search Ticket</button>
              </div>
              {!isScanning && !scannedTicket && <button onClick={()=>{ setIsScanning(true); }} className="w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-[2rem] font-black uppercase">Open Scanner</button>}
              {scannedTicket && (
                <div className="bg-white text-slate-900 rounded-[2rem] p-6 text-left space-y-4 animate-slide-up">
                   <h4 className="font-black text-lg">{scannedTicket.id}</h4>
                   <p className="text-xs font-bold uppercase">{scannedTicket.name} — {scannedTicket.adults + scannedTicket.kids} Pax</p>
                   <button onClick={() => {
                     fetch('/api/booking?type=checkin', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ticketId: scannedTicket.id}) }).then(()=> { alert("CONFIRMED"); setScannedTicket(null); });
                   }} className="w-full bg-blue-600 text-white h-14 rounded-2xl font-black uppercase text-xs">Allow Entry</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Success View */}
      {issuedReceipt && (
        <div className="w-full max-w-md animate-slide-up">
           <div className="bg-white text-slate-900 rounded-[3rem] p-8 space-y-8 shadow-2xl border border-slate-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl"><i className="fas fa-check"></i></div>
              <h3 className="text-2xl font-black uppercase">Receipt Created</h3>
              <div className="space-y-3 text-left border-y py-4">
                 <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>No</span><span>{issuedReceipt.receiptNo}</span></div>
                 {issuedReceipt.maleLockers.length > 0 && <div className="flex justify-between text-xs font-bold text-blue-600 uppercase"><span>M-Lockers</span><span>{issuedReceipt.maleLockers.join(',')}</span></div>}
                 {issuedReceipt.femaleLockers.length > 0 && <div className="flex justify-between text-xs font-bold text-pink-600 uppercase"><span>F-Lockers</span><span>{issuedReceipt.femaleLockers.join(',')}</span></div>}
              </div>
              <button onClick={()=>setIssuedReceipt(null)} className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest">Next Guest</button>
           </div>
        </div>
      )}
    </div>
  );
};
export default StaffPortal;
