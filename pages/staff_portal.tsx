import React, { useState } from 'react';
import { LockerReceipt } from '../types';

const StaffPortal: React.FC = () => {

  const [receipts, setReceipts] = useState<LockerReceipt[]>(() => {
    const saved = localStorage.getItem('swp_locker_receipts');
    return saved ? JSON.parse(saved) : [];
  });

  const [search, setSearch] = useState('');
  const [found, setFound] = useState<LockerReceipt | null>(null);

  const saveReceipts = (list: LockerReceipt[]) => {
    setReceipts(list);
    localStorage.setItem('swp_locker_receipts', JSON.stringify(list));
  };

  const handleSearch = () => {
    const r = receipts.find(x => x.receiptNo === search);
    if (!r) return alert('Receipt not found');
    setFound(r);
  };

  const confirmReturn = () => {
    if (!found) return;

    const updated = receipts.map(r =>
      r.receiptNo === found.receiptNo
        ? { ...r, status: 'returned', returnedAt: new Date().toISOString() }
        : r
    );

    saveReceipts(updated);
    setFound({ ...found, status: 'returned', returnedAt: new Date().toISOString() });

    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="w-full text-white py-12 animate-fade">

      <h1 className="text-4xl font-black uppercase mb-6 text-center">
        Staff Control Panel
      </h1>

      {/* 🔍 SEARCH */}
      <div className="max-w-xl mx-auto bg-white/10 p-8 rounded-3xl border border-white/20 space-y-6">

        <h2 className="text-xl font-bold text-center">Return Panel</h2>

        <input
          placeholder="Enter Receipt Number"
          className="input-premium"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <button onClick={handleSearch} className="btn-resort w-full">
          Fetch Receipt
        </button>

        {/* 📄 FOUND RECEIPT */}
        {found && (
          <div className="bg-black/40 p-6 rounded-2xl space-y-3 mt-6">

            <p><b>Guest:</b> {found.guestName} — {found.guestMobile}</p>
            <p><b>Date:</b> {found.date} | {found.shift}</p>

            <p><b>Male Lockers:</b> {found.maleLockers.join(', ') || 'None'}</p>
            <p><b>Female Lockers:</b> {found.femaleLockers.join(', ') || 'None'}</p>

            <p><b>Male Costumes:</b> {found.maleCostumes}</p>
            <p><b>Female Costumes:</b> {found.femaleCostumes}</p>

            <p className="text-green-400 font-bold">
              Refund: ₹{found.refundableAmount}
            </p>

            {found.status === 'issued' ? (
              <button onClick={confirmReturn} className="btn-resort w-full bg-green-600">
                Confirm Return & Print Receipt
              </button>
            ) : (
              <p className="text-center text-emerald-400 font-bold">
                ✔ Already Returned
              </p>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default StaffPortal;
