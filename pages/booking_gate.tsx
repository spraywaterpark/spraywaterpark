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
        tierText = `Tier 1: ${discountPercent}% Early Bird OFF`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `Tier 2: ${discountPercent}% Discount Applied`;
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
    <div className="max-w-7xl mx-auto px-6 py-4 space-y-10 animate-fade">
      <header>
        <h2 className="text-4xl font-black text-[#1B2559] tracking-tighter uppercase">Plan Your Day</h2>
        <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-[0.3em]">Premium Resort Experience</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white rounded-[32px] p-10 md:p-14 border border-slate-300 shadow-xl space-y-12">
            
            {/* Step 1: Schedule */}
            <section className="space-y-8">
              <h4 className="text-[11px] font-black text-[#1B2559] uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl blue-gradient text-white flex items-center justify-center text-[12px] shadow-lg">01</span>
                Schedule Selection
              </h4>
              <div className="grid grid-cols-1 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest ml-1">Visit Date</label>
                  <input type="date" className="input-luxury border-slate-400" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest ml-1">Shift Timing & Activity Details</label>
                  <div className="grid grid-cols-1 gap-4">
                    {TIME_SLOTS.map(s => {
                      const [title, details] = s.split(': ');
                      const [timeRange, activityInfo] = details.split(' (');
                      return (
                        <button 
                          key={s} 
                          onClick={() => setSlot(s)} 
                          className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex flex-col gap-2 ${slot === s ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 hover:border-blue-300'}`}
                        >
                           <div className="flex items-center justify-between w-full">
                              <span className="font-black text-lg uppercase tracking-tight">{title}</span>
                              <span className="text-[10px] font-black bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-blue-600">{timeRange}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                {activityInfo.replace(')', '')}
                              </span>
                           </div>
                           {slot === s && <div className="mt-2 text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] italic">Selected Schedule</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Meal Offer Banner */}
            <div className={`p-10 rounded-[2.5rem] text-white flex items-center gap-8 relative overflow-hidden shadow-2xl ${isMorning ? 'bg-amber-600' : 'blue-gradient'}`}>
                <div className="w-20 h-20 bg-white/30 rounded-3xl flex items-center justify-center text-4xl backdrop-blur-md border border-white/20">
                    <i className="fas fa-utensils"></i>
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase opacity-70 tracking-[0.4em] mb-2">Complimentary Meal Included</p>
                    <h5 className="text-2xl md:text-3xl font-black uppercase leading-tight">{currentOffer}</h5>
                </div>
            </div>

            {/* Step 3: Guests */}
            <section className="space-y-8">
              <h4 className="text-[11px] font-black text-[#1B2559] uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-8 h-8 rounded-xl blue-gradient text-white flex items-center justify-center text-[12px] shadow-lg">02</span>
                Guest Statistics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] flex justify-between items-center border border-slate-300">
                  <label className="text-sm font-black text-slate-800 uppercase leading-none">Adults<br/><span className="text-blue-600 text-[10px] mt-1 block">₹{adultRate}</span></label>
                  <div className="flex items-center gap-6 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-inner">
                    <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-12 h-12 font-black text-2xl text-slate-400 hover:text-blue-600">-</button>
                    <span className="w-8 text-center font-black text-2xl text-[#1B2559]">{adults}</span>
                    <button onClick={() => setAdults(adults+1)} className="w-12 h-12 font-black text-2xl text-slate-400 hover:text-blue-600">+</button>
                  </div>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] flex justify-between items-center border border-slate-300">
                  <label className="text-sm font-black text-slate-800 uppercase leading-none">Kids<br/><span className="text-blue-600 text-[10px] mt-1 block">₹{kidRate}</span></label>
                  <div className="flex items-center gap-6 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-inner">
                    <button onClick={() => setKids(Math.max(0, kids-1))} className="w-12 h-12 font-black text-2xl text-slate-400 hover:text-blue-600">-</button>
                    <span className="w-8 text-center font-black text-2xl text-[#1B2559]">{kids}</span>
                    <button onClick={() => setKids(kids+1)} className="w-12 h-12 font-black text-2xl text-slate-400 hover:text-blue-600">+</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4">
          <div className="bg-[#1B2559] p-10 rounded-[40px] text-white lg:sticky lg:top-32 shadow-2xl space-y-10">
              <h4 className="text-[11px] font-black uppercase opacity-50 tracking-[0.5em] text-center">Summary</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Total Heads</span>
                  <span className="text-xl font-black">{adults + kids} People</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Base Rate</span>
                  <span className="text-xl font-black">₹{pricingData.subtotal}</span>
                </div>
                {pricingData.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-black">
                    <span className="text-[11px] uppercase tracking-widest">Discount Applied</span>
                    <span className="text-xl">- ₹{pricingData.discount}</span>
                  </div>
                )}
                <div className="pt-10 border-t border-white/10 mt-10">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-3 tracking-[0.4em]">Final Amount</p>
                  <p className="text-6xl font-black tracking-tighter">₹{pricingData.total}</p>
                </div>
              </div>
              <button onClick={handleCheckout} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[24px] transition-all shadow-xl uppercase tracking-[0.3em] text-sm active:scale-95 border-b-4 border-blue-800">
                Checkout Now
              </button>
          </div>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[500] bg-[#1B2559]/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white p-10 md:p-14 rounded-[40px] max-w-2xl w-full animate-fade shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter text-center">Resort Policy</h3>
            <div className="space-y-4 my-10">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-6 items-start bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="w-8 h-8 rounded-lg blue-gradient text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-1">{i+1}</div>
                    <p className="text-[14px] font-bold text-slate-700 leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <label className="flex items-center gap-6 bg-blue-50 p-8 rounded-[2rem] cursor-pointer border-2 border-blue-400 shadow-md">
                <input type="checkbox" className="w-8 h-8 rounded-xl accent-blue-600" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span className="text-base font-black uppercase text-[#1B2559] tracking-tight">I Agree to All Terms & Rules</span>
              </label>
              <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => setShowTerms(false)} className="py-6 font-black uppercase text-[11px] tracking-widest text-slate-500">Back</button>
                  <button onClick={finalProceed} disabled={!acceptedTerms} className="btn-premium py-6 shadow-2xl disabled:opacity-30">Confirm Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
