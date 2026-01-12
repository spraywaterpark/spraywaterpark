import React, { useState, useRef } from 'react';
import { LockerReceipt, ShiftType } from '../types';

const StaffPortal: React.FC = () => {

  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [shift, setShift] = useState<ShiftType>('morning');

  const [maleLockers, setMaleLockers] = useState<number[]>([]);
  const [femaleLockers, setFemaleLockers] = useState<number[]>([]);
  const [maleCostumes, setMaleCostumes] = useState(0);
  const [femaleCostumes, setFemaleCostumes] = useState(0);

  const [receipt, setReceipt] = useState<LockerReceipt | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  /* ===============================
     Receipt Helpers
  ================================ */

  const generateReceiptNo = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    const dateKey = `${yy}${mm}${dd}`;
    const countKey = `swp_rc_${dateKey}`;

    const count = Number(localStorage.getItem(countKey) || 0) + 1;
    localStorage.setItem(countKey, String(count));

    return `SWP-${dateKey}-${String(count).padStart(4, '0')}`;
  };

  const saveReceipt = (data: LockerReceipt) => {
    const all = JSON.parse(localStorage.getItem('swp_receipts') || '[]');
    all.unshift(data);
    localStorage.setItem('swp_receipts', JSON.stringify(all));
  };

  /* ===============================
     Core Logic
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

    const printContents = printRef.current.innerHTML;
    const win = window.open('', '', 'width=800,height=900');

    if (!win) return;

    win.document.write(`<html><head><title>Receipt</title></head><body>${printContents}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const renderLockers = (gender: 'male' | 'female') => {
    const selected = gender === 'male' ? maleLockers : femaleLockers;

    return Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
      <button
        key={num}
        onClick={() => toggleLocker(num, gender)}
        className={`w-10 h-10 rounded-lg text-xs font-bold border
        ${selected.includes(num) ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}
      >
        {num}
      </button>
    ));
  };

  /* ===============================
     UI
  ================================ */

  return (
    <div className="w-full flex flex-col items-center py-10 text-white">

      <h1 className="text-4xl font-black mb-2">Staff Control Panel</h1>
      <p className="text-white/70 mb-8">Locker & Costume Management</p>

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
          <div ref={printRef} className="bg-white text-black rounded-xl p-6 mt-6 space-y-1">
            <h2 className="font-black text-xl">Receipt {receipt.receiptNo}</h2>
            <p>Guest: {receipt.guestName} ({receipt.guestMobile})</p>
            <p>Lockers: {receipt.maleLockers.length + receipt.femaleLockers.length}</p>
            <p>Male Costumes: {receipt.maleCostumes}</p>
            <p>Female Costumes: {receipt.femaleCostumes}</p>
            <p>Rent: ₹{receipt.rentAmount}</p>
            <p>Security: ₹{receipt.securityDeposit}</p>
            <p className="font-bold">Total: ₹{receipt.totalCollected}</p>
            <p className="text-emerald-600 font-bold">Refundable: ₹{receipt.refundableAmount}</p>

            <button onClick={printReceipt} className="btn-premium mt-4 w-full">
              Print Final Receipt
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffPortal;
