
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS } from '../constants';

const BookingPage: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings }) => {
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
    let tierText = "Standard Price";

    if (date) {
      if (alreadyBooked < 100) {
        discountPercent = settings.earlyBirdDiscount;
        tierText = `Tier 1: ${discountPercent}% Discount Applied!`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `Tier 2: ${discountPercent}% Discount Applied!`;
      } else {
        discountPercent = 0;
        tierText = "Capacity Reached (Standard Rates)";
      }
    }

    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { 
      subtotal, 
      discount: discountAmount, 
      total: subtotal - discountAmount, 
      discountPercent, 
      tierText 
    };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const handleCheckoutClick = () => {
    if (!date) return alert("Please select a date first!");
    if (settings.blockedDates.includes(date)) return alert("Sorry, the resort is closed on this date.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    if (!acceptedTerms) return alert("Please accept the terms and conditions to proceed.");
    
    const draft = { 
      date, 
      time: slot, 
      adults, 
      kids, 
      totalAmount: pricingData.total, 
      discountAmount: pricingData.discount,
      status: 'pending' 
    };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade space-y-8">
      <div className="px-2">
        <h2 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">Splash Plan</h2>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Book your tickets for Spray Aqua Resort</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] card-shadow border border-white space-y-8">
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2">
              <i className="fas fa-calendar-alt text-blue-500"></i> Select Date
            </label>
            <input 
              type="date" 
              className="input-field" 
              onChange={e => setDate(e.target.value)} 
              min={new Date().toISOString().split('T')[0]} 
              value={date} 
            />
            {date && pricingData.discountPercent > 0 && (
              <div className="flex flex-col bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 mt-2">
                 <div className="flex items-center gap-2">
                    <i className="fas fa-gift"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">{pricingData.tierText}</span>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80 pl-6 animate-pulse">Few tickets left for this offer!</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Choose Shift</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TIME_SLOTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden ${slot === s ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                >
                  <p className={`font-black text-sm uppercase ${slot === s ? 'text-blue-600' : 'text-[#1B2559]'}`}>{s.split(' - ')[1]}</p>
                  <p className="text-xs text-gray-400 font-bold mt-1">{s.split(' - ')[0]}</p>
                  {slot === s && <i className="fas fa-check-circle absolute top-4 right-4 text-blue-600"></i>}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Exclusive Offer</p>
                <p className="text-lg font-black">{currentOffer}</p>
             </div>
             <i className="fas fa-utensils absolute -right-4 -bottom-4 text-white/10 text-7xl"></i>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Adults (₹{adultRate})</label>
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black">-</button>
                <span className="flex-1 text-center font-black text-[#1B2559]">{adults}</span>
                <button onClick={() => setAdults(adults + 1)} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black">+</button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Kids (₹{kidRate})</label>
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <button onClick={() => setKids(Math.max(0, kids - 1))} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black">-</button>
                <span className="flex-1 text-center font-black text-[#1B2559]">{kids}</span>
                <button onClick={() => setKids(kids + 1)} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black">+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1B2559] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <h4 className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-8">Billing Summary</h4>
            
            <div className="space-y-4 mb-4">
              <div className="flex justify-between text-sm opacity-80">
                <span>Base Total</span>
                <span>₹{pricingData.subtotal}</span>
              </div>
              {pricingData.discount > 0 && (
                <div className="flex justify-between text-sm text-green-400 font-bold">
                  <span>Discount ({pricingData.discountPercent}%)</span>
                  <span>- ₹{pricingData.discount}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Payable</p>
                  <p className="text-4xl font-black">₹{pricingData.total}</p>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleCheckoutClick} className="w-full btn-primary py-6 text-lg shadow-2xl">
            Checkout Now <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1B2559]/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-fade space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <h3 className="text-2xl font-black text-[#1B2559] uppercase tracking-tight">Terms & Conditions</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Please review and accept before payment</p>
            </div>

            <div className="space-y-4 py-2">
              {TERMS_AND_CONDITIONS.map((term, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-blue-600">{i + 1}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 leading-relaxed">{term}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 rounded-lg border-2 border-gray-200 checked:bg-blue-600 checked:border-blue-600 appearance-none cursor-pointer"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  {acceptedTerms && <i className="fas fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[10px]"></i>}
                </div>
                <span className="text-xs font-black text-[#1B2559] uppercase tracking-wide">I accept all resort rules & terms</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowTerms(false)} 
                className="py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={finalProceed}
                disabled={!acceptedTerms}
                className="btn-primary py-4 text-sm disabled:opacity-50 disabled:grayscale"
              >
                Proceed to Pay <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
