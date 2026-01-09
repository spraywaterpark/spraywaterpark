import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[] }> = ({ settings, bookings }) => {
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isMorning = slot.includes('Morning');
  const rateAdult = isMorning ? settings.morningAdultRate : settings.eveningAdultRate;
  const rateKid = isMorning ? settings.morningKidRate : settings.eveningKidRate;
  const shiftDiscounts = isMorning ? settings.discounts.morning.tiers : settings.discounts.evening.tiers;

  const offerText = isMorning ? OFFERS.MORNING : OFFERS.EVENING;

  const pricingData = useMemo(() => {
    const subtotal = adults * rateAdult + kids * rateKid;

    const alreadyBooked = bookings
      .filter(b => b.date === date && b.time === slot)
      .reduce((sum, b) => sum + b.adults + b.kids, 0);

    let remaining = alreadyBooked;
    let discountPercent = 0;

    for (const tier of shiftDiscounts) {
      if (remaining < tier.maxGuests) {
        discountPercent = tier.discountPercent;
        break;
      }
      remaining -= tier.maxGuests;
    }

    const discountAmount = Math.round(subtotal * discountPercent / 100);

    return {
      subtotal,
      discount: discountAmount,
      total: subtotal - discountAmount,
      discountPercent
    };
  }, [adults, kids, rateAdult, rateKid, bookings, date, slot, shiftDiscounts]);

  const handleCheckout = () => {
    if (!date) return alert('Please select a date');
    setShowTerms(true);
  };

  const confirmBooking = () => {
    if (!acceptedTerms) return;
    const draft = { date, time: slot, adults, kids, totalAmount: pricingData.total, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      <h2 className="text-4xl font-black text-center mb-6">Book Tickets</h2>

      <div className="mb-6">
        <label>Date</label>
        <input type="date" className="input-premium" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="mb-6">
        <label>Time Slot</label>
        {TIME_SLOTS.map(s => (
          <button key={s} onClick={() => setSlot(s)} className={`block w-full p-3 my-2 rounded ${slot === s ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 rounded">
        🎁 {offerText}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label>Adults</label>
          <input type="number" min={1} value={adults} onChange={e => setAdults(+e.target.value)} className="input-premium" />
        </div>
        <div>
          <label>Kids</label>
          <input type="number" min={0} value={kids} onChange={e => setKids(+e.target.value)} className="input-premium" />
        </div>
      </div>

      <div className="bg-gray-900 text-white p-6 rounded-xl space-y-3">
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

        <div className="flex justify-between text-xl font-black border-t pt-4">
          <span>Payable</span>
          <span>₹{pricingData.total}</span>
        </div>

        <button onClick={handleCheckout} className="btn-resort w-full mt-4">
          Proceed to Payment
        </button>
      </div>

      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-xl max-w-lg w-full space-y-4">
            <h3 className="text-xl font-black">Terms & Conditions</h3>
            {TERMS_AND_CONDITIONS.map((t, i) => <p key={i}>{t}</p>)}
            <label className="flex gap-3 items-center mt-4">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              I accept all terms
            </label>
            <button onClick={confirmBooking} className="btn-resort w-full mt-4">
              Confirm & Continue
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingGate;
