import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, TERMS_AND_CONDITIONS } from '../constants';

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

  const offerText = isMorning
    ? "🎁 Free with every ticket: One Plate Chole Bhature"
    : "🎁 Free with every ticket: Buffet Dinner";

  const pricingData = useMemo(() => {
    const subtotal = (adults * adultRate) + (kids * kidRate);

    const todayBookings = bookings.filter(
      b => b.date === date && b.time === slot && b.status === 'confirmed'
    );

    const count = todayBookings.reduce((s, b) => s + b.adults + b.kids, 0);

    let discountPercent = 0;
    if (count < 100) discountPercent = 20;
    else if (count < 200) discountPercent = 10;

    const discount = Math.round(subtotal * discountPercent / 100);

    return {
      subtotal,
      discount,
      total: subtotal - discount,
      discountPercent
    };
  }, [date, slot, adults, kids, bookings, adultRate, kidRate]);

  const handleCheckout = () => {
    if (!date) return alert("Please select your visit date");
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
    <div className="w-full flex flex-col items-center pb-16">

      <div className="max-w-4xl w-full text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white uppercase">Reservation</h2>
        <p className="text-white/60 text-[10px] uppercase tracking-[0.4em] mt-2">
          Spray Aqua Resort Premium Terminal
        </p>
      </div>

      <div className="max-w-4xl w-full glass-card rounded-[2rem] p-8 md:p-14 space-y-12">

        {/* Date & Slot */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Visit Date</label>
            <input type="date" value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-premium text-center" />
          </div>

          <div className="space-y-3">
            <label className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Session</label>
            {TIME_SLOTS.map(s => (
              <button key={s}
                onClick={() => setSlot(s)}
                className={`w-full p-4 rounded-xl border transition-all ${slot === s ? 'bg-slate-900 text-white' : 'bg-white hover:border-slate-600'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Offer Banner */}
        <div className="bg-amber-100 border border-amber-300 text-amber-800 text-sm font-bold text-center py-3 rounded-xl shadow">
          {offerText}
        </div>

        {/* Quantity */}
        <div className="grid md:grid-cols-2 gap-6">
          {[{ label: 'Adults', value: adults, set: setAdults, rate: adultRate },
            { label: 'Kids', value: kids, set: setKids, rate: kidRate }].map((x, i) => (
              <div key={i} className="bg-white p-6 rounded-xl flex justify-between items-center border">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{x.label}</p>
                  <p className="text-lg font-black">₹{x.rate}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => x.set(Math.max(0, x.value - 1))} className="btn-circle">-</button>
                  <span className="font-black text-lg">{x.value}</span>
                  <button onClick={() => x.set(x.value + 1)} className="btn-circle">+</button>
                </div>
              </div>
            ))}
        </div>

        {/* Summary */}
        <div className="bg-slate-900 text-white p-10 rounded-3xl text-center space-y-6">

          <div className="flex justify-between text-sm opacity-70">
            <span>Total Amount</span>
            <span>₹{pricingData.subtotal}</span>
          </div>

          {pricingData.discount > 0 && (
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Early Bird Discount ({pricingData.discountPercent}%)</span>
              <span>- ₹{pricingData.discount}</span>
            </div>
          )}

          <div className="pt-6 border-t border-white/20">
            <p className="uppercase text-xs opacity-40">Payable Amount</p>
            <p className="text-5xl font-black">₹{pricingData.total}</p>
          </div>

          <button onClick={handleCheckout}
            className="btn-resort w-full bg-white text-slate-900 mt-6">
            Review & Checkout
          </button>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-xl w-full p-10 rounded-3xl space-y-6">
            <h3 className="text-2xl font-black text-center">Park Policy</h3>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <p key={i} className="text-sm text-slate-700">{t}</p>
              ))}
            </div>

            <label className="flex gap-3 items-center">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="font-bold text-sm">I accept all terms</span>
            </label>

            <button disabled={!acceptedTerms}
              onClick={finalProceed}
              className="btn-resort w-full">
              Confirm Reservation
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingGate;
