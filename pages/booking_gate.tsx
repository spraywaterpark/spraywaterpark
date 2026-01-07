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
        tierText = `Elite Tier Discount: ${discountPercent}%`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `Standard Discount: ${discountPercent}%`;
      }
    }

    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent, tierText };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const handleCheckout = () => {
    if (!date) return alert("Please select your visit date first.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    if (!acceptedTerms) return;
    const draft = { date, time: slot, adults, kids, totalAmount: pricingData.total, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full flex flex-col items-center animate-slide-up">
      {/* Centered Header */}
      <div className="w-full max-w-4xl text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase mb-2">Reservation</h2>
        <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.4em]">Spray Aqua Resort Premium Terminal</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="glass-card rounded-[2rem] p-8 md:p-14 space-y-14">
          
          {/* Section 1: VISIT DETAILS */}
          <section className="space-y-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="w-8 h-8 bg-slate-900 rounded-md text-white flex items-center justify-center text-[10px] font-bold">01</span>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Visit Schedule</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3 flex flex-col items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Preferred Date</label>
                <input type="date" className="input-premium text-center" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
                {date && pricingData.discountPercent > 0 && (
                  <p className="text-emerald-600 font-black text-[11px] uppercase tracking-widest mt-4 animate-pulse">
                    {pricingData.discountPercent}% WOW discount applied
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Available Sessions</label>
                <div className="space-y-3">
                  {TIME_SLOTS.map(s => {
                    const isActive = slot === s;
                    return (
                      <button key={s} onClick={() => setSlot(s)} className={`w-full p-5 rounded-xl border transition-all flex justify-between items-center text-left ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-300 bg-white hover:border-slate-600'}`}>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-wide">{s.split(': ')[0]}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60`}>{s.split(': ')[1]}</p>
                         </div>
                         {isActive && <i className="fas fa-check-circle text-xs"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: MEAL PRIVILEGE - FIXED VISUALS */}
          <section className="flex flex-col items-center">
              <div className="w-full bg-slate-950/5 border border-slate-900/10 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white/40 text-white ${isMorning ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                          <i className={isMorning ? "fas fa-utensils" : "fas fa-concierge-bell"}></i>
                      </div>
                      <div className="text-center md:text-left">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Guest Privilege Included</p>
                          <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight">{currentOffer.split(' (')[0]}</h5>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">{currentOffer.match(/\(([^)]+)\)/)?.[1] || "Selected Slot Only"}</p>
                      </div>
                  </div>
                  {date && pricingData.discountPercent > 0 && (
                      <div className="bg-emerald-100 text-emerald-800 px-5 py-2 rounded-full text-[10px] font-black uppercase border border-emerald-200">
                          {pricingData.tierText} Applied
                      </div>
                  )}
              </div>
          </section>

          {/* Section 3: QUANTITY */}
          <section className="space-y-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="w-8 h-8 bg-slate-900 rounded-md text-white flex items-center justify-center text-[10px] font-bold">02</span>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pass Selection</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white/50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div className="text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Adult Entry</label>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">3.5 feet and above</p>
                  <span className="text-slate-900 text-lg font-black">₹{adultRate}</span>
                </div>
                <div className="flex items-center gap-5">
                  <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-9 h-9 border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">-</button>
                  <span className="text-lg font-black w-4 text-center">{adults}</span>
                  <button onClick={() => setAdults(adults+1)} className="w-9 h-9 border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">+</button>
                </div>
              </div>
              <div className="p-8 bg-white/50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div className="text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Child Entry</label>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">between 2.5 feet to 3.5 feet</p>
                  <span className="text-slate-900 text-lg font-black">₹{kidRate}</span>
                </div>
                <div className="flex items-center gap-5">
                  <button onClick={() => setKids(Math.max(0, kids-1))} className="w-9 h-9 border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">-</button>
                  <span className="text-lg font-black w-4 text-center">{kids}</span>
                  <button onClick={() => setKids(kids+1)} className="w-9 h-9 border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">+</button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: SUMMARY & ACTION */}
          <section className="pt-10 border-t border-slate-100 flex flex-col items-center">
              <div className="w-full max-w-md bg-slate-900 p-10 rounded-3xl text-white space-y-8 text-center shadow-2xl">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">Reservation Summary</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-70">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="text-lg font-bold">₹{pricingData.subtotal}</span>
                  </div>
                  {pricingData.discount > 0 && (
                      <div className="flex justify-between items-center text-blue-400">
                          <span className="text-[10px] font-bold uppercase tracking-widest">Tier Discount</span>
                          <span className="text-lg font-bold">- ₹{pricingData.discount}</span>
                      </div>
                  )}
                  <div className="pt-6 border-t border-white/10">
                      <p className="text-[10px] font-bold uppercase opacity-30 mb-2 tracking-[0.4em]">Payable Amount</p>
                      <p className="text-6xl font-black tracking-tighter">₹{pricingData.total}</p>
                  </div>
                </div>

                <button onClick={handleCheckout} className="w-full btn-resort !bg-white !text-slate-900 hover:!bg-slate-100 shadow-xl mt-6">
                  Review & Checkout
                </button>
              </div>
          </section>
        </div>
      </div>

      {/* T&C MODAL - CENTERED */}
      {showTerms && (
        <div className="fixed inset-0 z-[500] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-slide-up">
          <div className="bg-white rounded-3xl max-w-xl w-full p-10 md:p-14 shadow-2xl relative border border-slate-200">
            <button onClick={() => setShowTerms(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>

            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Park Policy</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Please acknowledge resort guidelines</p>
            </div>

            <div className="space-y-4 mb-12 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-5 p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 mt-0.5">{String(i+1).padStart(2, '0')}</span>
                    <p className="text-[13px] font-semibold text-slate-700 leading-relaxed uppercase tracking-tight">{t}</p>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              <label className="flex items-center gap-5 cursor-pointer p-5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition-colors">
                <input type="checkbox" className="w-6 h-6 rounded border-slate-300 accent-slate-900" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span className="text-[11px] font-extrabold text-slate-950 uppercase tracking-widest">I acknowledge resort policy</span>
              </label>
              
              <button onClick={finalProceed} disabled={!acceptedTerms} className="w-full btn-resort h-16 disabled:opacity-20">
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
