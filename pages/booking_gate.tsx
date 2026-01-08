
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
    if (!date) {
      alert("Please select your visit date first. (कृपया पहले यात्रा की तारीख चुनें।)");
      return;
    }
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
    <div className="w-full flex flex-col items-center animate-slide-up pb-20">
      <div className="w-full max-w-4xl text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase mb-2">Reservation</h2>
        <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.4em]">Spray Aqua Resort Premium Terminal</p>
      </div>

      <div className="w-full max-w-4xl">
        <div className="glass-card rounded-[3rem] p-8 md:p-14 space-y-16 border border-white/40">
          
          {/* STEP 1: SCHEDULE */}
          <section className="space-y-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="px-4 py-1 bg-slate-900 rounded-full text-white text-[9px] font-black uppercase tracking-widest">Step 01</span>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Visit Schedule</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block text-center">Preferred Date</label>
                <input 
                  type="date" 
                  className="input-premium text-center text-lg" 
                  onChange={e => setDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]} 
                  value={date} 
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block text-center">Available Sessions</label>
                <div className="space-y-3">
                  {TIME_SLOTS.map(s => {
                    const isActive = slot === s;
                    return (
                      <button 
                        key={s} 
                        onClick={() => setSlot(s)} 
                        className={`w-full p-6 rounded-2xl border-2 transition-all flex justify-between items-center text-left ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'border-slate-100 bg-slate-50/50 hover:border-slate-300'}`}
                      >
                         <div>
                            <p className="text-[11px] font-black uppercase tracking-widest">{s.split(': ')[0]}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{s.split(': ')[1]}</p>
                         </div>
                         {isActive && <i className="fas fa-check-circle text-blue-400"></i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* PRIVILEGE BANNER */}
          <section>
              <div className="w-full bg-slate-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-6 z-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white/20 text-white ${isMorning ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                          <i className={isMorning ? "fas fa-utensils" : "fas fa-concierge-bell"}></i>
                      </div>
                      <div className="text-center md:text-left">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Guest Privilege Included</p>
                          <h5 className="text-xl font-black text-white uppercase tracking-tight">{currentOffer.split(' (')[0]}</h5>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">{currentOffer.match(/\(([^)]+)\)/)?.[1] || "Selected Slot Only"}</p>
                      </div>
                  </div>
                  {date && pricingData.discountPercent > 0 && (
                      <div className="z-10 bg-emerald-500 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest animate-pulse">
                          {pricingData.tierText} Applied
                      </div>
                  )}
                  <i className="fas fa-water absolute -right-10 -bottom-10 text-white/5 text-[10rem] rotate-12"></i>
              </div>
          </section>

          {/* STEP 2: PASSES */}
          <section className="space-y-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="px-4 py-1 bg-slate-900 rounded-full text-white text-[9px] font-black uppercase tracking-widest">Step 02</span>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pass Selection</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-xl transition-all">
                <div className="text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Adult Entry</label>
                  <span className="text-slate-900 text-2xl font-black tracking-tighter">₹{adultRate}</span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-12 h-12 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all text-lg font-bold shadow-sm">-</button>
                  <span className="text-2xl font-black w-6 text-center text-slate-900">{adults}</span>
                  <button onClick={() => setAdults(adults+1)} className="w-12 h-12 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all text-lg font-bold shadow-sm">+</button>
                </div>
              </div>
              <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-xl transition-all">
                <div className="text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Child Entry</label>
                  <span className="text-slate-900 text-2xl font-black tracking-tighter">₹{kidRate}</span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={() => setKids(Math.max(0, kids-1))} className="w-12 h-12 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all text-lg font-bold shadow-sm">-</button>
                  <span className="text-2xl font-black w-6 text-center text-slate-900">{kids}</span>
                  <button onClick={() => setKids(kids+1)} className="w-12 h-12 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all text-lg font-bold shadow-sm">+</button>
                </div>
              </div>
            </div>
          </section>

          {/* FINAL SUMMARY CALL TO ACTION */}
          <section className="pt-10 flex flex-col items-center">
              <div className="w-full max-w-xl bg-white border-2 border-slate-900 p-12 rounded-[3rem] space-y-8 text-center shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)]">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Order Summary</p>
                
                <div className="space-y-4 px-4">
                  <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Base Amount</span>
                      <span className="text-xl font-bold text-slate-900">₹{pricingData.subtotal}</span>
                  </div>
                  {pricingData.discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600">
                          <span className="text-[11px] font-black uppercase tracking-widest">Applied Savings</span>
                          <span className="text-xl font-bold">- ₹{pricingData.discount}</span>
                      </div>
                  )}
                  <div className="pt-8 border-t-2 border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.4em]">Total Payable Amount</p>
                      <p className="text-7xl font-black text-slate-900 tracking-tighter leading-none">₹{pricingData.total}</p>
                  </div>
                </div>

                <button onClick={handleCheckout} className="w-full btn-resort mt-6 h-20 text-lg group">
                  Review & Checkout <i className="fas fa-chevron-right ml-3 text-sm opacity-50 group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
          </section>
        </div>
      </div>

      {/* PARK POLICY POPUP WINDOW (AS REQUESTED) */}
      {showTerms && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-fade">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowTerms(false)}></div>
          
          {/* Popup Window Container */}
          <div className="bg-white rounded-[3.5rem] max-w-2xl w-full p-10 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative border border-white/20 animate-slide-up">
            
            <button 
              onClick={() => setShowTerms(false)} 
              className="absolute top-10 right-10 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="text-center mb-12">
              <div className="inline-block px-4 py-1 bg-blue-50 rounded-full text-blue-600 text-[9px] font-black uppercase tracking-widest mb-4">Final Confirmation</div>
              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Resort Policy</h3>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] mt-3">Please review and acknowledge the guidelines</p>
            </div>

            <div className="space-y-4 mb-14 max-h-[35vh] overflow-y-auto pr-4 custom-scrollbar">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
                    <span className="text-[12px] font-black text-blue-600 mt-0.5">{String(i+1).padStart(2, '0')}</span>
                    <p className="text-[14px] font-bold text-slate-700 leading-relaxed uppercase tracking-tight">{t}</p>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              <label className="flex items-center gap-6 cursor-pointer p-6 rounded-3xl border-2 border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-900 transition-all">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-8 h-8 rounded-xl border-slate-300 accent-slate-900 cursor-pointer shadow-inner" 
                    checked={acceptedTerms} 
                    onChange={e => setAcceptedTerms(e.target.checked)} 
                  />
                </div>
                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest leading-none">I strictly acknowledge resort policy</span>
              </label>
              
              <button 
                onClick={finalProceed} 
                disabled={!acceptedTerms} 
                className="w-full btn-resort h-24 text-xl shadow-2xl disabled:opacity-20 disabled:grayscale transition-all"
              >
                Confirm & Secure Payment <i className="fas fa-shield-alt ml-3 opacity-30"></i>
              </button>
            </div>
            
            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.6em] mt-10">Spray Aqua Resort • Secure Booking Platform</p>
          </div>
        </div>
      )}
      
      {/* Branding Footer */}
      <div className="mt-12 opacity-30 text-center">
         <p className="text-[10px] font-black text-white uppercase tracking-[0.8em]">Luxury Waterfront Destination</p>
      </div>
    </div>
  );
};
export default BookingGate;
