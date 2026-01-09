import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings; bookings: Booking[] }> = ({ settings, bookings }) => {
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
  const offerText = isMorning ? OFFERS.MORNING : OFFERS.EVENING;

  const shiftTiers = isMorning ? settings.discounts.morning.tiers : settings.discounts.evening.tiers;

  const pricingData = useMemo(() => {
    const subtotal = adults * adultRate + kids * kidRate;

    const alreadyBooked = bookings
      .filter(b => b.date === date && b.time === slot && b.status === 'confirmed')
      .reduce((sum, b) => sum + b.adults + b.kids, 0);

    let remaining = alreadyBooked;
    let discountPercent = 0;

    for (const tier of shiftTiers) {
      if (remaining < tier.maxGuests) {
        discountPercent = tier.discountPercent;
        break;
      }
      remaining -= tier.maxGuests;
    }

    const discountAmount = Math.round(subtotal * discountPercent / 100);

    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, shiftTiers]);

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
    <div className="w-full flex flex-col items-center animate-slide-up pb-10">

      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase mb-2">Reservation</h2>
        <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.4em]">Spray Aqua Resort Premium Terminal</p>
      </div>

      <div className="w-full max-w-4xl glass-card rounded-[2rem] p-8 md:p-14 space-y-14">

        {/* Visit Details */}
        <section className="space-y-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="w-8 h-8 bg-slate-900 rounded-md text-white flex items-center justify-center text-[10px] font-bold">01</span>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Visit Schedule</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <input type="date" className="input-premium text-center" value={date} onChange={e => setDate(e.target.value)} />
            <div className="space-y-3">
              {TIME_SLOTS.map(s => (
                <button key={s} onClick={() => setSlot(s)} className={`w-full p-5 rounded-xl border transition-all ${slot === s ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white border-slate-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Offer */}
        <section className="bg-emerald-100 text-emerald-900 px-6 py-4 rounded-xl text-center text-sm font-black uppercase tracking-widest">
          🎁 {offerText}
        </section>

        {/* Quantity */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white/50 rounded-2xl border flex justify-between">
            <span>Adults ₹{adultRate}</span>
            <input type="number" min={1} value={adults} onChange={e => setAdults(+e.target.value)} />
          </div>
          <div className="p-8 bg-white/50 rounded-2xl border flex justify-between">
            <span>Kids ₹{kidRate}</span>
            <input type="number" min={0} value={kids} onChange={e => setKids(+e.target.value)} />
          </div>
        </section>

        {/* Summary */}
        <section className="bg-slate-900 p-10 rounded-3xl text-white space-y-4 text-center">
          <div className="flex justify-between">
            <span>Total</span>
            <span>₹{pricingData.subtotal}</span>
          </div>

          {pricingData.discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Early Bird Discount ({pricingData.discountPercent}%)</span>
              <span>- ₹{pricingData.discount}</span>
            </div>
          )}

          <div className="border-t pt-6 text-5xl font-black">₹{pricingData.total}</div>

          <button onClick={handleCheckout} className="btn-resort w-full mt-6">Review & Checkout</button>
        </section>

      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-3xl max-w-xl w-full space-y-6">
            {TERMS_AND_CONDITIONS.map((t, i) => <p key={i}>{t}</p>)}
            <label className="flex gap-3">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              I agree
            </label>
            <button onClick={finalProceed} className="btn-resort w-full">Confirm</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingGate;
