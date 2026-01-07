import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings }) => {
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

    const hasEarlyBird = date && alreadyBooked < 100;
    let discountPercent = hasEarlyBird ? settings.earlyBirdDiscount : 0;
    
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent, isEligible: hasEarlyBird };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const handleCheckout = () => {
    if (!date) return alert("Please select a visit date first.");
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
    <div className="max-w-7xl mx-auto flex flex-col items-center animate-smart px-6 py-12 md:py-20 font-['Plus_Jakarta_Sans']">
      
      <div className="mb-16 text-center">
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Reservation</h2>
        <div className="h-1 w-20 bg-slate-900/10 mx-auto rounded-full mb-6"></div>
        <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.6em]">Secure Your Premium Entry Passes</p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 items-start">
        
        {/* Reservation Terminal */}
        <div className="w-full bg-white rounded-[4rem] p-10 md:p-20 space-y-20 flex flex-col items-center border border-slate-100 shadow-sm relative overflow-hidden">
          
          {/* Step 1: Date */}
          <div className="w-full max-w-md space-y-6 flex flex-col items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">I. Appointment Date</label>
            <input 
              type="date" 
              className="input-premium h-20 text-2xl font-black bg-slate-50 border-transparent hover:border-slate-200" 
              onChange={e => setDate(e.target.value)} 
              min={new Date().toISOString().split('T')[0]} 
              value={date} 
            />
            {pricingData.isEligible && (
              <div className="mt-4 px-10 py-3 bg-emerald-50 rounded-full border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-3 animate-pulse">
                <i className="fas fa-bolt text-xs"></i> Early Bird Status: {settings.earlyBirdDiscount}% Off Applied
              </div>
            )}
          </div>

          {/* Step 2: Slot Selection */}
          <div className="w-full flex flex-col items-center space-y-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">II. Entry Session</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              {TIME_SLOTS.map(s => (
                <button 
                  key={s} 
                  onClick={() => setSlot(s)} 
                  className={`p-12 rounded-[3rem] border-2 transition-all flex flex-col items-center text-center ${slot === s ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300'}`}
                >
                  <p className="text-xl font-black uppercase tracking-widest mb-2 leading-none">{s.split(': ')[0]}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest opacity-40`}>{s.split(': ')[1]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Headcount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
            <div className="p-12 bg-slate-50 rounded-[3.5rem] border border-slate-100 flex flex-col items-center space-y-8 group hover:bg-white hover:border-slate-200 hover:shadow-xl transition-all">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Adult Entry</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">₹{adultRate}</p>
              </div>
              <div className="flex items-center gap-12">
                <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-2xl hover:bg-slate-900 hover:text-white transition-all">-</button>
                <span className="font-black text-6xl text-slate-900 w-12 text-center">{adults}</span>
                <button onClick={() => setAdults(adults+1)} className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-2xl hover:bg-slate-900 hover:text-white transition-all">+</button>
              </div>
            </div>
            <div className="p-12 bg-slate-50 rounded-[3.5rem] border border-slate-100 flex flex-col items-center space-y-8 group hover:bg-white hover:border-slate-200 hover:shadow-xl transition-all">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kid Entry</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">₹{kidRate}</p>
              </div>
              <div className="flex items-center gap-12">
                <button onClick={() => setKids(Math.max(0, kids-1))} className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-2xl hover:bg-slate-900 hover:text-white transition-all">-</button>
                <span className="font-black text-6xl text-slate-900 w-12 text-center">{kids}</span>
                <button onClick={() => setKids(kids+1)} className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-2xl hover:bg-slate-900 hover:text-white transition-all">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Concierge Summary Panel */}
        <div className="sticky top-28 flex flex-col gap-10 w-full">
          <div className="w-full bg-slate-900 p-12 md:p-16 rounded-[4.5rem] text-white shadow-3xl relative overflow-hidden flex flex-col items-center text-center border border-white/5">
             <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-12 border border-white/10 shadow-inner">
                  <i className="fas fa-ticket text-2xl text-blue-400"></i>
                </div>
                <h4 className="text-[11px] font-black uppercase opacity-30 tracking-[0.6em] mb-14">Settlement Preview</h4>
                
                <div className="w-full space-y-8 mb-16 pb-12 border-b border-white/10">
                   <div className="flex justify-between items-center px-6">
                      <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Base Yield</span>
                      <span className="text-2xl font-black">₹{pricingData.subtotal}</span>
                   </div>
                   {pricingData.discount > 0 && (
                     <div className="flex justify-between items-center px-6 text-emerald-400">
                        <span className="text-[12px] font-black uppercase tracking-widest">Resort Offer</span>
                        <span className="text-2xl font-black">- ₹{pricingData.discount}</span>
                     </div>
                   )}
                </div>

                <div className="mb-16 flex flex-col items-center">
                   <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.8em] mb-4">Net Amount Payable</p>
                   <p className="text-8xl md:text-[7rem] font-black tracking-tighter leading-none">₹{pricingData.total}</p>
                </div>

                <div className="w-full bg-white/5 p-8 rounded-[3rem] border border-white/5 flex items-center justify-center gap-5 backdrop-blur-xl">
                   <i className="fas fa-gift text-amber-500 text-2xl"></i>
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-tight text-white/80">{currentOffer}</p>
                </div>
             </div>
             <i className="fas fa-water absolute -right-32 -bottom-32 text-white/5 text-[28rem] -rotate-12 opacity-50"></i>
          </div>

          <button onClick={handleCheckout} className="btn-modern !h-24 !rounded-[3.5rem] shadow-3xl !bg-blue-600 text-xl font-black tracking-[0.2em] group">
             Proceed to Pay <i className="fas fa-arrow-right ml-4 text-xs transition-transform group-hover:translate-x-2"></i>
          </button>
        </div>

      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-smart">
          <div className="bg-white rounded-[5rem] max-w-xl w-full p-14 md:p-20 shadow-2xl relative flex flex-col items-center text-center overflow-y-auto max-h-[95vh] border border-slate-100">
            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-12 leading-none">Resort Protocols</h3>
            <div className="w-full space-y-6 mb-16 text-left">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-8 p-8 bg-slate-50 rounded-[3rem] items-center border border-slate-100 group hover:bg-slate-100 transition-all">
                  <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">{i+1}</span>
                  <p className="text-[13px] font-bold text-slate-600 uppercase tracking-tight leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
            <label className="w-full flex items-center justify-center gap-8 cursor-pointer p-12 bg-slate-50 rounded-[3.5rem] mb-14 border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/50 transition-all">
              <input type="checkbox" className="w-8 h-8 accent-slate-900 rounded-xl cursor-pointer" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">I acknowledge safety rules</span>
            </label>
            <div className="w-full grid grid-cols-2 gap-8">
              <button onClick={() => setShowTerms(false)} className="py-6 font-black text-slate-300 uppercase text-[12px] tracking-widest hover:text-slate-900 transition-colors">Go Back</button>
              <button onClick={finalProceed} disabled={!acceptedTerms} className="btn-modern !h-20 disabled:opacity-20 text-[12px] !rounded-[2.5rem] !bg-slate-900">Authorize Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGate;
