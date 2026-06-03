import React, { useState, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';

interface CounterPortalProps {
  settings: AdminSettings;
  bookings: Booking[];
  onAddBooking: (b: Booking) => void;
  onUpdateBooking: (b: Booking) => void;
}

const CounterPortal: React.FC<CounterPortalProps> = ({ settings, bookings, onAddBooking, onUpdateBooking }) => {
  // Wizard states
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [shift, setShift] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [foodOption, setFoodOption] = useState<'with_food' | 'without_food'>('with_food');
  const [adults, setAdults] = useState<number>(0);
  const [kids, setKids] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'upi' | 'split'>('cash');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUpi, setSplitUpi] = useState<number>(0);
  const [guestName, setGuestName] = useState<string>('');
  const [guestMobile, setGuestMobile] = useState<string>('');

  // Editing states
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // When edit booking is selected
  useEffect(() => {
    if (editingBooking) {
      const isMorning = editingBooking.time.toLowerCase().includes('morning');
      const isWithFood = editingBooking.time.toLowerCase().includes('with food') || editingBooking.time.toLowerCase().includes('with dinner');
      
      setShift(isMorning ? 'MORNING' : 'EVENING');
      setFoodOption(isWithFood ? 'with_food' : 'without_food');
      setAdults(editingBooking.adults);
      setKids(editingBooking.kids);
      setGuestName(editingBooking.name);
      setGuestMobile(editingBooking.mobile);
      
      const hasSplit = (editingBooking.cashAmount || 0) > 0 && (editingBooking.upiAmount || 0) > 0;
      if (hasSplit) {
        setPaymentType('split');
        setSplitCash(editingBooking.cashAmount || 0);
        setSplitUpi(editingBooking.upiAmount || 0);
      } else if ((editingBooking.upiAmount || 0) > 0) {
        setPaymentType('upi');
        setSplitCash(0);
        setSplitUpi(editingBooking.totalAmount);
      } else {
        setPaymentType('cash');
        setSplitCash(editingBooking.totalAmount);
        setSplitUpi(0);
      }
      
      setWizardStep(1); // Start editing from step 1
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingBooking]);

  // Compute rates and totals dynamically
  const getRates = () => {
    let isSunday = false;
    const bookingDateStr = editingBooking ? editingBooking.date : new Date().toLocaleDateString('en-CA');
    if (bookingDateStr) {
      const parts = bookingDateStr.split('-');
      if (parts.length === 3) {
        const yr = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10) - 1;
        const dy = parseInt(parts[2], 10);
        const refDate = new Date(yr, mo, dy);
        isSunday = refDate.getDay() === 0;
      }
    } else {
      const d = new Date();
      const istStr = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istDate = new Date(istStr);
      isSunday = istDate.getDay() === 0;
    }

    const sundayExtra = isSunday ? 50 : 0;

    if (shift === 'MORNING') {
      if (foodOption === 'with_food') {
        return { adult: 400 + sundayExtra, kid: 300 + sundayExtra, name: 'Morning (With Food)', isSunday };
      } else {
        return { adult: 300 + sundayExtra, kid: 200 + sundayExtra, name: 'Morning (Without Food)', isSunday };
      }
    } else {
      if (foodOption === 'with_food') {
        return { adult: 600 + sundayExtra, kid: 400 + sundayExtra, name: 'Evening (With Dinner)', isSunday };
      } else {
        return { adult: 450 + sundayExtra, kid: 300 + sundayExtra, name: 'Evening (Without Dinner)', isSunday };
      }
    }
  };

  const currentRates = getRates();
  const totalAmount = (adults * currentRates.adult) + (kids * currentRates.kid);

  // Initialize splits on step 3 entry or total count changes
  useEffect(() => {
    if (paymentType === 'cash') {
      setSplitCash(totalAmount);
      setSplitUpi(0);
    } else if (paymentType === 'upi') {
      setSplitCash(0);
      setSplitUpi(totalAmount);
    } else if (paymentType === 'split' && splitCash + splitUpi !== totalAmount) {
      const half = Math.floor(totalAmount / 2);
      setSplitCash(half);
      setSplitUpi(totalAmount - half);
    }
  }, [totalAmount, paymentType]);

  const handleSplitCashChange = (val: number) => {
    const cash = Math.min(totalAmount, Math.max(0, val));
    setSplitCash(cash);
    setSplitUpi(totalAmount - cash);
  };

  const handleSplitUpiChange = (val: number) => {
    const upi = Math.min(totalAmount, Math.max(0, val));
    setSplitUpi(upi);
    setSplitCash(totalAmount - upi);
  };

  // Check if ticket edit grace period has expired (10 mins)
  const isEditable = (booking: Booking) => {
    if (!booking.createdAt) return false;
    let createdTime = 0;
    try {
      // Handle standard ISO and local date parsing
      createdTime = new Date(booking.createdAt).getTime();
      if (isNaN(createdTime)) {
        // Try parsing DD/MM/YYYY, HH:MM:SS format
        const parts = booking.createdAt.split(', ');
        if (parts.length === 2) {
          const dateParts = parts[0].split('/');
          const timeParts = parts[1].split(':');
          createdTime = new Date(
            Number(dateParts[2]),
            Number(dateParts[1]) - 1,
            Number(dateParts[0]),
            Number(timeParts[0]),
            Number(timeParts[1]),
            Number(timeParts[2])
          ).getTime();
        }
      }
    } catch (e) {
      return false;
    }
    const now = new Date().getTime();
    return (now - createdTime) <= 10 * 60 * 1000;
  };

  const generateTicketId = (dateStr: string, timeStr: string) => {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const datePart = `${dd}${mm}${yy}`;
    const shiftCode = timeStr.toLowerCase().includes('morning') ? '1' : '2';
    const countToday = bookings.filter(b => b.date === dateStr && b.time.toLowerCase().includes(shift.toLowerCase())).length + 1;
    const seq = String(countToday).padStart(3, '0');
    return `SAR/${datePart}${shiftCode}-${seq}`;
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (wizardStep === 2) {
      if (adults === 0 && kids === 0) {
        setErrorMsg('Please select at least 1 guest (Adult or Kid)');
        return;
      }
    }
    setWizardStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setWizardStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveBooking = async () => {
    setErrorMsg('');
    if (!guestName.trim()) {
      setErrorMsg('Please enter Guest Name');
      return;
    }
    if (guestMobile.length !== 10) {
      setErrorMsg('Enter valid 10-digit Mobile Number');
      return;
    }

    setLoading(true);
    const todayDate = new Date().toLocaleDateString('en-CA');
    
    // Exact detail string based on selection
    const finalTimeStr = shift === 'MORNING'
      ? (foodOption === 'with_food' ? "Morning Shift (With Food)" : "Morning Shift (Without Food)")
      : (foodOption === 'with_food' ? "Evening Shift (With Dinner)" : "Evening Shift (Without Dinner)");

    const bookingToSave: Booking = editingBooking ? {
      ...editingBooking,
      name: guestName.trim(),
      mobile: guestMobile,
      date: editingBooking.date,
      time: finalTimeStr,
      adults: adults,
      kids: kids,
      students: 0,
      totalAmount: totalAmount,
      paymentMode: paymentType === 'upi' ? 'upi' : 'cash',
      cashAmount: paymentType === 'upi' ? 0 : (paymentType === 'cash' ? totalAmount : splitCash),
      upiAmount: paymentType === 'cash' ? 0 : (paymentType === 'upi' ? totalAmount : splitUpi),
    } : {
      id: generateTicketId(todayDate, finalTimeStr),
      name: guestName.trim(),
      mobile: guestMobile,
      date: todayDate,
      time: finalTimeStr,
      adults: adults,
      kids: kids,
      students: 0,
      discountCode: "",
      totalAmount: totalAmount,
      status: 'confirmed',
      paymentMode: paymentType === 'upi' ? 'upi' : 'cash',
      cashAmount: paymentType === 'upi' ? 0 : (paymentType === 'cash' ? totalAmount : splitCash),
      upiAmount: paymentType === 'cash' ? 0 : (paymentType === 'upi' ? totalAmount : splitUpi),
      createdAt: new Date().toLocaleString("en-IN", { timeZone: 'Asia/Kolkata' })
    };

    try {
      let saved = false;
      if (editingBooking) {
        saved = await cloudSync.updateBooking(bookingToSave);
      } else {
        saved = await cloudSync.saveBooking(bookingToSave);
      }

      if (!saved) {
        throw new Error("Unable to save data. Please check connection.");
      }

      if (editingBooking) {
        onUpdateBooking(bookingToSave);
        setEditingBooking(null);
        alert("Booking Updated Successfully!");
        resetForm();
      } else {
        await onAddBooking(bookingToSave);
        // Send dynamic WhatsApp notification
        try {
          await notificationService.sendWhatsAppTicket(bookingToSave);
        } catch (e) {
          console.warn("WhatsApp dispatch error:", e);
        }
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setWizardStep(5); // Advance to Shift Report
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to make progress. Check network connect.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setWizardStep(1);
    setAdults(0);
    setKids(0);
    setGuestName('');
    setGuestMobile('');
    setPaymentType('cash');
    setSplitCash(0);
    setSplitUpi(0);
    setEditingBooking(null);
    setErrorMsg('');
  };

  // Report calculations for TODAY'S selected shift
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  // Filter bookings belonging strictly to selected shift of today
  const currentShiftBookings = bookings.filter(b => {
    const isSameDate = b.date === todayStr;
    const isMorningBooking = b.time.toLowerCase().includes('morning');
    const isSameShift = shift === 'MORNING' ? isMorningBooking : !isMorningBooking;
    return isSameDate && isSameShift;
  });

  // Count food vs without food
  let totalWithFoodAdults = 0;
  let totalWithFoodKids = 0;
  let totalWithoutFoodAdults = 0;
  let totalWithoutFoodKids = 0;

  currentShiftBookings.forEach(b => {
    const isWithFood = b.time.toLowerCase().includes('with food') || b.time.toLowerCase().includes('with dinner');
    if (isWithFood) {
      totalWithFoodAdults += b.adults || 0;
      totalWithFoodKids += b.kids || 0;
    } else {
      totalWithoutFoodAdults += b.adults || 0;
      totalWithoutFoodKids += b.kids || 0;
    }
  });

  // Safe split calculation
  let totalCashCollected = 0;
  let totalUpiCollected = 0;

  currentShiftBookings.forEach(b => {
    if (b.cashAmount !== undefined && b.upiAmount !== undefined) {
      totalCashCollected += b.cashAmount;
      totalUpiCollected += b.upiAmount;
    } else {
      // Fallback for older entries/external bookings
      if (b.paymentMode === 'cash') {
        totalCashCollected += b.totalAmount || 0;
      } else {
        totalUpiCollected += b.totalAmount || 0;
      }
    }
  });

  return (
    <div className="w-full max-w-xl mx-auto p-2 md:p-4 space-y-6">
      {editingBooking && (
        <div className="bg-amber-500 text-slate-900 font-extrabold px-6 py-4 rounded-3xl flex justify-between items-center text-sm shadow-lg mb-2">
          <span>⚠️ EDITING BOOKING: {editingBooking.id}</span>
          <button 
            type="button" 
            onClick={resetForm} 
            className="bg-slate-950 text-white px-4 py-2 rounded-xl text-xs uppercase font-black tracking-widest hover:bg-slate-900 transition-all"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Main Wizard Container */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] shadow-2xl p-6 md:p-8 border border-slate-800">
        
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
            SCREEN {wizardStep} OF 6
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i === wizardStep ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: SHIFT & FOOD CONFIGURATION */}
        {wizardStep === 1 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-1">SELECT SHIFT</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Setup visit shift and package type</p>
            </div>

            {/* Shift choice */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase px-2">SHIFT</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setShift('MORNING')}
                  className={`py-8 rounded-3xl font-black text-xl transition-all border-4 flex flex-col justify-center items-center ${
                    shift === 'MORNING'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xl'
                      : 'bg-slate-800/80 text-slate-400 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="text-3xl mb-1">☀️</span>
                  <span>MORNING</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShift('EVENING')}
                  className={`py-8 rounded-3xl font-black text-xl transition-all border-4 flex flex-col justify-center items-center ${
                    shift === 'EVENING'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xl'
                      : 'bg-slate-800/80 text-slate-400 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="text-3xl mb-1">🌙</span>
                  <span>EVENING</span>
                </button>
              </div>
            </div>

            {/* Food choice */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase px-2">FOOD OPTION</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFoodOption('with_food')}
                  className={`py-8 rounded-3xl font-black text-xl transition-all border-4 flex flex-col justify-center items-center ${
                    foodOption === 'with_food'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl'
                      : 'bg-slate-800/80 text-slate-400 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="text-3xl mb-1">🍱</span>
                  <span>WITH FOOD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFoodOption('without_food')}
                  className={`py-8 rounded-3xl font-black text-xl transition-all border-4 flex flex-col justify-center items-center ${
                    foodOption === 'without_food'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl'
                      : 'bg-slate-800/80 text-slate-400 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="text-3xl mb-1">🌊</span>
                  <span>WITHOUT FOOD</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full h-20 rounded-[2rem] bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-8"
            >
              NEXT ➔
            </button>
          </div>
        )}

        {/* STEP 2: GUEST COUNT (ADULTS & KIDS) */}
        {wizardStep === 2 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-1">GUEST LIST</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{currentRates.name} Rates Active</p>
              {currentRates.isSunday && (
                <div className="mt-2 inline-block bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-md">
                  ⚡ Sunday Extra Surcharge (₹50/ticket) applied!
                </div>
              )}
            </div>

            {/* Adults Counter */}
            <div className="bg-slate-800/85 p-6 rounded-3xl border border-slate-700 relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black tracking-widest uppercase text-slate-300">ADULTS</span>
                <span className="text-emerald-400 font-extrabold text-sm">₹{currentRates.adult} each</span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAdults(prev => Math.max(0, prev - 1))}
                  className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center font-black text-3xl active:scale-95 transition-all"
                >
                  -
                </button>
                <span className="text-5xl font-black text-white w-24 text-center select-none">
                  {adults}
                </span>
                <button
                  type="button"
                  onClick={() => setAdults(prev => prev + 1)}
                  className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center font-black text-3xl active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Kids Counter */}
            <div className="bg-slate-800/85 p-6 rounded-3xl border border-slate-700 relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black tracking-widest uppercase text-slate-300">KIDS</span>
                <span className="text-emerald-400 font-extrabold text-sm">₹{currentRates.kid} each</span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setKids(prev => Math.max(0, prev - 1))}
                  className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center font-black text-3xl active:scale-95 transition-all"
                >
                  -
                </button>
                <span className="text-5xl font-black text-white w-24 text-center select-none">
                  {kids}
                </span>
                <button
                  type="button"
                  onClick={() => setKids(prev => prev + 1)}
                  className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center font-black text-3xl active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-center font-black text-sm text-red-500 uppercase tracking-widest px-4">{errorMsg}</p>
            )}

            {/* Back & Next buttons */}
            <div className="grid grid-cols-5 gap-4 mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className="col-span-2 h-20 rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-md uppercase tracking-wider transition-all"
              >
                ◀ BACK
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="col-span-3 h-20 rounded-[2rem] bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-2xl uppercase tracking-widest transition-all shadow-xl"
              >
                NEXT ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BILLING & PAYMENT OPTIONS */}
        {wizardStep === 3 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-1">BILLING</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Select payment configuration</p>
            </div>

            {/* Total display box */}
            <div className="bg-slate-850 border-2 border-slate-700 rounded-[2rem] py-6 px-4 text-center space-y-1">
              <span className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">
                TOTAL PAYABLE AMOUNT
              </span>
              <div className="text-6xl font-black text-emerald-400 tracking-tighter">
                ₹{totalAmount}
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {adults} Adults • {kids} Kids
              </div>
              {currentRates.isSunday && (
                <div className="text-[10px] text-amber-400 font-black uppercase tracking-widest mt-1">
                  (Includes ₹50 Sunday surcharge per ticket)
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase px-2">PAYMENT MODE</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`py-5 rounded-2xl font-black text-sm transition-all border-2 flex flex-col justify-center items-center ${
                    paymentType === 'cash'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                      : 'bg-slate-800 text-slate-400 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl mb-1">💵</span>
                  <span>CASH</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('upi')}
                  className={`py-5 rounded-2xl font-black text-sm transition-all border-2 flex flex-col justify-center items-center ${
                    paymentType === 'upi'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                      : 'bg-slate-800 text-slate-400 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl mb-1">📱</span>
                  <span>UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('split')}
                  className={`py-5 rounded-2xl font-black text-sm transition-all border-2 flex flex-col justify-center items-center ${
                    paymentType === 'split'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                      : 'bg-slate-800 text-slate-400 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl mb-1">⚖️</span>
                  <span>SPLIT (दोनों)</span>
                </button>
              </div>
            </div>

            {/* Split controls */}
            {paymentType === 'split' && (
              <div className="bg-slate-800/80 p-6 rounded-3xl space-y-5 border border-slate-700 animate-slide-up">
                <p className="text-center font-black text-amber-400 text-[10px] uppercase tracking-widest">
                  SPLIT MODE: Enter details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">CASH PORTION</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-lg">₹</span>
                      <input
                        type="number"
                        pattern="\d*"
                        value={splitCash || ''}
                        onChange={e => handleSplitCashChange(Number(e.target.value))}
                        className="w-full bg-slate-900 border-2 border-slate-700 focus:border-blue-500 outline-none rounded-2xl h-16 pl-9 pr-4 font-black text-slate-100 text-xl"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">UPI PORTION</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-lg">₹</span>
                      <input
                        type="number"
                        pattern="\d*"
                        value={splitUpi || ''}
                        onChange={e => handleSplitUpiChange(Number(e.target.value))}
                        className="w-full bg-slate-900 border-2 border-slate-700 focus:border-blue-500 outline-none rounded-2xl h-16 pl-9 pr-4 font-black text-slate-100 text-xl"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back & Next buttons */}
            <div className="grid grid-cols-5 gap-4 mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className="col-span-2 h-20 rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-md uppercase tracking-wider transition-all"
              >
                ◀ BACK
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="col-span-3 h-20 rounded-[2rem] bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-2xl uppercase tracking-widest transition-all shadow-xl"
              >
                NEXT ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: GUEST METADATA (NAME & PHONE) */}
        {wizardStep === 4 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-1">GUEST INFO</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Complete registration detail</p>
            </div>

            {/* Inputs */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase px-4">GUEST NAME</label>
                <input
                  type="text"
                  placeholder="ENTER FULL NAME"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-emerald-400 outline-none rounded-3xl h-20 px-6 font-bold text-white text-xl tracking-wide placeholder-slate-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase px-4">MOBILE (10 DIGITS)</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="EX: 9876543210"
                  value={guestMobile}
                  onChange={e => setGuestMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-emerald-400 outline-none rounded-3xl h-20 px-6 font-bold text-white text-xl tracking-widest placeholder-slate-500 transition-all text-center"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-center font-black text-sm text-red-500 uppercase tracking-widest px-4">{errorMsg}</p>
            )}

            {/* Save & Back buttons */}
            <div className="grid grid-cols-5 gap-4 mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className="col-span-2 h-20 rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-md uppercase tracking-wider transition-all"
              >
                ◀ BACK
              </button>
              <button
                type="button"
                onClick={handleSaveBooking}
                disabled={loading || success}
                className={`col-span-3 h-20 rounded-[2rem] font-black text-xl uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
                  success 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {loading ? (
                  <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : success ? (
                  'TICKET SAVED!'
                ) : (
                  'SAVE & NEXT ➔'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: TOTAL TICKET REPORT (WITH/WITHOUT FOOD TODAY) */}
        {wizardStep === 5 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-amber-400 mb-1">TOTAL TICKET REPORT</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                Shift: {shift === 'MORNING' ? '☀️ MORNING' : '🌙 EVENING'} • TODAY
              </p>
            </div>

            {/* Double grid cards */}
            <div className="space-y-4">
              {/* WITH FOOD SHIFT SUMMARY */}
              <div className="bg-emerald-950/40 border border-emerald-900/60 p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍱</span>
                  <span className="text-md font-black tracking-widest text-emerald-400 uppercase">WITH FOOD</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ADULTS</p>
                    <p className="text-3xl font-black text-white">{totalWithFoodAdults}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">KIDS</p>
                    <p className="text-3xl font-black text-white">{totalWithFoodKids}</p>
                  </div>
                </div>
              </div>

              {/* WITHOUT FOOD SHIFT SUMMARY */}
              <div className="bg-slate-850 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌊</span>
                  <span className="text-md font-black tracking-widest text-slate-300 uppercase">WITHOUT FOOD</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ADULTS</p>
                    <p className="text-3xl font-black text-white">{totalWithoutFoodAdults}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">KIDS</p>
                    <p className="text-3xl font-black text-white">{totalWithoutFoodKids}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full h-20 rounded-[2rem] bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-8"
            >
              PAYMENTS REPORT ➔
            </button>
          </div>
        )}

        {/* STEP 6: TOTAL PAYMENT REPORT */}
        {wizardStep === 6 && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-blue-400 mb-1">TOTAL PAYMENT REPORT</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                Shift Collection Dashboard
              </p>
            </div>

            {/* Financial summaries */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-850 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL CASH IN REGISTER</p>
                  <p className="text-4xl font-black text-white">₹{totalCashCollected}</p>
                </div>
                <div className="text-4xl bg-slate-800 p-3 rounded-2xl">💵</div>
              </div>

              <div className="bg-slate-850 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL UPI RECEIVED</p>
                  <p className="text-4xl font-black text-white">₹{totalUpiCollected}</p>
                </div>
                <div className="text-4xl bg-slate-800 p-3 rounded-2xl">📱</div>
              </div>

              <div className="bg-gradient-to-r from-blue-900/40 to-emerald-900/40 border-2 border-slate-700/60 p-6 rounded-[2.5rem] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">TOTAL SHIFT REVENUE</p>
                  <p className="text-4xl font-black text-emerald-400">₹{totalCashCollected + totalUpiCollected}</p>
                </div>
                <div className="text-4xl bg-slate-800/80 p-3 rounded-2xl">🪙</div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-xl uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-8"
            >
              🔄 NEXT BOOKING
            </button>
          </div>
        )}
        
      </div>

      {/* Dynamic Queue of Recent Bookings below the Wizard */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 border border-slate-800 space-y-4">
        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-4">
          RECENT SHIFT TICKETS QUEUE
        </h4>
        <div className="space-y-3.5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {bookings.slice(0, 8).map(b => (
            <div key={b.id} className="bg-slate-850 p-4 rounded-3xl flex justify-between items-center border border-slate-800 hover:border-slate-700 transition-all">
              <div>
                <p className="text-white font-bold text-md">{b.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  #{b.id} • {b.time}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-emerald-400 font-black text-md">₹{b.totalAmount}</p>
                  <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {b.cashAmount && b.upiAmount 
                      ? "SPLIT" 
                      : b.upiAmount ? "UPI" : "CASH"
                    }
                  </span>
                </div>
                {isEditable(b) && (
                  <button 
                    onClick={() => setEditingBooking(b)}
                    className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all"
                    title="Edit Ticket"
                  >
                    <i className="fas fa-edit text-xs"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-6">No bookings generated yet today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounterPortal;
