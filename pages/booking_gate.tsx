
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
    let tierText = "Standard Price";

    if (date) {
      if (alreadyBooked < 100) {
        discountPercent = settings.earlyBirdDiscount;
        tierText = `Tier 1: ${discountPercent}% Discount!`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `Tier 2: ${discountPercent}% Discount!`;
      }
    }

    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent, tierText };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const finalProceed = () => {
    if (!acceptedTerms) return alert("Accept terms.");
    const draft = { date, time: slot, adults, kids, totalAmount: pricingData.total, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade space-y-8">
      <h2 className="text-3xl font-black text-[#1B2559] uppercase">Splash Plan</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] card-shadow border border-white space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase">Date</label>
            <input type="date" className="input-field" onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={date} />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase">Shift</label>
            <div className="grid grid-cols-2 gap-4">
              {TIME_SLOTS.map(s => (
                <button key={s} onClick={() => setSlot(s)} className={`p-5 rounded-3xl border-2 text-left ${slot === s ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100'}`}>
                   <p className="font-black text-sm">{s.split(' - ')[1]}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase">Adults</label>
              <input type="number" min="1" className="input-field" value={adults} onChange={e => setAdults(Number(e.target.value))} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase">Kids</label>
              <input type="number" min="0" className="input-field" value={kids} onChange={e => setKids(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <div className="bg-[#1B2559] p-8 rounded-[3rem] text-white">
           <p className="text-4xl font-black">₹{pricingData.total}</p>
           <button onClick={() => setShowTerms(true)} className="w-full btn-primary py-6 mt-6">Checkout</button>
        </div>
      </div>
      {showTerms && (
        <div className="fixed inset-0 z-[200] bg-[#1B2559]/80 flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[3rem] max-w-lg w-full">
            <h3 className="text-2xl font-black mb-6">Terms & Rules</h3>
            <ul className="text-sm text-gray-600 space-y-2 mb-8">
              {TERMS_AND_CONDITIONS.map((t, i) => <li key={i}>• {t}</li>)}
            </ul>
            <label className="flex items-center gap-3 mb-8 cursor-pointer">
              <input type="checkbox" className="w-6 h-6" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-xs font-black uppercase">I accept</span>
            </label>
            <button onClick={finalProceed} disabled={!acceptedTerms} className="w-full btn-primary py-4">Confirm Payment</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGate;
