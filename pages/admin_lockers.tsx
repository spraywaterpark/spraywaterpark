import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface IssueEntry {
  receiptNo: string;
  name: string;
  mobile: string;
  locker: string;
  costumeQty: number;
  amount: number;
  deposit: number;
  refund: number;
  time: string;
  returned?: boolean;
}

const AdminLockers: React.FC = () => {

  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [locker, setLocker] = useState('');
  const [costumeQty, setCostumeQty] = useState(0);
  const [amount, setAmount] = useState(0);
  const [deposit, setDeposit] = useState(0);

  const [receipt, setReceipt] = useState<IssueEntry | null>(null);

  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<IssueEntry[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('co_lo_data') || '[]');
    setRecords(saved);
  }, []);

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
      deposit,
      refund: 0,
      time: new Date().toLocaleString(),
      returned: false
    };

    const updated = [entry, ...records];
    localStorage.setItem('co_lo_data', JSON.stringify(updated));
    setRecords(updated);
    setReceipt(entry);

    setName('');
    setMobile('');
    setLocker('');
    setCostumeQty(0);
    setAmount(0);
    setDeposit(0);
  };

  const markReturned = (no: string) => {
    const updated = records.map(r =>
      r.receiptNo === no ? { ...r, returned: true, refund: r.deposit } : r
    );
    localStorage.setItem('co_lo_data', JSON.stringify(updated));
    setRecords(updated);
  };

  const filtered = records.filter(r =>
    r.receiptNo.includes(search) || r.mobile.includes(search)
  );

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white">CO&LO MODULE</h2>
        <button onClick={() => navigate('/admin')} className="btn-premium h-12 px-6">⬅ Go Back</button>
      </div>

      {/* ISSUE PANEL */}
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-xl mx-auto">
        <h3 className="text-2xl font-black mb-6 text-center">Issue Locker / Costume</h3>

        <div className="space-y-4">
          <input className="input-premium w-full" placeholder="Guest Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input-premium w-full" placeholder="Mobile Number" value={mobile} onChange={e=>setMobile(e.target.value)} />
          <input className="input-premium w-full" placeholder="Locker No" value={locker} onChange={e=>setLocker(e.target.value)} />
          <input className="input-premium w-full" type="number" placeholder="Costume Quantity" value={costumeQty} onChange={e=>setCostumeQty(Number(e.target.value))} />
          <input className="input-premium w-full" type="number" placeholder="Amount ₹" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
          <input className="input-premium w-full" type="number" placeholder="Security Deposit ₹" value={deposit} onChange={e=>setDeposit(Number(e.target.value))} />

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
            <p>Deposit: ₹{receipt.deposit}</p>
            <p className="text-xs text-slate-500 mt-2">{receipt.time}</p>
          </div>
        )}
      </div>

      {/* RETURN PANEL */}
      <div className="bg-white rounded-3xl shadow-xl p-10">
        <h3 className="text-xl font-black mb-4">Return & History</h3>

        <input className="input-premium mb-4" placeholder="Search Receipt / Mobile" value={search} onChange={e=>setSearch(e.target.value)} />

        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {filtered.map(r => (
            <div key={r.receiptNo} className="flex justify-between items-center border p-4 rounded-xl">
              <div>
                <p className="font-bold">{r.receiptNo}</p>
                <p className="text-sm">{r.name} | {r.mobile}</p>
                <p className="text-xs text-slate-500">{r.time}</p>
              </div>

              {r.returned ? (
                <span className="text-emerald-600 font-bold">Refund ₹{r.refund}</span>
              ) : (
                <button onClick={() => markReturned(r.receiptNo)} className="bg-red-500 text-white px-4 py-2 rounded-lg">
                  Mark Return
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminLockers;
