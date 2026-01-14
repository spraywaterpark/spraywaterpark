import React, { useState, useRef } from 'react';
import { LockerReceipt, ShiftType } from '../types';

const LOCKER_API_URL = "https://script.google.com/macros/s/AKfycbwbZl5aaELVZLFNAz3Oo7fBHXXJWddNw699MOgyxNwZIrAxOCBNc6KT21J5ST4JLpFvKw/exec";

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

  const [activeLockers, setActiveLockers] = useState<{ male: number[]; female: number[] }>(() => {
    const saved = localStorage.getItem('swp_active_lockers');
    return saved ? JSON.parse(saved) : { male: [], female: [] };
  });

  /* ================== GOOGLE SHEET SAVE ================== */

  const saveToSheet = async (data: LockerReceipt) => {
    await fetch(LOCKER_API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  /* =============================== HELPERS =============================== */

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
    const all: LockerReceipt[] = JSON.parse(localStorage.getItem('swp_receipts') || '[]');
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

  /* =============================== CORE LOGIC =============================== */

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

  const printReceipt = async () => {
    if (!receipt || !printRef.current) return;

    await saveToSheet(receipt);        // 🔗 Google Sheet
    saveReceipt(receipt);              // 🗃 Local backup

    const updated = {
      male: [...activeLockers.male, ...receipt.maleLockers],
      female: [...activeLockers.female, ...receipt.femaleLockers]
    };

    setActiveLockers(updated);
    localStorage.setItem('swp_active_lockers', JSON.stringify(updated));

    const win = window.open('', '', 'width=800,height=900');
    if (!win) return;

    win.document.write(`<html><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
    win.close();

    resetForm();
  };

  /* =============================== UI =============================== */

  return (
    <div className="w-full flex flex-col items-center py-10 text-white">

      {/* Existing UI remains exactly same */}

      {/* Just make sure Print button calls printReceipt() */}

    </div>
  );
};

export default StaffPortal;
