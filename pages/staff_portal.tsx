
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';
import { COSTUME_RULES, LOCKER_RULES } from '../constants';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(role === 'staff1' ? 'entry' : 'issue');
  const [scannedTicket, setScannedTicket] = useState<Booking | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [shift, setShift] = useState<ShiftType>('morning');
  const [maleLockers, setMaleLockers] = useState<number[]>([]);
  const [femaleLockers, setFemaleLockers] = useState<number[]>([]);
  const [maleCostumes, setMaleCostumes] = useState(0);
  const [femaleCostumes, setFemaleCostumes] = useState(0);
  const [receipt, setReceipt] = useState<LockerReceipt | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [allRentals, setAllRentals] = useState<LockerReceipt[]>([]);

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

  const refreshActive = async () => {
    const rentals = await cloudSync.fetchRentals();
    if (rentals) setAllRentals(rentals);
  };

  useEffect(() => {
    refreshActive();
    const interval = setInterval(refreshActive, 15000); 
    return () => clearInterval(interval);
  }, [mode]);

  const startScanner = () => {
    setScannedTicket(null);
    setIsScanning(true);
    setTimeout(() => {
      const html5QrCode = new (window as any).Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 }, 
        (decoded: string) => { 
          // Stop scanner immediately on successful scan to prevent hanging
          stopScanner().then(() => fetchTicketDetails(decoded)); 
        }, 
        () => {}
      ).catch(err => {
        console.error("Scanner Error", err);
        setIsScanning(false);
      });
    }, 200);
  };

  const stopScanner = async () => { 
    if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            const container = document.getElementById("reader");
            if (container) container.innerHTML = ""; // Clear the element
            scannerRef.current = null;
        } catch (e) {
            console.warn("Scanner stop error", e);
        }
    }
    setIsScanning(false); 
  };

  const fetchTicketDetails = async (id: string) => {
    setIsSyncing(true);
    const cleanId = id.trim().toUpperCase();
    try {
      const res = await fetch(`/api/booking?type=ticket_details&id=${cleanId}`);
      if (!res.ok) throw new Error("Connection failed");
      const data = await res.json();
      if (data.success) {
        setScannedTicket(data.booking);
      } else {
        alert("TICKET NOT FOUND");
      }
    } catch (e) { 
      alert("ERROR: Check Internet Connection"); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const getEntryValidation = (ticket: Booking) => {
    const { todayStr, currentHour } = getISTInfo();
    
    // 1. Check if used
    if (ticket.status === 'checked-in') {
        return { isValid: false, message: "TICKET ALREADY USED", color: "text-red-600" };
    }

    // 2. Check Date
    if (ticket.date < todayStr) {
        return { isValid: false, message: "TICKET EXPIRED", color: "text-red-600" };
    }
    if (ticket.date > todayStr) {
        return { isValid: false, message: "PRE-ENTRY NOT ALLOWED (For " + ticket.date + ")", color: "text-amber-600" };
    }

    // 3. Check Slot on Same Day
    const isMorning = ticket.time.toLowerCase().includes('morning');
    if (isMorning) {
        if (currentHour < 9) return { isValid: false, message: "PRE-ENTRY NOT ALLOWED (Opens at 10 AM)", color: "text-amber-600" };
        if (currentHour >= 14) return { isValid: false, message: "TICKET EXPIRED (Morning slot over)", color: "text-red-600" };
    } else {
        if (currentHour < 15) return { isValid: false, message: "PRE-ENTRY NOT ALLOWED (Opens at 4 PM)", color: "text-amber-600" };
        if (currentHour >= 21) return { isValid: false, message: "TICKET EXPIRED (Evening slot over)", color: "text-red-600" };
    }

    return { isValid: true, message: "TICKET VALID", color: "text-emerald-600" };
  };

  const handleConfirmEntry = async () => {
    if (!scannedTicket) return;
    const v = getEntryValidation(scannedTicket);
    if (!v.isValid) return alert(v.message);
    
    setIsSyncing(true);
    try {
        const res = await fetch('/api/booking?type=checkin', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ticketId: scannedTicket.id }) 
        });
        const data = await res.json();
        
        if (data.success) {
            // SUCCESS: Send Welcome Message (uses 'welcome' template from your screenshot)
            notificationService.sendWelcomeMessage(scannedTicket)
                .catch(e => console.warn("Welcome Message Failed", e));
            
            alert("SUCCESS: Entry Confirmed! Welcome message sent.");
            setScannedTicket(null);
        } else {
            alert(data.details || "Server check-in failed");
        }
    } catch (e) {
        alert("SYNC ERROR: Ticket could not be verified.");
    } finally {
        setIsSyncing(false);
    }
  };

  // ... rest of issue/return logic remains same
  const generateReceipt = () => {
    const { todayStr, currentHour } = getISTInfo();
    if (!guestName) return alert("Guest Name is required.");
    const countToday = allRentals.filter(r => r.date === todayStr && r.shift === shift).length + 1;
    const datePart = todayStr.replace(/-/g, '').slice(2);
    const receiptNo = `SWP/${datePart}${shift==='morning'?'1':'2'}-${String(countToday).padStart(3,'0')}`;
    setReceipt({
      receiptNo, guestName, guestMobile, date: todayStr, shift, maleLockers, femaleLockers,
      maleCostumes, femaleCostumes, rentAmount: 0, securityDeposit: 0, totalCollected: 0,
      refundableAmount: 0, status: 'issued', createdAt: new Date().toISOString()
    });
  };

  const confirmAndPrint = async () => {
    if (!receipt) return;
    setIsSyncing(true);
    try {
        const success = await cloudSync.saveRental(receipt);
        if (success) { window.print(); setReceipt(null); refreshActive(); }
        else { alert("Sync Failed."); }
    } finally { setIsSyncing(false); }
  };

  return (
    <div className="w-full flex flex-col items-center py-6 text-white min-h-[90vh]">
      <div className="w-full max-w-5xl flex justify-between items-center mb-10 px-4 no-print">
          <div className="flex bg-white/10 rounded-full p-1 border border-white/10">
            {['entry', 'issue', 'return'].map(m => (
              <button key={m} onClick={() => { stopScanner(); setMode(m as any); }} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest ${mode === m ? 'bg-blue-600' : 'text-white/40'}`}>{m}</button>
            ))}
          </div>
          {isSyncing && <div className="text-[10px] font-black uppercase text-blue-400 animate-pulse">Syncing...</div>}
      </div>

      {mode === 'entry' && (
        <div className="w-full max-w-2xl px-4 no-print">
          <div className="bg-white/10 rounded-[3rem] p-12 text-center space-y-8 backdrop-blur-3xl border border-white/10 shadow-2xl">
             <h3 className="text-3xl font-black uppercase tracking-tighter">Gate Control</h3>
             
             {!isScanning && !scannedTicket && (
               <button onClick={startScanner} className="w-full h-40 bg-white/5 border-2 border-dashed border-white/20 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4">
                 <i className="fas fa-camera text-4xl"></i>
                 <span>Tap to Scan Ticket</span>
               </button>
             )}
             
             {isScanning && (
               <div className="space-y-4">
                  <div id="reader" className="w-full rounded-[2.5rem] overflow-hidden border-4 border-blue-600"></div>
                  <button onClick={stopScanner} className="bg-red-600/20 text-red-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Cancel Scanner</button>
               </div>
             )}

             {scannedTicket && (
               <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 text-left space-y-8 shadow-2xl animate-slide-up">
                 {(() => {
                    const validation = getEntryValidation(scannedTicket);
                    return (
                      <>
                        <div className="flex justify-between items-start">
                           <div>
                               <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-1">Pass ID</p>
                               <h4 className="text-4xl font-black text-slate-900">{scannedTicket.id}</h4>
                           </div>
                           <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase ${validation.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                               {validation.message}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 border-y border-slate-100 py-6">
                           <div><p className="text-[10px] uppercase text-slate-400 font-black mb-1">Guest</p><p className="font-black text-lg">{scannedTicket.name}</p></div>
                           <div><p className="text-[10px] uppercase text-slate-400 font-black mb-1">Slot</p><p className="font-black text-lg">{scannedTicket.time.split(':')[0]}</p></div>
                           <div><p className="text-[10px] uppercase text-slate-400 font-black mb-1">Date</p><p className="font-black text-lg">{scannedTicket.date}</p></div>
                           <div><p className="text-[10px] uppercase text-slate-400 font-black mb-1">Total Persons</p><p className="font-black text-lg">{scannedTicket.adults + scannedTicket.kids}</p></div>
                        </div>

                        <div className="flex flex-col gap-3">
                           {validation.isValid && (
                             <button onClick={handleConfirmEntry} disabled={isSyncing} className="w-full h-20 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-200 transition-all">
                                {isSyncing ? 'CONFIRMING...' : 'ALLOW ENTRY'}
                             </button>
                           )}
                           <button onClick={startScanner} className="w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">Scan Another Ticket</button>
                        </div>
                      </>
                    );
                 })()}
               </div>
             )}
          </div>
        </div>
      )}

      {/* ISSUE MODE remains for staff use */}
      {mode === 'issue' && (
        <div className="bg-white/5 rounded-[3rem] p-14 w-full max-w-6xl space-y-12 no-print border border-white/5">
           <div className="grid md:grid-cols-3 gap-6">
            <input className="input-premium !bg-slate-900/50 !text-white border-white/10" placeholder="Guest Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            <input className="input-premium !bg-slate-900/50 !text-white border-white/10" placeholder="Mobile Number" value={guestMobile} onChange={e => setGuestMobile(e.target.value)} />
            <select className="input-premium !bg-slate-900/50 !text-white border-white/10" value={shift} onChange={e => setShift(e.target.value as any)}>
                <option value="morning">Morning Shift</option><option value="evening">Evening Shift</option>
            </select>
          </div>
          <button onClick={generateReceipt} className="w-full h-20 bg-emerald-500 text-slate-900 font-black uppercase text-lg rounded-3xl">Generate Rental Bill</button>
          {receipt && <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[2000]"><div className="bg-white p-10 rounded-[3rem] text-slate-900 w-full max-w-md space-y-8"><h2 className="text-2xl font-black uppercase tracking-tighter text-center">Confirm Asset Issue</h2><div className="bg-slate-50 p-6 rounded-2xl"><p className="text-xs font-black uppercase text-slate-400">Guest</p><p className="font-black text-xl">{receipt.guestName}</p></div><button onClick={confirmAndPrint} className="w-full bg-emerald-500 py-6 rounded-2xl font-black uppercase text-white shadow-xl">Confirm & Print</button><button onClick={() => setReceipt(null)} className="w-full py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button></div></div>}
        </div>
      )}
    </div>
  );
};
export default StaffPortal;
