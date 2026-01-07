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
    <div className="w-full max-w-5xl flex flex-col items-center animate-fade px-4 py-6">
      <div className="text-center mb-14 flex flex-col items-center w-full">
        <h2 className="text-5xl md:text-6xl font-black text-[#1B2559] uppercase tracking-tighter leading-none text-center">Your Splash Day</h2>
        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.5em] mt-5 text-center">Spray Aqua Resort Jaipur • Reservations</p>
      </div>

      <div className="w-full glass-card p-10 md:p-20 space-y-16 flex flex-col items-center border border-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
          {/* STEP 1: DATE (Centered) */}
          <div className="space-y-6 flex flex-col items-center text-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] text-center w-full">1. Choose Visit Date</label>
            <input type="date" className="input-premium h-20 text-xl" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
            {date && pricingData.discountPercent > 0 && (
                <div className="bg-emerald-50 text-emerald-700 px-8 py-4 rounded-2xl border border-emerald-100 flex items-center gap-4 shadow-sm animate-fade">
                    <i className="fas fa-gift text-xl"></i>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{pricingData.tierText}</span>
                </div>
            )}
          </div>

          {/* STEP 2: SESSION (Centered) */}
          <div className="space-y-6 flex flex-col items-center text-center">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] text-center w-full">2. Select Entry Session</label>
            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
              {TIME_SLOTS.map(s => (
                <button key={s} onClick={() => setSlot(s)} className={`p-6 rounded-2xl border-2 text-center transition-all text-xs font-black uppercase tracking-[0.1em] w-full ${slot === s ? 'border-[#1B2559] bg-[#1B2559] text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MEAL SPECIAL UI (Centered) */}
        <div className="w-full bg-slate-50 border border-slate-100 p-10 md:p-14 rounded-[3.5rem] flex flex-col items-center text-center gap-10">
            <div className="flex flex-col items-center gap-6">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl text-white shadow-3xl ${isMorning ? 'bg-amber-500' : 'bg-indigo-600'} transition-all`}>
                    <i className={isMorning ? "fas fa-utensils" : "fas fa-concierge-bell"}></i>
                </div>
                <div className="text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 text-center">Complimentary Hospitality</p>
                    <h5 className="text-3xl font-black text-[#1B2559] uppercase tracking-tight text-center">{currentOffer}</h5>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest text-center">Included with your entry pass</p>
                </div>
            </div>
        </div>

        {/* PASSENGERS (Centered Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
          <div className="p-10 bg-white border border-slate-100 rounded-[3rem] flex flex-col items-center shadow-xl space-y-6 text-center">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] text-center w-full">Adult Entry (12+ Years)</p>
            <p className="text-4xl font-black text-[#1B2559] text-center">₹{adultRate}</p>
            <div className="flex items-center gap-8 justify-center">
              <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-14 h-14 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center font-black text-2xl hover:bg-[#1B2559] hover:text-white transition-all shadow-sm">-</button>
              <span className="font-black text-4xl w-10 text-center">{adults}</span>
              <button onClick={() => setAdults(adults+1)} className="w-14 h-14 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center font-black text-2xl hover:bg-[#1B2559] hover:text-white transition-all shadow-sm">+</button>
            </div>
          </div>
          <div className="p-10 bg-white border border-slate-100 rounded-[3rem] flex flex-col items-center shadow-xl space-y-6 text-center">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] text-center w-full">Child Entry (3-12 Years)</p>
            <p className="text-4xl font-black text-[#1B2559] text-center">₹{kidRate}</p>
            <div className="flex items-center gap-8 justify-center">
              <button onClick={() => setKids(Math.max(0, kids-1))} className="w-14 h-14 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center font-black text-2xl hover:bg-[#1B2559] hover:text-white transition-all shadow-sm">-</button>
              <span className="font-black text-4xl w-10 text-center">{kids}</span>
              <button onClick={() => setKids(kids+1)} className="w-14 h-14 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center font-black text-2xl hover:bg-[#1B2559] hover:text-white transition-all shadow-sm">+</button>
            </div>
          </div>
        </div>

        {/* CHECKOUT SECTION (Centered) */}
        <div className="w-full pt-16 border-t border-slate-100 flex flex-col items-center gap-12 text-center">
          <div className="text-center flex flex-col items-center">
            <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] mb-4 text-center">Final Payable Amount</p>
            <p className="text-8xl font-black text-[#1B2559] tracking-tighter leading-none text-center">₹{pricingData.total}</p>
          </div>
          <button onClick={handleCheckout} className="btn-resort w-full max-w-lg h-24 shadow-[0_30px_60px_-15px_rgba(27,37,89,0.3)] text-xl rounded-[2.5rem] flex items-center justify-center">
            Reserve Your Tickets <i className="fas fa-arrow-right ml-4"></i>
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[500] bg-[#1B2559]/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade">
          <div className="bg-white rounded-[4.5rem] max-w-2xl w-full p-14 md:p-16 shadow-3xl relative flex flex-col items-center text-center">
            <h3 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter mb-10 leading-none text-center">Resort Policies</h3>
            <div className="w-full space-y-4 mb-12 text-left flex flex-col items-center">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-[2.5rem] items-center border border-slate-100 w-full max-w-xl">
                  <span className="w-9 h-9 rounded-2xl bg-[#1B2559] text-white flex items-center justify-center text-[11px] font-black shrink-0">{i+1}</span>
                  <p className="text-[12px] font-bold text-slate-700 uppercase leading-relaxed tracking-tight">{t}</p>
                </div>
              ))}
            </div>
            <label className="w-full max-w-xl flex items-center justify-center gap-6 cursor-pointer p-8 bg-blue-50/50 rounded-[3rem] mb-12 border-2 border-blue-100 hover:bg-blue-50 transition-all">
              <input type="checkbox" className="w-8 h-8 rounded-xl border-2 border-slate-300 accent-[#1B2559] cursor-pointer" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-[14px] font-black text-slate-900 uppercase tracking-widest text-center">I agree to Resort Terms</span>
            </label>
            <div className="w-full max-w-xl grid grid-cols-2 gap-8">
              <button onClick={() => setShowTerms(false)} className="py-6 font-black text-slate-400 uppercase text-[12px] tracking-[0.4em] hover:text-[#1B2559] text-center">Go Back</button>
              <button onClick={finalProceed} disabled={!acceptedTerms} className="btn-resort h-22 disabled:opacity-20 text-sm flex items-center justify-center">Agree & Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGate;
