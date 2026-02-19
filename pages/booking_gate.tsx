
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, TERMS_AND_CONDITIONS, OFFERS, DEFAULT_ADMIN_SETTINGS } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings }) => {
  const navigate = useNavigate();

  // GET IST LOCAL TIME & DATE
  const getISTInfo = () => {
    const d = new Date();
    const istStr = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istStr);
    return {
      todayStr: istDate.toLocaleDateString('en-CA'), // YYYY-MM-DD
      currentHour: istDate.getHours()
    };
  };

  const { todayStr, currentHour } = getISTInfo();
  const [date, setDate] = useState(todayStr);
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'online' | 'cash'>('online');
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const maxDateObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  maxDateObj.setDate(maxDateObj.getDate() + 7);
  const maxDateStr = maxDateObj.toLocaleDateString('en-CA');

  const isSlotBlocked = (checkDate: string, checkSlot: string) => {
    // 1. Same-day Cut-off Rules (using IST hour)
    if (checkDate === todayStr) {
      if (checkSlot.toLowerCase().includes('morning') && currentHour >= 13) return true;
      if (checkSlot.toLowerCase().includes('evening') && currentHour >= 19) return true;
    }

    // 2. Admin Panel Block Rules
    const shift = checkSlot.toLowerCase().includes('morning') ? 'morning' : 'evening';
    return (settings.blockedSlots || []).some(bs => 
      bs.date === checkDate && (bs.shift === shift || bs.shift === 'all')
    );
  };

  useEffect(() => {
    if (isSlotBlocked(date, slot)) {
      const otherSlot = TIME_SLOTS.find(s => !isSlotBlocked(date, s));
      if (otherSlot) setSlot(otherSlot);
    }
  }, [date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    if (!selected) return;
    if (selected < todayStr) {
      alert("Past dates are not available.");
      setDate(todayStr);
    } else if (selected > maxDateStr) {
      alert("Advance booking is limited to 7 days.");
      setDate(maxDateStr);
    } else {
      setDate(selected);
    }
  };

  const isMorning = slot.includes('Morning');
  const adultRate = (isMorning ? (settings?.morningAdultRate || DEFAULT_ADMIN_SETTINGS.morningAdultRate) : (settings?.eveningAdultRate || DEFAULT_ADMIN_SETTINGS.eveningAdultRate)) || 500;
  const kidRate = (isMorning ? (settings?.morningKidRate || DEFAULT_ADMIN_SETTINGS.morningKidRate) : (settings?.eveningKidRate || DEFAULT_ADMIN_SETTINGS.eveningKidRate)) || 350;
  const currentOffer = isMorning ? OFFERS.MORNING : OFFERS.EVENING;

  const pricingData = useMemo(() => {
    const safeAdults = Number(adults) || 0;
    const safeKids = Number(kids) || 0;
    const subtotal = (safeAdults * adultRate) + (safeKids * kidRate);
    const todayBookings = bookings.filter(b => b.date === date && b.time === slot && (b.status === 'confirmed' || b.status === 'checked-in'));
    const totalGuestsSoFar = todayBookings.reduce((s, b) => s + b.adults + b.kids, 0);

    let discountPercent = 0;
    if (totalGuestsSoFar < 100) discountPercent = settings.earlyBirdDiscount || 0;
    else if (totalGuestsSoFar < 200) discountPercent = settings.extraDiscountPercent || 0;

    const discount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount, total: subtotal - discount, discountPercent };
  }, [date, slot, adults, kids, bookings, adultRate, kidRate, settings]);

  const handleCheckout = () => {
    if (isSlotBlocked(date, slot)) return alert("Slot unavailable.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    const draft = { date, time: slot, adults, kids, totalAmount: pricingData.total, paymentMode, status: 'pending' };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full flex flex-col items-center animate-slide-up pb-20 pt-10">
      <div className="w-full max-w-4xl space-y-16">
        <div className="space-y-8">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm mb-4">01</div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Visit Schedule</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Preferred Date</label>
                    <input type="date" className="w-full bg-white h-20 rounded-3xl border-2 border-slate-100 px-8 font-bold text-slate-900" value={date} min={todayStr} max={maxDateStr} onChange={handleDateChange} />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Available Sessions</label>
                    <div className="flex flex-col gap-3">
                        {TIME_SLOTS.map(s => {
                            const active = slot === s;
                            const blocked = isSlotBlocked(date, s);
                            return (
                                <button key={s} disabled={blocked} onClick={() => setSlot(s)} 
                                  className={`h-20 px-8 rounded-3xl border-2 transition-all text-left ${blocked ? 'bg-slate-100 opacity-50' : active ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white text-slate-900'}`}>
                                    <span className="text-[10px] font-black uppercase block">{s.split(':')[0]}</span>
                                    <span className="text-[9px] font-bold uppercase opacity-60">{blocked ? 'Closed' : s.split(':')[1]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        <div className={`space-y-8 ${isSlotBlocked(date, slot) ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm mb-4">02</div><h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Pass Selection</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase">Adult Entry</p><p className="text-xl font-black text-slate-900">₹{adultRate}</p></div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl"><button onClick={() => setAdults(Math.max(1, adults-1))} className="w-10 h-10 rounded-xl bg-white font-black">-</button><span className="text-xl font-black">{adults}</span><button onClick={() => setAdults(adults+1)} className="w-10 h-10 rounded-xl bg-white font-black">+</button></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase">Child Entry</p><p className="text-xl font-black text-slate-900">₹{kidRate}</p></div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl"><button onClick={() => setKids(Math.max(0, kids-1))} className="w-10 h-10 rounded-xl bg-white font-black">-</button><span className="text-xl font-black">{kids}</span><button onClick={() => setKids(kids+1)} className="w-10 h-10 rounded-xl bg-white font-black">+</button></div>
                </div>
            </div>
        </div>

        <div className="flex justify-center pt-10">
            <div className="w-full max-w-md bg-slate-900 rounded-[3rem] p-10 shadow-2xl space-y-8">
                <div className="text-center space-y-2"><p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Payable Amount</p><div className="text-6xl font-black text-white tracking-tighter">₹{pricingData.total}</div></div>
                <button onClick={handleCheckout} disabled={isSlotBlocked(date, slot)} className="w-full bg-white h-20 rounded-[2rem] text-slate-900 font-black uppercase tracking-widest disabled:opacity-20">Checkout</button>
            </div>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
          <div className="bg-white rounded-[3rem] max-w-xl w-full p-10 space-y-8 shadow-2xl">
            <h3 className="text-3xl font-black text-slate-900 uppercase text-center tracking-tighter">Park Policy</h3>
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                    <p className="text-[12px] font-bold text-slate-800 uppercase leading-relaxed mb-2">{t.split('(')[0]}</p>
                    {t.includes('(') && <p className="text-[11px] font-black text-blue-600">{t.substring(t.indexOf('(') + 1, t.lastIndexOf(')'))}</p>}
                </div>
              ))}
            </div>
            <label className="flex items-center gap-4 p-6 bg-slate-100 rounded-[2rem] cursor-pointer"><input type="checkbox" className="w-6 h-6 rounded-lg" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} /><span className="text-[11px] font-black uppercase text-slate-600">I accept all policies</span></label>
            <div className="flex flex-col gap-3"><button onClick={finalProceed} disabled={!acceptedTerms} className="w-full bg-slate-900 text-white h-20 rounded-[2rem] font-black text-sm uppercase">Confirm & Pay</button><button onClick={() => setShowTerms(false)} className="w-full py-2 text-[10px] font-black uppercase text-slate-400">Go Back</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
