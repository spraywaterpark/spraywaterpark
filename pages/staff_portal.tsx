
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';

const StaffPortal: React.FC<{ role?: UserRole }> = ({ role }) => {
  // Determine initial mode based on role
  const initialMode = role === 'staff1' ? 'entry' : 'issue';
  const [mode, setMode] = useState<'entry' | 'issue' | 'return'>(initialMode);
  
  const [scannedTicket, setScannedTicket] = useState<Booking | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [manualId, setManualId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [allRentals, setAllRentals] = useState<LockerReceipt[]>([]);

  // Asset states for staff2
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [shift, setShift] = useState<ShiftType>('morning');
  const [receipt, setReceipt] = useState<LockerReceipt | null>(null);

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
    if (role === 'staff1') return; // Gate staff doesn't need locker sync
    const rentals = await cloudSync.fetchRentals();
    if (rentals) setAllRentals(rentals);
  };

  useEffect(() => {
    refreshActive();
  }, [mode]);

  const startScanner = () => {
    setScannedTicket(null);
    setIsScanning(true);
    setTimeout(() => {
      try {
        const html5QrCode = new (window as any).Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        html5QrCode.start(
          { facingMode: "environment" }, 
          { fps: 15, qrbox: { width: 250, height: 250 } }, 
          (decoded: string) => { 
            stopScanner().then(() => fetchTicketDetails(decoded)); 
          }, 
          () => {} 
        ).catch(err => {
          console.error("Scanner error:", err);
          alert("Camera Error: Please check permissions.");
          setIsScanning(false);
        });
      } catch (e) {
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
        } catch (e) { }
    }
    setIsScanning(false); 
  };

  const fetchTicketDetails = async (id: string) => {
    if (!id.trim()) return;
    setIsSyncing(true);
    const cleanId = id.trim().toUpperCase();
    try {
      const res = await fetch(`/api/booking?type=ticket_details&id=${cleanId}`);
      if (!res.ok) {
        alert("TICKET NOT FOUND");
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

  const getValidation = (ticket: Booking) => {
    const { todayStr, currentHour } = getISTInfo();
    
    if (ticket.status === 'checked-in') return { valid: false, msg: "TICKET ALREADY USED", color: "text-red-600", bg: "bg-red-50" };
    if (ticket.date < todayStr) return { valid: false, msg: "TICKET EXPIRED", color: "text-red-600", bg: "bg-red-50" };
    if (ticket.date > todayStr) return { valid: false, msg: "PRE-ENTRY NOT ALLOWED", sub: "For Date: " + ticket.date, color: "text-amber-600", bg: "bg-amber-50" };

    const isMorning = ticket.time.toLowerCase().includes('morning');
    if (isMorning) {
        if (currentHour < 9) return { valid: false, msg: "PRE-ENTRY NOT ALLOWED", sub: "Opens at 10 AM", color: "text-amber-600", bg: "bg-amber-50" };
        if (currentHour >= 14) return { valid: false, msg: "TICKET EXPIRED", sub: "Morning slot over", color: "text-red-600", bg: "bg-red-50" };
    } else {
        if (currentHour < 15) return { valid: false, msg: "PRE-ENTRY NOT ALLOWED", sub: "Opens at 4 PM", color: "text-amber-600", bg: "bg-amber-50" };
        if (currentHour >= 21) return { valid: false, msg: "TICKET EXPIRED", sub: "Evening slot over", color: "text-red-600", bg: "bg-red-50" };
    }
    return { valid: true, msg: "TICKET VALID", color: "text-emerald-600", bg: "bg-emerald-50" };
  };

  const confirmEntry = async () => {
    if (!scannedTicket) return;
    setIsSyncing(true);
    try {
        const res = await fetch('/api/booking?type=checkin', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ticketId: scannedTicket.id }) 
        });
        const data = await res.json();
        if (data.success) {
            notificationService.sendWelcomeMessage(scannedTicket).catch(() => {});
            alert("ENTRY CONFIRMED!\nWelcome message sent.");
            setScannedTicket(null);
        } else {
            alert(data.details || "Check-in Failed.");
        }
    } catch (e) {
        alert("Sync Error.");
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-3 text-white min-h-[90vh]">
      
      {/* Role-Based Tab Switcher (Visible to Admin or shared roles only) */}
      {(role === 'admin' || !role) && (
        <div className="w-full max-w-md flex bg-white/10 rounded-full p-1 border border-white/10 mb-8">
            {['entry', 'issue', 'return'].map(m => (
              <button key={m} onClick={() => setMode(m as any)} className={`flex-1 py-3 rounded-full font-black text-[9px] uppercase tracking-widest ${mode === m ? 'bg-blue-600 shadow-lg' : 'text-white/40'}`}>{m}</button>
            ))}
        </div>
      )}

      {/* staff1 View: Gate Control */}
      {(mode === 'entry' || role === 'staff1') && (
        <div className="w-full max-w-sm space-y-6">
           <div className="bg-white/10 rounded-[2.5rem] p-6 sm:p-8 text-center space-y-6 backdrop-blur-3xl border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tight">Gate Control</h3>

              {/* Manual Entry - Stacks on mobile */}
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase text-white/40 text-left px-1 tracking-widest">Manual Search</p>
                <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      placeholder="Ticket ID (e.g. SAR/...)" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-white uppercase text-sm outline-none focus:border-blue-500"
                      value={manualId}
                      onChange={e => setManualId(e.target.value)}
                    />
                    <button 
                      onClick={() => fetchTicketDetails(manualId)}
                      disabled={!manualId.trim() || isSyncing}
                      className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                    >
                      {isSyncing ? 'Searching...' : 'Search Ticket'}
                    </button>
                </div>
              </div>

              <div className="flex items-center gap-4 py-1">
                <div className="h-px flex-1 bg-white/10"></div>
                <span className="text-[9px] font-black uppercase text-white/20">OR</span>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>

              {!isScanning && !scannedTicket && (
                <button onClick={startScanner} className="w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2">
                  <i className="fas fa-qrcode text-3xl"></i>
                  <span className="text-[10px]">Open Scanner</span>
                </button>
              )}

              {isScanning && (
                <div className="space-y-4">
                   <div id="reader" className="w-full rounded-[2rem] overflow-hidden border-4 border-blue-600 bg-black min-h-[250px]"></div>
                   <button onClick={stopScanner} className="text-red-400 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
              )}

              {scannedTicket && (
                <div className="bg-white text-slate-900 rounded-[2rem] p-5 text-left space-y-6 shadow-2xl border border-slate-100 animate-slide-up w-full overflow-hidden">
                   {(() => {
                      const v = getValidation(scannedTicket);
                      return (
                        <>
                          <div className="flex flex-col gap-2">
                             <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                   <p className="text-[8px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Ticket ID</p>
                                   <h4 className="text-lg font-black text-slate-900 break-all">{scannedTicket.id}</h4>
                                </div>
                                <div className={`shrink-0 px-2 py-1 rounded-md text-[8px] font-black uppercase ${v.color} ${v.bg}`}>
                                   {v.msg}
                                </div>
                             </div>
                             {v.sub && <p className="text-[9px] font-bold text-slate-500 uppercase">{v.sub}</p>}
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
                             <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black">Guest</p><p className="font-black text-xs truncate uppercase">{scannedTicket.name}</p></div>
                             <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black">Slot</p><p className="font-black text-xs truncate">{scannedTicket.time.split(':')[0]}</p></div>
                             <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black">Date</p><p className="font-black text-xs">{scannedTicket.date}</p></div>
                             <div className="min-w-0"><p className="text-[8px] uppercase text-slate-400 font-black">Pax</p><p className="font-black text-xs">{scannedTicket.adults + scannedTicket.kids}</p></div>
                          </div>

                          <div className="space-y-2">
                             {v.valid && (
                               <button onClick={confirmEntry} disabled={isSyncing} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95">
                                 Allow Entry
                               </button>
                             )}
                             <button onClick={() => setScannedTicket(null)} className="w-full py-2 text-[9px] font-black uppercase text-slate-400 text-center">Close</button>
                          </div>
                        </>
                      );
                   })()}
                </div>
              )}
           </div>
        </div>
      )}

      {/* staff2 View: Assets (Lockers/Costumes) */}
      {(role === 'staff2' || (role === 'admin' && (mode === 'issue' || mode === 'return'))) && (
        <div className="w-full max-w-lg space-y-6">
           <div className="bg-white/10 rounded-[2.5rem] p-8 text-center border border-white/10 shadow-2xl space-y-8">
              <h3 className="text-2xl font-black uppercase tracking-tight">Locker Management</h3>
              <div className="space-y-4">
                 <input placeholder="Guest Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black uppercase" value={guestName} onChange={e=>setGuestName(e.target.value)} />
                 <input placeholder="Mobile Number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black" value={guestMobile} onChange={e=>setGuestMobile(e.target.value)} />
                 <button className="w-full bg-emerald-500 py-5 rounded-2xl font-black uppercase text-slate-900 shadow-xl">Issue Asset</button>
              </div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Locker Section Under Active Dev</p>
           </div>
        </div>
      )}
    </div>
  );
};
export default StaffPortal;
