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

  const isMorning = slot.toLowerCase().includes('morning');

  const adultRate = isMorning ? settings.morningAdultRate : settings.eveningAdultRate;
  const kidRate = isMorning ? settings.morningKidRate : settings.eveningKidRate;

  const alreadyBooked = bookings
    .filter(b => b.date === date && b.time === slot && b.status === 'confirmed')
    .reduce((sum, b) => sum + b.adults + b.kids, 0);

  let discountPercent = 0;
  if (alreadyBooked < 100) discountPercent = 20;
  else if (alreadyBooked < 200) discountPercent = 10;

  const subtotal = adults * adultRate + kids * kidRate;
  const discount = Math.round(subtotal * discountPercent / 100);
  const total = subtotal - discount;

  const offerText = isMorning
    ? "🎁 FREE: One Plate Chole Bhature with every ticket"
    : "🎁 FREE: Buffet Dinner with every ticket";

  const handleCheckout = () => {
    if (!date) return alert("Please select your visit date first.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    if (!acceptedTerms) return;

    const draft = { date, time: slot, adults, kids, totalAmount: total, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full flex flex-col items-center pb-12">

      <div className="w-full max-w-4xl text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white uppercase">Reservation</h2>
        <p className="text-white/70 text-xs mt-2">Spray Aqua Resort Booking Counter</p>
      </div>

      <div className="w-full max-w-4xl mb-6 bg-amber-100 text-amber-900 p-5 rounded-xl text-center font-bold shadow-lg">
        {offerText}
      </div>

      {date && discountPercent > 0 && (
        <div className="w-full max-w-4xl mb-6 bg-emerald-100 text-emerald-800 p-4 rounded-lg text-center font-bold">
          🎉 Early Bird Discount Applied: {discountPercent}% OFF
        </div>
      )}

      <div className="w-full max-w-4xl bg-white rounded-2xl p-8 space-y-8 shadow-xl">

        <div className="grid md:grid-cols-2 gap-6">
          <input type="date" className="border p-3 rounded" value={date} onChange={e => setDate(e.target.value)} />
          
          <select className="border p-3 rounded" value={slot} onChange={e => setSlot(e.target.value)}>
            {TIME_SLOTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex justify-between items-center">
          <span>Adults</span>
          <div className="flex gap-3">
            <button onClick={() => setAdults(Math.max(1, adults - 1))}>-</button>
            <b>{adults}</b>
            <button onClick={() => setAdults(adults + 1)}>+</button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span>Kids</span>
          <div className="flex gap-3">
            <button onClick={() => setKids(Math.max(0, kids - 1))}>-</button>
            <b>{kids}</b>
            <button onClick={() => setKids(kids + 1)}>+</button>
          </div>
        </div>

        <div className="border-t pt-6 space-y-2">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discount}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{total}</span></div>
        </div>

        <button onClick={handleCheckout} className="w-full bg-blue-600 text-white py-4 rounded-xl">
          Continue to Payment
        </button>
      </div>

      {showTerms && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Terms & Conditions</h3>
            <div className="h-40 overflow-y-auto mb-4 text-sm">
              {TERMS_AND_CONDITIONS.map((t, i) => <p key={i} className="mb-2">{t}</p>)}
            </div>

            <label className="flex items-center gap-3 mb-4">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              I accept the terms
            </label>

            <button onClick={finalProceed} disabled={!acceptedTerms} className="w-full bg-green-600 text-white py-3 rounded-xl">
              Confirm Booking
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingGate;
