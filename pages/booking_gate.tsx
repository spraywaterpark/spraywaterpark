import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, TERMS_AND_CONDITIONS } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[] }> = ({ settings, bookings }) => {

  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isMorning = slot.toLowerCase().includes('morning');

  const adultRate = isMorning ? settings.morningAdultRate : settings.eveningAdultRate;
  const kidRate   = isMorning ? settings.morningKidRate   : settings.eveningKidRate;

  const pricingData = useMemo(() => {
    const subtotal = adults * adultRate + kids * kidRate;

    const alreadyBooked = bookings.filter(b =>
      b.date === date &&
      b.time === slot &&
      b.status === 'confirmed'
    ).reduce((sum, b) => sum + b.adults + b.kids, 0);

    let discountPercent = 0;

    if (alreadyBooked < 100) discountPercent = 20;
    else if (alreadyBooked < 200) discountPercent = 10;

    const discount = Math.round(subtotal * discountPercent / 100);
    const total = subtotal - discount;

    return { subtotal, discount, total, discountPercent };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings]);

  const proceed = () => {
    if (!date) return alert("Please select visit date");
    setShowTerms(true);
  };

  const confirm = () => {
    if (!acceptedTerms) return;

    sessionStorage.setItem("swp_draft_booking", JSON.stringify({
      date, time: slot, adults, kids, totalAmount: pricingData.total, status: "pending"
    }));

    navigate("/payment");
  };

  return (
    <div className="w-full flex flex-col items-center pb-16">

      <div className="w-full max-w-4xl text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white uppercase">Reservation</h2>
        <p className="text-white/60 text-xs uppercase tracking-[0.3em] mt-2">
          Spray Aqua Resort Booking Terminal
        </p>
      </div>

      <div className="glass-card w-full max-w-4xl p-8 md:p-12 rounded-3xl space-y-12">

        {/* DATE + SLOT */}
        <div className="grid md:grid-cols-2 gap-10">

          <div className="space-y-3 text-center">
            <label className="text-xs font-bold uppercase text-slate-400">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-premium text-center"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-400 text-center">Time Slot</label>
            <div className="space-y-3">
              {TIME_SLOTS.map(s => {
                const active = s === slot;
                return (
                  <button key={s}
                    onClick={() => setSlot(s)}
                    className={`w-full p-5 rounded-xl border transition flex justify-between items-center
                      ${active ? "bg-slate-900 text-white shadow-xl" : "bg-white hover:border-slate-600"}`}>
                    <div>
                      <p className="text-xs font-black uppercase">{s}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {isMorning ? "Free Chole Bhature Included" : "Free Buffet Dinner Included"}
                      </p>
                    </div>
                    {active && <i className="fas fa-check-circle"></i>}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* QUANTITY */}
        <div className="grid md:grid-cols-2 gap-8">

          {[
            ["Adults", adults, setAdults, adultRate],
            ["Kids", kids, setKids, kidRate]
          ].map(([label, val, set, rate]: any) => (
            <div key={label} className="p-6 bg-white/70 rounded-xl border flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">{label}</p>
                <p className="text-xl font-black text-slate-900">₹{rate}</p>
              </div>
              <div className="flex items-center gap-5">
                <button onClick={() => set(Math.max(label === "Adults" ? 1 : 0, val - 1))} className="btn-counter">-</button>
                <span className="text-xl font-black">{val}</span>
                <button onClick={() => set(val + 1)} className="btn-counter">+</button>
              </div>
            </div>
          ))}

        </div>

        {/* DISCOUNT */}
        {pricingData.discountPercent > 0 && (
          <div className="bg-emerald-100 text-emerald-800 p-4 rounded-xl text-center font-black">
            🎉 Early Bird Discount Applied — {pricingData.discountPercent}% OFF
          </div>
        )}

        {/* SUMMARY */}
        <div className="bg-slate-900 p-10 rounded-3xl text-white text-center space-y-6">
          <p className="text-xs uppercase opacity-50">Payable Amount</p>
          <p className="text-6xl font-black">₹{pricingData.total}</p>

          <button onClick={proceed} className="btn-resort bg-white text-slate-900 mt-6 w-full">
            Review & Checkout
          </button>
        </div>

      </div>

      {/* TERMS */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[500]">
          <div className="bg-white p-10 rounded-3xl max-w-xl w-full space-y-6">

            <h3 className="text-2xl font-black text-center">Park Policy</h3>

            <div className="max-h-60 overflow-y-auto space-y-3">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <p key={i} className="text-sm text-slate-600">{i + 1}. {t}</p>
              ))}
            </div>

            <label className="flex gap-3 items-center">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="font-bold text-sm">I accept the terms</span>
            </label>

            <button onClick={confirm} disabled={!acceptedTerms} className="btn-resort w-full h-14 disabled:opacity-30">
              Confirm Reservation
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default BookingGate;
