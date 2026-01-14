import React, { useState } from 'react';

interface IssueEntry {
  receiptNo: string;
  name: string;
  mobile: string;
  locker: string;
  costumeQty: number;
  amount: number;
  time: string;
}

const AdminLockers: React.FC = () => {

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [locker, setLocker] = useState('');
  const [costumeQty, setCostumeQty] = useState(0);
  const [amount, setAmount] = useState(0);
  const [receipt, setReceipt] = useState<IssueEntry | null>(null);

  const generateReceipt = () => {
    if (!name || !mobile || !locker || amount <= 0) {
      alert("Fill all fields");
      return;
    }

    const entry: IssueEntry = {
      receiptNo: "R" + Date.now(),
      name,
      mobile,
      locker,
      costumeQty,
      amount,
      time: new Date().toLocaleString()
    };

    const all = JSON.parse(localStorage.getItem('co_lo_data') || '[]');
    localStorage.setItem('co_lo_data', JSON.stringify([entry, ...all]));

    setReceipt(entry);

    setName('');
    setMobile('');
    setLocker('');
    setCostumeQty(0);
    setAmount(0);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 max-w-xl mx-auto">

      <h2 className="text-3xl font-black mb-6 text-center">CO&LO — Issue Panel</h2>

      <div className="space-y-4">

        <input className="input-premium w-full" placeholder="Guest Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input-premium w-full" placeholder="Mobile Number" value={mobile} onChange={e=>setMobile(e.target.value)} />
        <input className="input-premium w-full" placeholder="Locker No" value={locker} onChange={e=>setLocker(e.target.value)} />

        <input className="input-premium w-full" type="number" placeholder="Costume Quantity" value={costumeQty} onChange={e=>setCostumeQty(Number(e.target.value))} />
        <input className="input-premium w-full" type="number" placeholder="Amount ₹" value={amount} onChange={e=>setAmount(Number(e.target.value))} />

        <button onClick={generateReceipt} className="btn-resort w-full h-14 text-lg">
          Generate Receipt
        </button>

      </div>

      {receipt && (
        <div className="mt-8 p-6 border rounded-xl bg-slate-50 text-center">
          <p className="font-black text-lg mb-2">Receipt Generated</p>
          <p>Receipt No: <b>{receipt.receiptNo}</b></p>
          <p>{receipt.name} | {receipt.mobile}</p>
          <p>Locker: {receipt.locker}</p>
          <p>Costumes: {receipt.costumeQty}</p>
          <p>Amount: ₹{receipt.amount}</p>
          <p className="text-xs text-slate-500 mt-2">{receipt.time}</p>
        </div>
      )}

    </div>
  );
};

export default AdminLockers;
