
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(role === 'staff1' ? 'entry' : 'issue');
  const [scannedTicket, setScannedTicket] = useState<Booking | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [manualId, setManualId] = useState('');
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
    const interval = setInterval(refreshActive, 20000); 
    return () => clearInterval(interval);
  }, [mode]);

  const startScanner = () => {
    setScannedTicket(null);
    setIsScanning(true);
    // Give DOM a moment to render the #reader div
    setTimeout(() => {
      try {
        const html5QrCode = new (window as any).Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        const config = { fps: 15, qrbox: { width: 250, height: 250 } };
        
        html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decoded: string) => { 
            stopScanner().then(() => fetchTicketDetails(decoded)); 
          }, 
          () => {} // Ignored for noise
        ).catch(err => {
          console.error("Scanner start error:", err);
          alert("Camera access failed. Please check permissions.");
          setIsScanning(false);
        });
      } catch (e) {
        console.error("Scanner Init Fail", e);
        setIsScanning(false);
      }
    }, 300);
  };

  const stopScanner = async () => { 
    if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            const container = document.getElementById("reader");
            if (container) container.innerHTML = ""; 
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
      if (!res.ok) {
        if (res.status === 404) alert("TICKET NOT FOUND");
        else alert("Sync error. Try manual ID.");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setScannedTicket(data.booking);
        setManualId('');
      } else {
        alert("TICKET NOT FOUND");
      }
    } catch (e) { 
      alert("ERROR: Check Connection"); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const getEntryValidation = (ticket: Booking) => {
    const { todayStr, currentHour } = getISTInfo();
    
    if (ticket.status === 'checked-in') {
        return { isValid: false, message: "TICKET ALREADY USED", color: "text-red-600", bg: "bg-red-50" };
    }

    if (ticket.date < todayStr) {
        return { isValid: false, message: "TICKET EXPIRED", color: "text-red-600", bg: "bg-red-50" };
    }
    
    if (ticket.date > todayStr) {
        return { isValid: false, message: "PRE-ENTRY NOT ALLOWED", sub: "Ticket for: " + ticket.date, color: "text-amber-600", bg: "bg-amber-50" };
    }

    // Slot validation for current day
    const isMorning = ticket.time.toLowerCase().includes('morning');
    if (isMorning) {
        if (currentHour < 9) return { isValid: false, message: "PRE-ENTRY NOT ALLOWED", sub: "Opens at 10 AM", color: "text-amber-600", bg: "bg-amber-50" };
        if (currentHour >= 14) return { isValid: false, message: "TICKET EXPIRED", sub: "Morning slot over", color: "text-red-600", bg: "bg-red-50" };
    } else {
        if (currentHour < 15) return { isValid: false, message: "PRE-ENTRY NOT ALLOWED", sub: "Opens at 4 PM", color: "text-amber-600", bg: "bg-amber-50" };
        if (currentHour >= 21) return { isValid: false, message: "TICKET EXPIRED", sub: "Evening slot over", color: "text-red-600", bg: "bg-red-50" };
    }

    return { isValid: true, message: "TICKET VALID", color: "text-emerald-600", bg: "bg-emerald-50" };
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
            // Trigger Welcome Notification
            notificationService.sendWelcomeMessage(scannedTicket)
                .catch(err => console.error("Notification Error:", err));
            
            alert("ENTRY CONFIRMED!\nWelcome message sent to guest.");
            setScannedTicket(null);
        } else {
            alert(data.details || "Server error.");
        }
    } catch (e) {
        alert("Network error. Try again.");
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 text-white min-h-[90vh]">
      {/* Tab Switcher */}
      <div className="w-full max-w-xl flex justify-between items-center mb-8 no-print">
          <div className="flex bg-white/10 rounded-full p-1 border border-white/10 w-full">
            {['entry', 'issue', 'return'].map(m => (
              <button 
                key={m} 
                onClick={() => { stopScanner(); setMode(m as any); setScannedTicket(null); }} 
                className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${mode === m ? 'bg-blue-600 shadow-lg' : 'text-white/40'}`}
              >
                {m}
              </button>
            ))}
          </div>
      </div>

      {mode === 'entry' && (
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white/10 rounded-[2.5rem] p-6 sm:p-10 text-center space-y-6 backdrop-blur-3xl border border-white/10 shadow-2xl">
             <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight">Gate Control</h3>
                {isSyncing && <p className="text-[8px] font-black uppercase text-blue-400 animate-pulse tracking-widest">Processing Data...</p>}
             </div>
             
             {/* Manual Entry Section - Optimized for small screens */}
             <div className="space-y-3">
                <p className="text-[9px] font-black uppercase text-white/40 text-left px-2 tracking-widest">Search by Ticket ID</p>
                <div className="flex flex-col sm:flex-row gap-2">
                   <input 
                     type="text" 
                     placeholder="SAR/XXXXXX-XXX" 
                     className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-white uppercase outline-none focus:border-blue-500 transition-all text-sm"
                     value={manualId}
                     onChange={e => setManualId(e.target.value)}
                   />
                   <button 
                     onClick={() => fetchTicketDetails(manualId)}
                     disabled={!manualId.trim() || isSyncing}
                     className="bg-blue-600 h-14 sm:h-auto px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-30 active:scale-95 transition-all shadow-xl"
                   >
                     Search
                   </button>
                </div>
             </div>

             <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-white/10"></div>
                <span className="text-[9px] font-black uppercase text-white/20">OR</span>
                <div className="h-px flex-1 bg-white/10"></div>
             </div>

             {/* Scanner Box */}
             {!isScanning && !scannedTicket && (
               <button onClick={startScanner} className="w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-3">
                 <i className="fas fa-qrcode text-3xl"></i>
                 <span className="text-[10px]">Open Camera Scanner</span>
               </button>
             )}
             
             {isScanning && (
               <div className="space-y-4">
                  <div id="reader" className="w-full rounded-[2rem] overflow-hidden border-4 border-blue-600 bg-black min-h-[250px]"></div>
                  <button onClick={stopScanner} className="bg-red-500/20 text-red-400 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20">Cancel Scanner</button>
               </div>
             )}

             {/* Result Card - Fully Responsive */}
             {scannedTicket && (
               <div className="bg-white text-slate-900 rounded-[2rem] p-6 text-left space-y-6 shadow-2xl animate-slide-up border border-slate-100 w-full overflow-hidden">
                 {(() => {
                    const v = getEntryValidation(scannedTicket);
                    return (
                      <>
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-start gap-4">
                               <div className="min-w-0">
                                   <p className="text-[8px] uppercase text-slate-400 font-black tracking-widest mb-0.5">ID</p>
                                   <h4 className="text-xl font-black text-slate-900 truncate">{scannedTicket.id}</h4>
                               </div>
                               <div className={`shrink-0 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase ${v.color} ${v.bg}`}>
                                   {v.message}
                               </div>
                           </div>
                           {v.sub && <p className="text-[9px] font-bold text-slate-500 uppercase">{v.sub}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-slate-100 py-5">
                           <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black mb-0.5">Guest</p><p className="font-black text-sm truncate">{scannedTicket.name}</p></div>
                           <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black mb-0.5">Slot</p><p className="font-black text-sm truncate">{scannedTicket.time.split(':')[0]}</p></div>
                           <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black mb-0.5">Date</p><p className="font-black text-sm">{scannedTicket.date}</p></div>
                           <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black mb-0.5">Pax</p><p className="font-black text-sm">{scannedTicket.adults + scannedTicket.kids}</p></div>
                        </div>

                        <div className="flex flex-col gap-2">
                           {v.isValid && (
                             <button onClick={handleConfirmEntry} disabled={isSyncing} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all">
                                {isSyncing ? 'Wait...' : 'Confirm Entry'}
                             </button>
                           )}
                           <button onClick={() => setScannedTicket(null)} className="w-full py-3 text-[9px] font-black uppercase text-slate-400 hover:text-slate-900">Close Result</button>
                        </div>
                      </>
                    );
                 })()}
               </div>
             )}
          </div>
        </div>
      )}

      {/* Asset Management Modes */}
      {(mode === 'issue' || mode === 'return') && (
         <div className="w-full max-w-xl bg-white/5 rounded-[2.5rem] p-6 sm:p-10 border border-white/5 space-y-8 no-print">
            <p className="text-center text-[10px] font-black text-white/40 uppercase tracking-widest">Asset Management - Under Development</p>
            <button onClick={() => setMode('entry')} className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase opacity-60">Back to Gate Control</button>
         </div>
      )}
    </div>
  );
};
export default StaffPortal;
