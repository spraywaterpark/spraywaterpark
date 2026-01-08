// ONLY LAYOUT CLASSES UPDATED — LOGIC SAME

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, OFFERS, TERMS_AND_CONDITIONS } from '../constants';

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
  const currentOffer = isMorning ? OFFERS.MORNING : OFFERS.EVENING;

  const pricingData = useMemo(() => {
    const subtotal = (adults * adultRate) + (kids * kidRate);
    const alreadyBooked = bookings.filter(b => b.date === date && b.time === slot && b.status === 'confirmed')
      .reduce((sum, b) => sum + b.adults + b.kids, 0);

    let discountPercent = 0;
    let tierText = "";

    if (date) {
      if (alreadyBooked < 100) {
        discountPercent = settings.earlyBirdDiscount;
        tierText = `Elite Tier Discount: ${discountPercent}%`;
      } else if (alreadyBooked < 200) {
        discountPercent = settings.extraDiscountPercent;
        tierText = `Standard Discount: ${discountPercent}%`;
      }
    }

    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount: discountAmount, total: subtotal - discountAmount, discountPercent, tierText };
  }, [date, slot, adults, kids, adultRate, kidRate, bookings, settings]);

  const handleCheckout = () => {
    if (!date) return alert("Please select your visit date first.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    if (!acceptedTerms) return;
    const draft = { date, time: slot, adults, kids, totalAmount: pricingData.total, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-16">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20">
          <i className="fas fa-arrow-left text-xs text-white"></i>
          <span className="text-[10px] font-bold uppercase text-white/80">Back</span>
        </button>

        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white uppercase">Reservation</h2>
          <p className="text-white/50 text-[10px] uppercase tracking-[0.3em]">Spray Aqua Resort</p>
        </div>

        <div className="hidden sm:block w-20"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-12">

          {/* DATE + SLOT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase">Visit Date</label>
              <input type="date" className="input-premium mt-2"
                value={date} onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase">Time Slot</label>
              <div className="mt-2 space-y-2">
                {TIME_SLOTS.map(s => (
                  <button key={s} onClick={() => setSlot(s)}
                    className={`w-full px-4 py-3 rounded-xl border flex justify-between
                    ${slot === s ? 'bg-slate-900 text-white border-white/20' : 'bg-white text-slate-900'}`}>
                    <span className="text-xs font-bold uppercase">{s}</span>
                    {slot === s && <i className="fas fa-check-circle"></i>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PASS COUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[['Adult', adults, setAdults, adultRate], ['Child', kids, setKids, kidRate]].map(
              ([label, val, setVal, rate]: any) => (
                <div key={label} className="p-5 bg-white/70 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold">{label}</p>
                    <p className="text-lg font-black">₹{rate}</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button onClick={() => setVal(Math.max(0, val - 1))} className="w-8 h-8 border rounded-lg">-</button>
                    <span className="font-black">{val}</span>
                    <button onClick={() => setVal(val + 1)} className="w-8 h-8 border rounded-lg">+</button>
                  </div>
                </div>
              )
            )}
          </div>

        </div>

        {/* RIGHT SUMMARY */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl lg:sticky lg:top-28 h-fit">
          <h4 className="text-[10px] uppercase tracking-[0.4em] opacity-50 mb-6">Summary</h4>

          <div className="space-y-3">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{pricingData.subtotal}</span></div>
            {pricingData.discount > 0 && (
              <div className="flex justify-between text-blue-400">
                <span>Discount</span><span>-₹{pricingData.discount}</span>
              </div>
            )}
            <div className="pt-6 border-t border-white/20">
              <p className="text-[10px] uppercase opacity-50">Payable</p>
              <p className="text-5xl font-black">₹{pricingData.total}</p>
            </div>
          </div>

          <button onClick={handleCheckout}
            className="w-full mt-8 bg-white text-slate-900 py-4 rounded-xl font-black hover:bg-slate-100">
            Review & Checkout
          </button>
        </div>

      </div>

      {/* TERMS MODAL (unchanged logic, responsive) */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[500]">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 space-y-6">
            <h3 className="text-2xl font-black text-center">Terms & Conditions</h3>

            <div className="max-h-60 overflow-y-auto space-y-3">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <p key={i} className="text-sm font-semibold">{t}</p>
              ))}
            </div>

            <label className="flex gap-3 items-center">
              <input type="checkbox" checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-sm font-bold">I accept all terms</span>
            </label>

            <button disabled={!acceptedTerms} onClick={finalProceed}
              className="w-full py-3 rounded-xl bg-slate-900 text-white disabled:opacity-40">
              Confirm Reservation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingGate;
