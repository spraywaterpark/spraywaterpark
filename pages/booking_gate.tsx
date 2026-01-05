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
        tierText = `Tier 1 Discount: ${discountPercent}% OFF`;
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
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1B2559] tracking-tight">Reserve Your Experience</h2>
          <p className="text-slate-400 font-medium text-sm mt-1">Book your visit to Spray Aqua Resort.</p>
        </div>
        {date && pricingData.discountPercent > 0 && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-green-100 animate-pulse">
            <i className="fas fa-bolt mr-2"></i> {pricingData.tierText}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Reservation Details */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="card-premium p-6 md:p-12 space-y-8 md:space-y-12">
            
            {/* Step 1: Date & Time */}
            <section className="space-y-4 md:space-y-6">
              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] md:text-[10px]">1</span>
                Visit Schedule
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-2 md:space-y-3">
                  <label className="text-xs md:text-sm font-bold text-slate-600 ml-1">Select Date</label>
                  <input 
                    type="date" 
                    className="input-premium text-base md:text-lg" 
                    onChange={e => setDate(e.target.value)} 
                    min={new Date().toISOString().split('T')[0]} 
                    value={date} 
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <label className="text-xs md:text-sm font-bold text-slate-600 ml-1">Choose Shift</label>
                  <div className="flex flex-col gap-2 md:gap-3">
                    {TIME_SLOTS.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setSlot(s)} 
                        className={`p-3 md:p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${slot === s ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}
                      >
                         <span className="font-bold text-xs md:text-sm uppercase">{s.split(' - ')[1]}</span>
                         <span className="text-[9px] md:text-[10px] font-black opacity-40">{s.split(' - ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Inclusions Display */}
            <div className="relative group overflow-hidden rounded-[1.5rem] md:rounded-3xl">
              <div className={`p-6 md:p-10 text-white flex flex-col md:flex-row items-center gap-4 md:gap-8 transition-all duration-500 ${isMorning ? 'bg-amber-500' : 'blue-gradient'}`}>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl backdrop-blur-md animate-float">
                      <i className={isMorning ? "fas fa-utensils" : "fas fa-hamburger"}></i>
                  </div>
                  <div className="text-center md:text-left">
                      <p className="text-[9px] font-bold uppercase opacity-60 tracking-[0.3em] mb-1">Included With Your Ticket</p>
                      <h5 className="text-lg md:text-2xl font-black uppercase leading-tight">{currentOffer}</h5>
                  </div>
                  <i className="fas fa-medal absolute -right-4 -bottom-4 text-white/10 text-7xl md:text-9xl"></i>
              </div>
            </div>

            {/* Step 3: Guests */}
            <section className="space-y-4 md:space-y-6">
              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] md:text-[10px]">2</span>
                Guest Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="p-4 md:p-6 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Adults <br/><span className="text-slate-400 font-medium text-xs">₹{adultRate}</span></label>
                  <div className="flex items-center gap-3 md:gap-4 bg-white p-1.5 md:p-2 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-8 h-8 md:w-10 md:h-10 rounded-lg font-bold">-</button>
                    <span className="w-6 text-center font-bold text-base md:text-lg">{adults}</span>
                    <button onClick={() => setAdults(adults+1)} className="w-8 h-8 md:w-10 md:h-10 rounded-lg font-bold">+</button>
                  </div>
                </div>
                <div className="p-4 md:p-6 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Children <br/><span className="text-slate-400 font-medium text-xs">₹{kidRate}</span></label>
                  <div className="flex items-center gap-3 md:gap-4 bg-white p-1.5 md:p-2 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => setKids(Math.max(0, kids-1))} className="w-8 h-8 md:w-10 md:h-10 rounded-lg font-bold">-</button>
                    <span className="w-6 text-center font-bold text-base md:text-lg">{kids}</span>
                    <button onClick={() => setKids(kids+1)} className="w-8 h-8 md:w-10 md:h-10 rounded-lg font-bold">+</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4">
          <div className="card-premium p-8 md:p-10 bg-[#1B2559] text-white lg:sticky lg:top-32 overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h4 className="text-[10px] font-bold uppercase opacity-40 tracking-[0.3em] mb-8 md:mb-12 text-center">Reservation Folio</h4>
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Guest Capacity</span>
                  <span className="font-bold">{adults + kids} People</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Admission Subtotal</span>
                  <span className="font-bold">₹{pricingData.subtotal}</span>
                </div>
                {pricingData.discount > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-400 font-bold">
                    <span>Loyalty Benefit</span>
                    <span>- ₹{pricingData.discount}</span>
                  </div>
                )}
                <div className="pt-6 md:pt-8 border-t border-white/10 mt-4 md:mt-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-30 mb-1">Total Fee Payable</p>
                      <p className="text-4xl md:text-5xl font-extrabold tracking-tighter">₹{pricingData.total}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleCheckout} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 md:py-5 rounded-2xl mt-8 md:mt-12 transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest text-sm">
                Confirm & Pay
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          </div>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white p-8 md:p-14 rounded-t-[32px] md:rounded-[32px] max-w-xl w-full animate-fade shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-extrabold text-[#1B2559] uppercase tracking-tight">Park Protocol</h3>
              <p className="text-slate-400 text-sm mt-2">Please acknowledge our safety and entry rules.</p>
            </div>
            <div className="space-y-3 mb-8">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
                    <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-4 bg-blue-50/50 p-5 rounded-2xl cursor-pointer border border-blue-100/50">
                <input type="checkbox" className="w-6 h-6 rounded-lg accent-blue-600" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span className="text-xs font-bold uppercase text-[#1B2559] tracking-wider">I agree to the Resort Policy</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setShowTerms(false)} className="py-4 font-bold uppercase text-xs text-slate-400">Cancel</button>
                  <button onClick={finalProceed} disabled={!acceptedTerms} className="bg-[#1B2559] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-20">Pay Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
