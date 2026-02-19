
import React, { useState, useRef, useEffect } from 'react';
import { LockerReceipt, ShiftType, UserRole, Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
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
  const [searchCode, setSearchCode] = useState('');
  const [returnReceipt, setReturnReceipt] = useState<LockerReceipt | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeLockers, setActiveLockers] = useState<{ male: number[]; female: number[] }>({ male: [], female: [] });
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
    if (rentals) {
      setAllRentals(rentals);
      const activeRecords = rentals.filter(r => r.status === 'issued');
      setActiveLockers({ 
        male: activeRecords.flatMap(r => r.maleLockers || []), 
        female: activeRecords.flatMap(r => r.femaleLockers || []) 
      });
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
      html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, 
        (decoded: string) => { stopScanner(); fetchTicketDetails(decoded); }, () => {});
    }, 100);
  };

  const stopScanner = () => { if (scannerRef.current) scannerRef.current.stop().then(() => setIsScanning(false)); else setIsScanning(false); };

  const fetchTicketDetails = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/booking?type=ticket_details&id=${id.toUpperCase()}`);
      const data = await res.json();
      if (data.success) setScannedTicket(data.booking);
      else alert("Ticket not found.");
    } catch (e) { alert("Sync Error."); } finally { setIsSyncing(false); }
  };

  const getEntryValidation = (ticket: Booking) => {
    const { todayStr, currentHour } = getISTInfo();
    if (ticket.date !== todayStr) return { isValid: false, reason: `DATE MISMATCH: Ticket is for ${ticket.date}` };
    const isMorning = ticket.time.toLowerCase().includes('morning');
    if (isMorning) {
      if (currentHour < 10) return { isValid: false, reason: "WAIT: Opens at 10 AM" };
      if (currentHour >= 14) return { isValid: false, reason: "EXPIRED: Morning slot closed" };
    } else {
      if (currentHour < 16) return { isValid: false, reason: "WAIT: Opens at 4 PM" };
      if (currentHour >= 20) return { isValid: false, reason: "EXPIRED: Evening slot closed" };
    }
    return { isValid: true, reason: "TICKET VALID" };
  };

  const handleConfirmEntry = async () => {
    if (!scannedTicket) return;
    const v = getEntryValidation(scannedTicket);
    if (!v.isValid) return alert(`ACCESS DENIED: ${v.reason}`);
    setIsSyncing(true);
    const res = await fetch('/api/booking?type=checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: scannedTicket.id }) });
    const data = await res.json();
    if (data.success) { alert("Welcome!"); setScannedTicket(null); } else { alert("Error."); }
    setIsSyncing(false);
  };

  const generateReceipt = () => {
    const { todayStr, currentHour } = getISTInfo();
    if (shift === 'morning' && (currentHour < 10 || currentHour >= 15)) return alert("Morning issue time over.");
    if (shift === 'evening' && (currentHour < 16 || currentHour >= 21)) return alert("Evening issue time over.");
    if (!guestName) return alert("Name required.");
    
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
    if (await cloudSync.saveRental(receipt)) { window.print(); setReceipt(null); refreshActive(); }
    else alert("Sync Failed.");
    setIsSyncing(false);
  };

  return (
    <div className="w-full flex flex-col items-center py-6 text-white min-h-[90vh]">
      <div className="w-full max-w-5xl flex justify-between items-center mb-10 px-4 no-print">
          <div className="flex bg-white/10 rounded-full p-1 border border-white/10">
            {['entry', 'issue', 'return'].map(m => (
              <button key={m} onClick={() => setMode(m as any)} className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest ${mode === m ? 'bg-blue-600' : 'text-white/40'}`}>{m}</button>
            ))}
          </div>
      </div>

      {mode === 'entry' && (
        <div className="w-full max-w-2xl px-4 no-print">
          <div className="bg-white/10 rounded-[3rem] p-12 text-center space-y-8 backdrop-blur-3xl">
             <h3 className="text-3xl font-black uppercase">Gate Check-In</h3>
             {!isScanning && !scannedTicket && <button onClick={startScanner} className="w-full h-24 bg-white/5 border-2 border-dashed border-white/20 rounded-3xl font-black uppercase">Scan QR</button>}
             {isScanning && <div id="reader" className="w-full rounded-3xl overflow-hidden"></div>}
             {scannedTicket && (
               <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 text-left space-y-6">
                 <h4 className="text-4xl font-black">{scannedTicket.id}</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] uppercase text-slate-400">Guest</p><p className="font-black">{scannedTicket.name}</p></div>
                    <div><p className="text-[10px] uppercase text-slate-400">Slot</p><p className="font-black">{scannedTicket.time.split(':')[0]}</p></div>
                 </div>
                 <button onClick={handleConfirmEntry} className="w-full h-20 bg-blue-600 text-white rounded-2xl font-black uppercase">Verify & Enter</button>
               </div>
             )}
          </div>
        </div>
      )}

      {mode === 'issue' && (
        <div className="bg-white/5 rounded-[3rem] p-14 w-full max-w-6xl space-y-12 no-print">
          <div className="grid md:grid-cols-3 gap-6">
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            <input className="input-premium !bg-slate-900/50 !text-white" placeholder="Mobile" value={guestMobile} onChange={e => setGuestMobile(e.target.value)} />
            <select className="input-premium !bg-slate-900/50 !text-white" value={shift} onChange={e => setShift(e.target.value as any)}>
                <option value="morning">Morning</option><option value="evening">Evening</option>
            </select>
          </div>
          <button onClick={generateReceipt} className="w-full h-20 bg-emerald-500 text-slate-900 font-black uppercase text-lg rounded-3xl">Generate Bill</button>
          {receipt && <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6"><div className="bg-white p-10 rounded-3xl text-slate-900 w-full max-w-md"><h2 className="text-2xl font-black uppercase mb-6">Confirm Issue</h2><button onClick={confirmAndPrint} className="w-full bg-emerald-500 py-5 rounded-xl font-black uppercase">Confirm & Print</button></div></div>}
        </div>
      )}
    </div>
  );
};
export default StaffPortal;
