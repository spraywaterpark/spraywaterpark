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
        tierText = `Early Bird: ${discountPercent}% Discount Applied!`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `Tier 2 Discount: ${discountPercent}% OFF`;
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
    const draft = { 
        date, 
        time: slot, 
        adults, 
        kids, 
        totalAmount: pricingData.total, 
        status: 'pending' 
    };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 md:space-y-12 animate-fade">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-[#1B2559] tracking-tighter uppercase">Reserve Your Day</h2>
          <p className="text-slate-600 font-bold text-sm mt-1 uppercase tracking-wider">Plan your visit to Spray Aqua Resort</p>
        </div>
        {date && pricingData.discountPercent > 0 && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] shadow-xl shadow-emerald-200 animate-pulse border border-emerald-500">
            <i className="fas fa-gift mr-2"></i> {pricingData.tierText}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Reservation Details */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="card-premium p-6 md:p-12 space-y-10 md:space-y-14">
            
            {/* Step 1: Date & Time */}
            <section className="space-y-5 md:space-y-7">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.25em] flex items-center gap-4">
                <span className="w-6 h-6 md:w-8 md:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[10px] md:text-[12px] shadow-lg shadow-blue-200">1</span>
                Visit Schedule
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Select Date</label>
                  <input 
                    type="date" 
                    className="input-premium text-base md:text-lg" 
                    onChange={e => setDate(e.target.value)} 
                    min={new Date().toISOString().split('T')[0]} 
                    value={date} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-1">Choose Shift</label>
                  <div className="flex flex-col gap-3">
                    {TIME_SLOTS.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setSlot(s)} 
                        className={`p-4 md:p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between shadow-sm ${slot === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                         <span className="font-black text-sm md:text-base uppercase tracking-tighter">{s.split(' - ')[1]}</span>
                         <span className="text-[10px] font-black opacity-60 bg-white/50 px-2 py-1 rounded-md">{s.split(' - ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Inclusions Display */}
            <div className="relative group overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-xl">
              <div className={`p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-6 md:gap-10 transition-all duration-500 ${isMorning ? 'bg-amber-600' : 'blue-gradient'}`}>
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white/25 rounded-3xl flex items-center justify-center text-4xl md:text-5xl backdrop-blur-xl animate-float border border-white/20">
                      <i className={isMorning ? "fas fa-utensils" : "fas fa-hamburger"}></i>
                  </div>
                  <div className="text-center md:text-left">
                      <p className="text-[10px] font-black uppercase opacity-80 tracking-[0.35em] mb-2">Exclusive Offer Included</p>
                      <h5 className="text-xl md:text-3xl font-black uppercase leading-tight tracking-tight">{currentOffer}</h5>
                  </div>
                  <i className="fas fa-certificate absolute -right-6 -bottom-6 text-white/10 text-[10rem] md:text-[14rem]"></i>
              </div>
            </div>

            {/* Step 3: Guests */}
            <section className="space-y-5 md:space-y-7">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.25em] flex items-center gap-4">
                <span className="w-6 h-6 md:w-8 md:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[10px] md:text-[12px] shadow-lg shadow-blue-200">2</span>
                Guest Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="p-5 md:p-7 bg-slate-100/50 rounded-3xl flex justify-between items-center border border-slate-200">
                  <label className="text-sm font-black text-slate-800">Adults <br/><span className="text-blue-600 font-bold text-[11px] uppercase tracking-widest">₹{adultRate} Each</span></label>
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-300 shadow-sm">
                    <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-xl hover:bg-slate-100">-</button>
                    <span className="w-8 text-center font-black text-lg md:text-xl text-blue-700">{adults}</span>
                    <button onClick={() => setAdults(adults+1)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-xl hover:bg-slate-100">+</button>
                  </div>
                </div>
                <div className="p-5 md:p-7 bg-slate-100/50 rounded-3xl flex justify-between items-center border border-slate-200">
                  <label className="text-sm font-black text-slate-800">Children <br/><span className="text-blue-600 font-bold text-[11px] uppercase tracking-widest">₹{kidRate} Each</span></label>
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-300 shadow-sm">
                    <button onClick={() => setKids(Math.max(0, kids-1))} className="w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-xl hover:bg-slate-100">-</button>
                    <span className="w-8 text-center font-black text-lg md:text-xl text-blue-700">{kids}</span>
                    <button onClick={() => setKids(kids+1)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-xl hover:bg-slate-100">+</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4">
          <div className="card-premium p-8 md:p-10 bg-[#1B2559] text-white lg:sticky lg:top-32 overflow-hidden shadow-2xl border-none">
            <div className="relative z-10">
              <h4 className="text-[11px] font-black uppercase opacity-50 tracking-[0.4em] mb-10 text-center">Reservation Folio</h4>
              <div className="space-y-5 md:space-y-7">
                <div className="flex justify-between items-center text-sm md:text-base font-bold">
                  <span className="text-slate-400">Guest Count</span>
                  <span className="text-white">{adults + kids} People</span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base font-bold">
                  <span className="text-slate-400">Admission Subtotal</span>
                  <span className="text-white">₹{pricingData.subtotal}</span>
                </div>
                {pricingData.discount > 0 && (
                  <div className="flex justify-between items-center text-sm md:text-base font-black text-emerald-400">
                    <span className="uppercase tracking-widest text-[11px]">Early Bird Benefit</span>
                    <span>- ₹{pricingData.discount}</span>
                  </div>
                )}
                <div className="pt-8 md:pt-10 border-t border-white/20 mt-6 md:mt-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] font-black uppercase opacity-40 mb-2 tracking-[0.2em]">Total Fee Payable</p>
                      <p className="text-5xl md:text-6xl font-black tracking-tighter">₹{pricingData.total}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleCheckout} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 md:py-6 rounded-[2rem] mt-10 md:mt-14 transition-all shadow-2xl shadow-blue-900/60 uppercase tracking-widest text-sm md:text-base active:scale-95">
                Confirm & Pay
              </button>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          </div>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white p-8 md:p-14 rounded-t-[3rem] md:rounded-[3.5rem] max-w-xl w-full animate-fade shadow-2xl max-h-[95vh] overflow-y-auto border-t-8 border-blue-600">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Park Protocol</h3>
              <p className="text-slate-600 text-sm mt-3 font-bold uppercase tracking-widest">Safety & Admission Rules</p>
            </div>
            <div className="space-y-4 mb-10">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-5 items-start bg-slate-100 p-5 rounded-2xl border border-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-1">{i+1}</div>
                    <p className="text-[13px] font-bold text-slate-700 leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
            <div className="space-y-5">
              <label className="flex items-center gap-5 bg-blue-50 p-6 rounded-3xl cursor-pointer border-2 border-blue-200 shadow-inner">
                <input type="checkbox" className="w-7 h-7 rounded-xl accent-blue-600 border-2 border-blue-300" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span className="text-sm font-black uppercase text-[#1B2559] tracking-tight">I acknowledge the Resort Policy</span>
              </label>
              <div className="grid grid-cols-2 gap-5">
                  <button onClick={() => setShowTerms(false)} className="py-5 font-black uppercase text-[11px] tracking-widest text-slate-500 hover:text-slate-800">Go Back</button>
                  <button onClick={finalProceed} disabled={!acceptedTerms} className="bg-[#1B2559] text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-30 shadow-xl shadow-blue-200">Proceed to Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
