import React, { useState } from 'react';
import { LockerReceipt } from '../types';

const StaffPortal: React.FC = () => {

  const [tab, setTab] = useState<'issue' | 'return' | 'summary'>('issue');

  const [receipts, setReceipts] = useState<LockerReceipt[]>(() => {
    const saved = localStorage.getItem('swp_receipts');
    return saved ? JSON.parse(saved) : [];
  });

  const saveReceipts = (list: LockerReceipt[]) => {
    setReceipts(list);
    localStorage.setItem('swp_receipts', JSON.stringify(list));
  };

  const generateReceiptNo = () => `R-${Date.now()}`;

  /* ================= ISSUE STATE (ISOLATED & STABLE) ================= */

  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');

  const [maleLockerText, setMaleLockerText] = useState('');
  const [femaleLockerText, setFemaleLockerText] = useState('');

  const [maleCostume, setMaleCostume] = useState(0);
  const [femaleCostume, setFemaleCostume] = useState(0);

  const handleIssue = () => {
    const maleLockers = maleLockerText.split(',').map(v => Number(v.trim())).filter(Boolean);
    const femaleLockers = femaleLockerText.split(',').map(v => Number(v.trim())).filter(Boolean);

    const lockerRent = (maleLockers.length + femaleLockers.length) * 100;
    const lockerSecurity = (maleLockers.length + femaleLockers.length) * 200;

    const costumeRent = maleCostume * 50 + femaleCostume * 100;
    const costumeSecurity = maleCostume * 50 + femaleCostume * 100;

    const receipt: LockerReceipt = {
      receiptNo: generateReceiptNo(),
      guestName,
      guestMobile,
      date: new Date().toLocaleDateString(),
      shift: 'all',

      maleLockers,
      femaleLockers,
      maleCostumes: maleCostume,
      femaleCostumes: femaleCostume,

      rentAmount: lockerRent + costumeRent,
      securityDeposit: lockerSecurity + costumeSecurity,
      totalCollected: lockerRent + costumeRent + lockerSecurity + costumeSecurity,
      refundableAmount: lockerSecurity + costumeSecurity,

      status: 'issued',
      createdAt: new Date().toISOString()
    };

    saveReceipts([receipt, ...receipts]);

    alert(`Receipt Generated: ${receipt.receiptNo}`);
  };

  /* ================= RETURN PANEL ================= */

  const ReturnPanel = () => {
    const [no, setNo] = useState('');

    const handleReturn = () => {
      const updated = receipts.map(r =>
        r.receiptNo === no ? { ...r, status:'returned', returnedAt:new Date().toISOString() } : r
      );
      saveReceipts(updated);
      alert("Return Completed");
    };

    return (
      <div className="space-y-4">
        <input placeholder="Enter Receipt Number" className="input-premium" value={no} onChange={e=>setNo(e.target.value)} />
        <button className="btn-resort w-full" onClick={handleReturn}>Confirm Return</button>
      </div>
    );
  };

  /* ================= SUMMARY PANEL ================= */

  const SummaryPanel = () => (
    <div className="space-y-2 text-white/80">
      <p>Total Receipts: {receipts.length}</p>
      <p>Active: {receipts.filter(r=>r.status==='issued').length}</p>
      <p>Returned: {receipts.filter(r=>r.status==='returned').length}</p>
    </div>
  );

  return (
    <div className="w-full max-w-xl mx-auto text-white space-y-8">

      <h1 className="text-3xl font-black text-center">Staff Control Panel</h1>

      <div className="flex justify-center gap-4">
        <button onClick={()=>setTab('issue')} className="btn-resort">Issue</button>
        <button onClick={()=>setTab('return')} className="btn-resort">Return</button>
        <button onClick={()=>setTab('summary')} className="btn-resort">Summary</button>
      </div>

      <div className="bg-white/10 p-8 rounded-2xl">

        {tab==='issue' && (
          <div className="space-y-4">

            <input placeholder="Guest Name" className="input-premium" value={guestName} onChange={e=>setGuestName(e.target.value)} />
            <input placeholder="Guest Mobile" className="input-premium" value={guestMobile} onChange={e=>setGuestMobile(e.target.value)} />

            <input placeholder="Male Locker Numbers (1,5,9)" className="input-premium" value={maleLockerText} onChange={e=>setMaleLockerText(e.target.value)} />
            <input placeholder="Female Locker Numbers (2,6,10)" className="input-premium" value={femaleLockerText} onChange={e=>setFemaleLockerText(e.target.value)} />

            <input type="number" placeholder="Male Costumes Qty" className="input-premium" value={maleCostume} onChange={e=>setMaleCostume(+e.target.value)} />
            <input type="number" placeholder="Female Costumes Qty" className="input-premium" value={femaleCostume} onChange={e=>setFemaleCostume(+e.target.value)} />

            <button className="btn-resort w-full" onClick={handleIssue}>Generate Receipt</button>

          </div>
        )}

        {tab==='return' && <ReturnPanel/>}
        {tab==='summary' && <SummaryPanel/>}

      </div>
    </div>
  );
};

export default StaffPortal;
