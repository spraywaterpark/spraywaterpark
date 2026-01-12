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

  /* ================= ISSUE PANEL ================= */

  const IssuePanel = () => {
    const [guestName, setGuestName] = useState('');
    const [guestMobile, setGuestMobile] = useState('');
    const [maleCostume, setMaleCostume] = useState(0);
    const [femaleCostume, setFemaleCostume] = useState(0);
    const [maleLockers, setMaleLockers] = useState('');
    const [femaleLockers, setFemaleLockers] = useState('');

    const handleIssue = () => {
      const mLockers = maleLockers.split(',').map(x => Number(x.trim())).filter(Boolean);
      const fLockers = femaleLockers.split(',').map(x => Number(x.trim())).filter(Boolean);

      const rent = (mLockers.length + fLockers.length) * 100 +
                   maleCostume * 50 + femaleCostume * 100;

      const security = (mLockers.length + fLockers.length) * 200 +
                       maleCostume * 50 + femaleCostume * 100;

      const receipt: LockerReceipt = {
        receiptNo: generateReceiptNo(),
        guestName,
        guestMobile,
        date: new Date().toLocaleDateString(),
        shift: 'all',
        maleLockers: mLockers,
        femaleLockers: fLockers,
        maleCostumes: maleCostume,
        femaleCostumes: femaleCostume,
        rentAmount: rent,
        securityDeposit: security,
        totalCollected: rent + security,
        refundableAmount: security,
        status: 'issued',
        createdAt: new Date().toISOString()
      };

      saveReceipts([receipt, ...receipts]);
      alert(`Receipt Generated: ${receipt.receiptNo}`);
    };

    return (
      <div className="space-y-4">

        <input placeholder="Guest Name" className="input-premium" value={guestName} onChange={e=>setGuestName(e.target.value)} />
        <input placeholder="Mobile" className="input-premium" value={guestMobile} onChange={e=>setGuestMobile(e.target.value)} />

        <input placeholder="Male Lockers (1,2,5)" className="input-premium" value={maleLockers} onChange={e=>setMaleLockers(e.target.value)} />
        <input placeholder="Female Lockers (3,4)" className="input-premium" value={femaleLockers} onChange={e=>setFemaleLockers(e.target.value)} />

        <input placeholder="Male Costumes" type="number" className="input-premium" value={maleCostume} onChange={e=>setMaleCostume(+e.target.value)} />
        <input placeholder="Female Costumes" type="number" className="input-premium" value={femaleCostume} onChange={e=>setFemaleCostume(+e.target.value)} />

        <button className="btn-resort w-full" onClick={handleIssue}>Generate Receipt</button>

      </div>
    );
  };

  /* ================= RETURN PANEL ================= */

  const ReturnPanel = () => {
    const [no, setNo] = useState('');

    const handleReturn = () => {
      const updated = receipts.map(r =>
        r.receiptNo === no ? { ...r, status:'returned', returnedAt:new Date().toISOString() } : r
      );
      saveReceipts(updated);
      alert("Items Returned Successfully");
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
        {tab==='issue' && <IssuePanel/>}
        {tab==='return' && <ReturnPanel/>}
        {tab==='summary' && <SummaryPanel/>}
      </div>

    </div>
  );
};

export default StaffPortal;
