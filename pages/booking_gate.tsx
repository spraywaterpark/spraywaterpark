import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings, onProceed }) => {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isMorning = slot.includes('Morning');
  const adultRate = isMorning ? settings.morningAdultRate : settings.eveningAdultRate;
  const kidRate = isMorning ? settings.morningKidRate : settings.eveningKidRate;
  const currentOffer = isMorning ? OFFERS.MORNING : OFFERS.EVENING;

  const pricingData = useMemo(() => {
    const subtotal = (adults * adultRate) + (kids * kidRate);
    const alreadyBooked = bookings
      .filter(b => b.date === date && b.time === slot && b.status === 'confirmed')
      .reduce((sum, b) => sum + b.adults + b.kids, 0);

    let discountPercent = 0;
    let tierText = "";

    if (date) {
      if (alreadyBooked < 100) {
        discountPercent = settings.earlyBirdDiscount;
        tierText = `${discountPercent}% Early Bird Discount`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `${discountPercent}% Tier 2 Discount`;
      }
    }

    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent, tierText };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const handleCheckout = () => {
    if (!date) return alert("Please select your visit date.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    if (!acceptedTerms) return;
    const draft = { date, time: slot, adults, kids, totalAmount: pricingData.total, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center animate-reveal">
      <div className="text-center mb-10">
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Reservation</h2>
        <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.5em] mt-2">Spray Aqua Resort Booking Terminal</p>
      </div>

      <div className="w-full glass-card p-10 md:p-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">1. Choose Date</label>
            <input type="date" className="input-premium" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">2. Select Session</label>
            <div className="grid grid-cols-1 gap-4">
              {TIME_SLOTS.map(s => (
                <button key={s} onClick={() => setSlot(s)} className={`p-5 rounded-2xl border-2 text-left transition-all text-xs font-black uppercase tracking-tight ${slot === s ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COMPLIMENTARY MEAL UI - RESTORED ICONS */}
        <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg ${isMorning ? 'bg-amber-500' : 'bg-indigo-600'} transition-all duration-500`}>
                    <i className={isMorning ? "fas fa-utensils" : "fas fa-concierge-bell"}></i>
                </div>
                <div className="text-center md:text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Special</p>
                    <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight">{currentOffer}</h5>
                </div>
            </div>
            {date && pricingData.discountPercent > 0 && (
                <span className="bg-emerald-100 text-emerald-800 px-5 py-2 rounded-full text-[10px] font-black uppercase border border-emerald-200 animate-pulse">{pricingData.tierText}</span>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adult Pass</p>
              <p className="text-2xl font-black text-slate-900">₹{adultRate}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-colors">-</button>
              <span className="font-black text-xl w-6 text-center">{adults}</span>
              <button onClick={() => setAdults(adults+1)} className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-colors">+</button>
            </div>
          </div>
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Child Pass</p>
              <p className="text-2xl font-black text-slate-900">₹{kidRate}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setKids(Math.max(0, kids-1))} className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-colors">-</button>
              <span className="font-black text-xl w-6 text-center">{kids}</span>
              <button onClick={() => setKids(kids+1)} className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold hover:bg-slate-900 hover:text-white transition-colors">+</button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Total Payable</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter leading-none mt-2">₹{pricingData.total}</p>
          </div>
          <button onClick={handleCheckout} className="btn-resort w-full md:w-auto px-20 h-20 shadow-xl text-lg">Book Tickets Now</button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-reveal">
          <div className="bg-white rounded-[3rem] max-w-lg w-full p-12 shadow-3xl relative">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight text-center mb-8">Resort Policy</h3>
            <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto pr-3">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-blue-600 font-black text-xs mt-1">{i+1}.</span>
                  <p className="text-[11px] font-bold text-slate-700 uppercase leading-relaxed tracking-tight">{t}</p>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-5 cursor-pointer p-5 bg-blue-50/50 rounded-2xl mb-8 border border-blue-100">
              <input type="checkbox" className="w-7 h-7 rounded-lg border-2 border-slate-300 accent-slate-900 cursor-pointer" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">I acknowledge the resort terms</span>
            </label>
            <div className="grid grid-cols-2 gap-5">
              <button onClick={() => setShowTerms(false)} className="py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-900">Go Back</button>
              <button onClick={finalProceed} disabled={!acceptedTerms} className="btn-resort h-16 !py-0 disabled:opacity-20">Checkout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
