import React, { useState } from 'react';
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

  const toggleLocker = (num: number, gender: 'male' | 'female') => {
    const list = gender === 'male' ? maleLockers : femaleLockers;
    const setList = gender === 'male' ? setMaleLockers : setFemaleLockers;

    if (list.includes(num)) {
      setList(list.filter(n => n !== num));
    } else {
      setList([...list, num]);
    }
  };

  const generateReceipt = () => {
    const rent = (maleLockers.length + femaleLockers.length) * 100
      + maleCostumes * 50 + femaleCostumes * 100;

    const deposit = (maleLockers.length + femaleLockers.length) * 200
      + maleCostumes * 50 + femaleCostumes * 100;

    const data: LockerReceipt = {
      receiptNo: 'RC' + Date.now(),
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

  return (
    <div className="w-full flex flex-col items-center py-10 text-white animate-fade">

      <h1 className="text-4xl font-black uppercase mb-2">Staff Control Panel</h1>
      <p className="text-white/70 mb-8">Locker & Costume Management</p>

      <div className="bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-5xl shadow-xl space-y-6">

        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Guest Name" className="input-premium" value={guestName} onChange={e => setGuestName(e.target.value)} />
          <input placeholder="Mobile Number" className="input-premium" value={guestMobile} onChange={e => setGuestMobile(e.target.value)} />
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

  <div className="space-y-2">
    <label className="text-xs uppercase tracking-widest font-bold text-white/70">
      Male Costumes (Qty)
    </label>
    <input
      type="number"
      min={0}
      className="input-premium"
      value={maleCostumes}
      onChange={e => setMaleCostumes(+e.target.value)}
    />
  </div>

  <div className="space-y-2">
    <label className="text-xs uppercase tracking-widest font-bold text-white/70">
      Female Costumes (Qty)
    </label>
    <input
      type="number"
      min={0}
      className="input-premium"
      value={femaleCostumes}
      onChange={e => setFemaleCostumes(+e.target.value)}
    />
  </div>

</div>


        <button onClick={generateReceipt} className="btn-resort w-full h-14">Generate Receipt</button>

        {receipt && (
          <div className="bg-white text-black rounded-2xl p-6 mt-6">
            <h2 className="font-black text-xl mb-4">Receipt #{receipt.receiptNo}</h2>
            <p>Guest: {receipt.guestName} ({receipt.guestMobile})</p>
            <p>Total Collected: ₹{receipt.totalCollected}</p>
            <p>Refundable: ₹{receipt.refundableAmount}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffPortal;
