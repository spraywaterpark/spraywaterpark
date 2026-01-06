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
        tierText = `Tier 1 Discount Active: ${discountPercent}%`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `Tier 2 Discount Active: ${discountPercent}%`;
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
    <div className="w-full flex flex-col items-center animate-reveal">
      <div className="w-full max-w-4xl text-center mb-12">
        <h2 className="text-5xl font-extrabold text-white tracking-tighter uppercase mb-2">Reservation</h2>
        <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.4em]">Spray Aqua Resort Premium Terminal</p>
      </div>

      <div className="w-full max-w-4xl">
        <div className="glass-card p-10 md:p-16 space-y-16">
          {/* Section 1: DATE & TIME */}
          <section className="space-y-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="w-10 h-10 bg-slate-900 rounded-xl text-white flex items-center justify-center text-xs font-black">01</span>
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Plan Your Visit</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Visiting Date</label>
                <input type="date" className="input-premium text-center" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Time Slot</label>
                <div className="space-y-4">
                  {TIME_SLOTS.map(s => {
                    const isActive = slot === s;
                    return (
                      <button key={s} onClick={() => setSlot(s)} className={`w-full p-6 rounded-2xl border-2 transition-all flex justify-between items-center text-left ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-105' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                         <div>
                            <p className="text-xs font-black uppercase tracking-wide">{s.split(': ')[0]}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60`}>{s.split(': ')[1]}</p>
                         </div>
                         {isActive && <i className="fas fa-check-circle text-xs"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: MEAL OFFER VISUAL (RESTORED) */}
          <section className="flex flex-col items-center">
              <div className="w-full bg-slate-950/5 border border-slate-200 p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex items-center gap-8">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shadow-xl border-4 border-white text-white ${isMorning ? 'bg-amber-500' : 'bg-indigo-600'} transition-colors duration-500`}>
                          <i className={isMorning ? "fas fa-utensils" : "fas fa-concierge-bell"}></i>
                      </div>
                      <div className="text-center md:text-left">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Session Special</p>
                          <h5 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{currentOffer.split(' (')[0]}</h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 opacity-80">{currentOffer.match(/\(([^)]+)\)/)?.[1] || "Inclusive Guest Privilege"}</p>
                      </div>
                  </div>
                  {date && pricingData.discountPercent > 0 && (
                      <div className="bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full text-[10px] font-black uppercase border border-emerald-200 animate-pulse">
                          {pricingData.tierText}
                      </div>
                  )}
              </div>
          </section>

          {/* Section 3: QUANTITY */}
          <section className="space-y-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="w-10 h-10 bg-slate-900 rounded-xl text-white flex items-center justify-center text-xs font-black">02</span>
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Pass Selection</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="p-10 bg-white/60 rounded-[2.5rem] border border-slate-200 flex justify-between items-center shadow-sm">
                <div className="text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Adult Ticket</label>
                  <span className="text-slate-900 text-2xl font-black">₹{adultRate}</span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-10 h-10 border-2 border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center font-bold">-</button>
                  <span className="text-xl font-black w-6 text-center">{adults}</span>
                  <button onClick={() => setAdults(adults+1)} className="w-10 h-10 border-2 border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center font-bold">+</button>
                </div>
              </div>
              <div className="p-10 bg-white/60 rounded-[2.5rem] border border-slate-200 flex justify-between items-center shadow-sm">
                <div className="text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Child Ticket</label>
                  <span className="text-slate-900 text-2xl font-black">₹{kidRate}</span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={() => setKids(Math.max(0, kids-1))} className="w-10 h-10 border-2 border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center font-bold">-</button>
                  <span className="text-xl font-black w-6 text-center">{kids}</span>
                  <button onClick={() => setKids(kids+1)} className="w-10 h-10 border-2 border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center font-bold">+</button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: CHECKOUT SUMMARY */}
          <section className="pt-16 border-t border-slate-100 flex flex-col items-center">
              <div className="w-full max-w-md bg-slate-900 p-12 rounded-[3.5rem] text-white space-y-10 text-center shadow-3xl">
                  <div>
                      <p className="text-[11px] font-bold uppercase opacity-30 mb-3 tracking-[0.5em]">Total Amount</p>
                      <p className="text-7xl font-black tracking-tighter leading-none">₹{pricingData.total}</p>
                  </div>
                  <button onClick={handleCheckout} className="w-full btn-resort !bg-white !text-slate-900 hover:!bg-slate-100 shadow-2xl h-20 text-lg">
                    Confirm & Proceed
                  </button>
              </div>
          </section>
        </div>
      </div>

      {/* T&C MODAL */}
      {showTerms && (
        <div className="fixed inset-0 z-[500] bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-6 animate-reveal">
          <div className="bg-white rounded-[3rem] max-w-2xl w-full p-12 md:p-16 shadow-3xl relative border border-slate-200">
            <button onClick={() => setShowTerms(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors">
              <i className="fas fa-times text-2xl"></i>
            </button>
            <div className="text-center mb-10">
              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Resort Rules</h3>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-3">Please review before confirming</p>
            </div>
            <div className="space-y-6 mb-16 max-h-[35vh] overflow-y-auto pr-4 custom-scrollbar">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-black text-slate-400 mt-0.5">{String(i+1).padStart(2, '0')}</span>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed uppercase tracking-tight">{t}</p>
                </div>
              ))}
            </div>
            <div className="space-y-10">
              <label className="flex items-center gap-6 cursor-pointer p-6 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-colors group">
                <input type="checkbox" className="w-8 h-8 rounded-lg border-2 border-slate-300 accent-slate-900 cursor-pointer" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span className="text-xs font-black text-slate-950 uppercase tracking-widest group-hover:text-blue-600">I acknowledge & accept resort policy</span>
              </label>
              <button onClick={finalProceed} disabled={!acceptedTerms} className="w-full btn-resort h-20 text-lg disabled:opacity-20">
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
