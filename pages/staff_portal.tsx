import React, { useState, useRef } from 'react';
import { LockerReceipt, ShiftType } from '../types';

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

  const printRef = useRef<HTMLDivElement>(null);

  /* ===============================
     HELPERS
  ================================ */

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

  const saveReceipt = (data: LockerReceipt) => {
    const all = JSON.parse(localStorage.getItem('swp_receipts') || '[]');
    all.unshift(data);
    localStorage.setItem('swp_receipts', JSON.stringify(all));
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

  /* ===============================
     CORE LOGIC
  ================================ */

  const toggleLocker = (num: number, gender: 'male' | 'female') => {
    const list = gender === 'male' ? maleLockers : femaleLockers;
    const setList = gender === 'male' ? setMaleLockers : setFemaleLockers;

    setList(list.includes(num) ? list.filter(n => n !== num) : [...list, num]);
  };

  const generateReceipt = () => {
    if (!guestName || !guestMobile) return alert("Enter guest details");

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

  const printReceipt = () => {
    if (!receipt || !printRef.current) return;

    saveReceipt(receipt);

    const win = window.open('', '', 'width=800,height=900');
    if (!win) return;

    win.document.write(`<html><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
    win.close();

    resetForm();
  };

 const confirmReturn = () => {
  if (!returnReceipt) return;

  const all: LockerReceipt[] = JSON.parse(localStorage.getItem('swp_receipts') || '[]');

  const updated = all.map(r =>
    r.receiptNo === returnReceipt.receiptNo
      ? { ...r, status: 'returned', returnedAt: new Date().toISOString() }
      : r
  );

  localStorage.setItem('swp_receipts', JSON.stringify(updated));

  alert("✅ Return Completed Successfully");

  setReturnReceipt(null);
  setSearchCode('');
};


  const confirmReturn = () => {
    const all = JSON.parse(localStorage.getItem('swp_receipts') || '[]');
    const updated = all.map((r: LockerReceipt) =>
      r.receiptNo === returnReceipt?.receiptNo
        ? { ...r, status: 'returned', returnedAt: new Date().toISOString() }
        : r
    );
    localStorage.setItem('swp_receipts', JSON.stringify(updated));
    alert("Return Completed");
    setReturnReceipt(null);
    setSearchCode('');
  };

  const renderLockers = (gender: 'male' | 'female') =>
    Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
      const selected = gender === 'male' ? maleLockers : femaleLockers;
      return (
        <button key={num}
          onClick={() => toggleLocker(num, gender)}
          className={`w-10 h-10 rounded-lg text-xs font-bold border 
          ${selected.includes(num) ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}>
          {num}
        </button>
      );
    });

  /* ===============================
     UI
  ================================ */

  return (
    <div className="w-full flex flex-col items-center py-10 text-white">

      {/* MODE TABS */}
      <div className="flex mb-8 bg-white/10 rounded-full p-1">
        <button onClick={() => setMode('issue')}
          className={`px-8 py-2 rounded-full font-bold ${mode === 'issue' ? 'bg-emerald-500 text-black' : 'text-white/70'}`}>
          ISSUE
        </button>
        <button onClick={() => setMode('return')}
          className={`px-8 py-2 rounded-full font-bold ${mode === 'return' ? 'bg-emerald-500 text-black' : 'text-white/70'}`}>
          RETURN
        </button>
      </div>

      {/* ================= ISSUE PANEL ================= */}
      {mode === 'issue' && (
        <div className="bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-5xl space-y-6">

          <div className="grid md:grid-cols-2 gap-4">
            <input className="input-premium" placeholder="Guest Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
            <input className="input-premium" placeholder="Mobile Number" value={guestMobile} onChange={e => setGuestMobile(e.target.value)} />
          </div>

          <div className="flex gap-4">
            <button onClick={() => setShift('morning')} className={`btn-premium ${shift === 'morning' && 'bg-emerald-500'}`}>Morning</button>
            <button onClick={() => setShift('evening')} className={`btn-premium ${shift === 'evening' && 'bg-emerald-500'}`}>Evening</button>
          </div>

          <div>
            <p className="font-bold mb-2">Male Lockers</p>
            <div className="grid grid-cols-10 gap-2">{renderLockers('male')}</div>
          </div>

          <div>
            <p className="font-bold mb-2">Female Lockers</p>
            <div className="grid grid-cols-10 gap-2">{renderLockers('female')}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input type="number" min={0} className="input-premium" placeholder="Male Costumes" value={maleCostumes} onChange={e => setMaleCostumes(+e.target.value)} />
            <input type="number" min={0} className="input-premium" placeholder="Female Costumes" value={femaleCostumes} onChange={e => setFemaleCostumes(+e.target.value)} />
          </div>

          <button onClick={generateReceipt} className="btn-resort w-full h-14">Generate Receipt</button>

          {receipt && (
            <div ref={printRef} className="bg-white text-black rounded-xl p-6 space-y-1">
              <h2 className="font-black text-xl">Receipt {receipt.receiptNo}</h2>
              <p><b>Guest:</b> {receipt.guestName} ({receipt.guestMobile})</p>
              <p><b>Male Lockers:</b> {receipt.maleLockers.join(', ') || '-'}</p>
              <p><b>Female Lockers:</b> {receipt.femaleLockers.join(', ') || '-'}</p>
              <p><b>Male Costumes:</b> {receipt.maleCostumes}</p>
              <p><b>Female Costumes:</b> {receipt.femaleCostumes}</p>
              <p><b>Total:</b> ₹{receipt.totalCollected}</p>
              <p className="text-emerald-600 font-bold"><b>Refundable:</b> ₹{receipt.refundableAmount}</p>

              <button onClick={printReceipt} className="btn-premium mt-4 w-full">Print Final Receipt</button>
            </div>
          )}

        </div>
      )}

      {/* ================= RETURN PANEL ================= */}
      {mode === 'return' && (
        <div className="bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-xl space-y-6">

          <input placeholder="Last 4 digits of receipt" className="input-premium"
            value={searchCode} onChange={e => setSearchCode(e.target.value)} />

          <button onClick={findReturn} className="btn-resort w-full">Find Receipt</button>

          {returnReceipt && (
            <div className="bg-white text-black rounded-xl p-6 space-y-2">
              <p><b>Receipt:</b> {returnReceipt.receiptNo}</p>
              <p><b>Male Lockers:</b> {returnReceipt.maleLockers.join(', ') || '-'}</p>
              <p><b>Female Lockers:</b> {returnReceipt.femaleLockers.join(', ') || '-'}</p>
              <p><b>Male Costumes:</b> {returnReceipt.maleCostumes}</p>
              <p><b>Female Costumes:</b> {returnReceipt.femaleCostumes}</p>
              <p className="text-emerald-600 font-bold"><b>Refund:</b> ₹{returnReceipt.refundableAmount}</p>

              <button onClick={confirmReturn} className="btn-premium w-full">Confirm Return</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default StaffPortal;
