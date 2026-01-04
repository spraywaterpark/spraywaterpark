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
        tierText = `🔥 TIER 1 DEAL: ${discountPercent}% Discount Applied!`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `⚡ TIER 2 DEAL: ${discountPercent}% Discount Applied!`;
      } else {
        tierText = "STANDARD RATE: Limited Tickets Remaining";
      }
    }

    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent, tierText };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const handleCheckout = () => {
    if (!date) return alert("Select a date for your visit.");
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
    <div className="max-w-6xl mx-auto pb-12 animate-fade">
      {/* Page Header */}
      <div className="mb-8 px-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter">Splash Booking</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Spray Aqua Resort • Direct Online Booking</p>
        </div>
        {date && (
            <div className="bg-blue-600 px-6 py-2 rounded-2xl text-white text-xs font-black uppercase animate-pulse">
                {pricingData.tierText || "Best Price Guaranteed"}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        {/* Main Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] card-shadow border border-white space-y-8">
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2">
                <i className="fas fa-calendar-alt text-blue-500"></i> Select Date
              </label>
              <input type="date" className="input-field text-lg" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Choose Your Shift</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TIME_SLOTS.map(s => (
                  <button key={s} onClick={() => setSlot(s)} className={`p-6 rounded-3xl border-2 text-left transition-all ${slot === s ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50/50'}`}>
                     <p className="font-black text-sm uppercase">{s.split(' - ')[1]}</p>
                     <p className="text-[10px] font-bold opacity-60 mt-1">{s.split(' - ')[0]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Offer Badge */}
            <div className={`p-6 rounded-[2rem] text-white flex items-center gap-6 shadow-xl relative overflow-hidden ${isMorning ? 'bg-orange-500' : 'blue-gradient'}`}>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md">
                    <i className={isMorning ? "fas fa-utensils" : "fas fa-hamburger"}></i>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Resort Special Offer</p>
                    <p className="text-lg font-black uppercase leading-tight">{currentOffer}</p>
                </div>
                <i className="fas fa-star absolute -right-6 -bottom-6 text-white/10 text-8xl"></i>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Adults (₹{adultRate}/pp)</label>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm text-lg">-</button>
                    <span className="flex-1 text-center font-black text-xl">{adults}</span>
                    <button onClick={() => setAdults(adults+1)} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm text-lg">+</button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Kids (₹{kidRate}/pp)</label>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <button onClick={() => setKids(Math.max(0, kids-1))} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm text-lg">-</button>
                    <span className="flex-1 text-center font-black text-xl">{kids}</span>
                    <button onClick={() => setKids(kids+1)} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm text-lg">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Checkout Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#1B2559] p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <h4 className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-10 text-center">Checkout Summary</h4>
            <div className="space-y-6">
                <div className="flex justify-between items-center text-xs font-bold opacity-60 uppercase">
                    <span>Tickets ({adults + kids})</span>
                    <span>₹{pricingData.subtotal}</span>
                </div>
                {pricingData.discount > 0 && (
                  <div className="flex justify-between items-center text-xs font-black text-green-400 uppercase">
                      <span>Early Bird Saved</span>
                      <span>- ₹{pricingData.discount}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Net Payable</p>
                        <p className="text-5xl font-black tracking-tighter">₹{pricingData.total}</p>
                    </div>
                </div>
            </div>
          </div>
          
          <button onClick={handleCheckout} className="w-full btn-primary py-7 text-xl shadow-2xl shadow-blue-100 uppercase tracking-widest">
             Proceed to Pay <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      {/* Terms Overlay */}
      {showTerms && (
        <div className="fixed inset-0 z-[200] bg-[#1B2559]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] max-w-lg w-full animate-fade">
            <h3 className="text-2xl font-black text-[#1B2559] uppercase mb-6 text-center">Resort Policy</h3>
            <div className="space-y-4 mb-10">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="flex gap-4 text-xs font-bold text-gray-500 leading-relaxed">
                    <span className="text-blue-600 font-black">•</span>
                    <p>{t}</p>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-4 bg-blue-50 p-6 rounded-2xl cursor-pointer mb-8 border border-blue-100">
              <input type="checkbox" className="w-6 h-6 rounded-lg accent-blue-600" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-[10px] font-black uppercase text-[#1B2559]">I understand & Agree to all Rules</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowTerms(false)} className="py-5 font-black uppercase text-xs text-gray-400">Cancel</button>
                <button onClick={finalProceed} disabled={!acceptedTerms} className="btn-primary py-5 text-sm uppercase disabled:opacity-30">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
