import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS, PRICING } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings }) => {
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

    const hasEarlyBird = date && alreadyBooked < 100;
    let discountPercent = hasEarlyBird ? settings.earlyBirdDiscount : 0;
    
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent, isEligible: hasEarlyBird };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const handleCheckout = () => {
    if (!date) return alert("Please select a date first.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    if (!acceptedTerms) return;
    const draft = { 
        date, 
        time: slot, 
        adults, 
        kids, 
        subtotal: pricingData.subtotal,
        discount: pricingData.discount,
        totalAmount: pricingData.total, 
        status: 'pending' 
    };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center animate-smart px-6 py-12 md:py-20 text-center">
      
      <div className="mb-14 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Reservation</h2>
        <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.5em]">Experience Spray Aqua Resort</p>
      </div>

      <div className="w-full bg-white rounded-[3rem] p-8 md:p-16 space-y-16 flex flex-col items-center border border-slate-100 shadow-sm">
        
        {/* Selection Logic - Sober & Pro */}
        <div className="w-full max-w-md space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Desired Visit Date</label>
          <input type="date" className="input-premium h-16 text-xl bg-slate-50 border-slate-100" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
          {pricingData.isEligible && (
            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-2 pt-2 animate-pulse">
              <i className="fas fa-bolt"></i> Early Bird: {settings.earlyBirdDiscount}% OFF Applied
            </div>
          )}
        </div>

        <div className="w-full flex flex-col items-center space-y-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Select Session</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
            {TIME_SLOTS.map(s => (
              <button key={s} onClick={() => setSlot(s)} className={`p-8 rounded-3xl border transition-all flex flex-col items-center text-center ${slot === s ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}>
                <p className="text-sm font-black uppercase tracking-widest mb-1">{s.split(': ')[0]}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60`}>{s.split(': ')[1]}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-full">
          <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adult Entry (12+)</p>
            <div className="flex items-center gap-10">
              <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center font-bold text-lg hover:bg-slate-900 hover:text-white transition-all">-</button>
              <span className="font-black text-4xl w-8">{adults}</span>
              <button onClick={() => setAdults(adults+1)} className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center font-bold text-lg hover:bg-slate-900 hover:text-white transition-all">+</button>
            </div>
          </div>
          <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kid Entry (3-12)</p>
            <div className="flex items-center gap-10">
              <button onClick={() => setKids(Math.max(0, kids-1))} className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center font-bold text-lg hover:bg-slate-900 hover:text-white transition-all">-</button>
              <span className="font-black text-4xl w-8">{kids}</span>
              <button onClick={() => setKids(kids+1)} className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center font-bold text-lg hover:bg-slate-900 hover:text-white transition-all">+</button>
            </div>
          </div>
        </div>

        <div className="w-full pt-12 border-t border-slate-100 flex flex-col items-center gap-12">
           <div className="w-full max-w-xs space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <span>Subtotal</span>
                 <span>₹{pricingData.subtotal}</span>
              </div>
              {pricingData.discount > 0 && (
                <div className="flex justify-between items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                   <span>Resort Offer</span>
                   <span>- ₹{pricingData.discount}</span>
                </div>
              )}
              <div className="pt-8 flex flex-col items-center border-t border-slate-50 mt-2">
                 <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total Amount</p>
                 <p className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">₹{pricingData.total}</p>
              </div>
           </div>

           <div className="w-full max-w-sm bg-slate-50 p-6 rounded-2xl flex items-center justify-center gap-4 border border-slate-100">
              <i className="fas fa-gift text-slate-900"></i>
              <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{currentOffer}</p>
           </div>
           
           <button onClick={handleCheckout} className="btn-modern max-w-sm h-16 md:h-20 shadow-xl">
             Finalize & Pay <i className="fas fa-chevron-right ml-4 text-[10px]"></i>
           </button>
        </div>

      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-smart">
          <div className="bg-white rounded-[2.5rem] max-w-xl w-full p-10 md:p-14 shadow-2xl flex flex-col items-center text-center overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-10">Guest Protocols</h3>
            <div className="w-full space-y-4 mb-12 text-left">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-5 p-5 bg-slate-50 rounded-2xl items-center border border-slate-50">
                  <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
            <label className="w-full flex items-center justify-center gap-5 cursor-pointer p-6 bg-slate-50 rounded-2xl mb-10 border border-slate-100">
              <input type="checkbox" className="w-6 h-6 accent-slate-900 rounded" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">I acknowledge resort rules</span>
            </label>
            <div className="w-full grid grid-cols-2 gap-5">
              <button onClick={() => setShowTerms(false)} className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Go Back</button>
              <button onClick={finalProceed} disabled={!acceptedTerms} className="btn-modern !h-14 disabled:opacity-30 text-[10px]">Proceed to Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGate;
