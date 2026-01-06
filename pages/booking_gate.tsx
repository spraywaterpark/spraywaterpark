import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS, PRICING } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings, onProceed }) => {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // EXACT 6:30 PM LOGIC
  const isMorning = slot.includes('Morning');
  const adultRate = isMorning ? PRICING.MORNING_ADULT : PRICING.EVENING_ADULT;
  const kidRate = isMorning ? PRICING.MORNING_KID : PRICING.EVENING_KID;
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
        tierText = `${discountPercent}% Early Bird Applied`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `${discountPercent}% Tier 2 Applied`;
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
    <div className="w-full max-w-5xl flex flex-col items-center animate-fade">
      <div className="text-center mb-10">
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Your Splash Day</h2>
        <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Spray Aqua Resort Jaipur • Reservation</p>
      </div>

      <div className="w-full glass-card p-10 md:p-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* STEP 1: DATE */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">1. Choose Date</label>
            <input type="date" className="input-premium" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
            {date && pricingData.discountPercent > 0 && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <i className="fas fa-gift"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">{pricingData.tierText}</span>
                </div>
            )}
          </div>

          {/* STEP 2: SESSION */}
          <div className="space-y-4">
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

        {/* MEAL SPECIAL UI - 6:30 PM VERSION */}
        <div className="bg-slate-50 border-2 border-slate-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl text-white shadow-2xl ${isMorning ? 'bg-amber-500' : 'bg-indigo-600'} transition-all duration-500`}>
                    <i className={isMorning ? "fas fa-utensils" : "fas fa-concierge-bell"}></i>
                </div>
                <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Complimentary Service</p>
                    <h5 className="text-xl font-black text-slate-900 uppercase tracking-tight">{currentOffer}</h5>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Included with your entry pass</p>
                </div>
            </div>
            <div className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fixed Rates</p>
                <p className="text-lg font-black text-slate-900">₹{adultRate} Adult | ₹{kidRate} Kid</p>
            </div>
        </div>

        {/* PASSENGERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex justify-between items-center shadow-md">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adult Entry</p>
              <p className="text-3xl font-black text-slate-900">₹{adultRate}</p>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold text-xl hover:bg-slate-900 hover:text-white transition-all">-</button>
              <span className="font-black text-2xl w-8 text-center">{adults}</span>
              <button onClick={() => setAdults(adults+1)} className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold text-xl hover:bg-slate-900 hover:text-white transition-all">+</button>
            </div>
          </div>
          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex justify-between items-center shadow-md">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Child Entry</p>
              <p className="text-3xl font-black text-slate-900">₹{kidRate}</p>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => setKids(Math.max(0, kids-1))} className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold text-xl hover:bg-slate-900 hover:text-white transition-all">-</button>
              <span className="font-black text-2xl w-8 text-center">{kids}</span>
              <button onClick={() => setKids(kids+1)} className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center font-bold text-xl hover:bg-slate-900 hover:text-white transition-all">+</button>
            </div>
          </div>
        </div>

        {/* CHECKOUT */}
        <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">Total Amount</p>
            <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none mt-2">₹{pricingData.total}</p>
          </div>
          <button onClick={handleCheckout} className="btn-resort w-full md:auto px-24 h-24 shadow-2xl text-xl">Continue to Payment</button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[500] bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade">
          <div className="bg-white rounded-[4rem] max-w-xl w-full p-12 md:p-16 shadow-3xl relative border border-white/20">
            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter text-center mb-10">Safety & Rules</h3>
            <div className="space-y-5 mb-12 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-6 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                  <p className="text-[12px] font-bold text-slate-700 uppercase leading-relaxed tracking-tight">{t}</p>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-6 cursor-pointer p-6 bg-blue-50/50 rounded-3xl mb-10 border-2 border-blue-100 transition-all hover:bg-blue-50">
              <input type="checkbox" className="w-8 h-8 rounded-xl border-2 border-slate-300 accent-blue-600 cursor-pointer" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">I agree to all resort policies</span>
            </label>
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => setShowTerms(false)} className="py-5 font-black text-slate-400 uppercase text-[11px] tracking-[0.2em] hover:text-slate-900 transition-colors">Go Back</button>
              <button onClick={finalProceed} disabled={!acceptedTerms} className="btn-resort h-20 !py-0 disabled:opacity-20 text-sm">Agree & Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGate;
