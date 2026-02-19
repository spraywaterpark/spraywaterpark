
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
    // 1. Same-day Cut-off Rules
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
    
    // Calculate total guests already booked for this specific date/slot to apply early bird
    const slotBookings = bookings.filter(b => b.date === date && b.time === slot && (b.status === 'confirmed' || b.status === 'checked-in'));
    const totalGuestsSoFar = slotBookings.reduce((sum, b) => sum + (Number(b.adults) || 0) + (Number(b.kids) || 0), 0);

    let discountPercent = 0;
    // Early Bird: First 100 guests get max discount
    if (totalGuestsSoFar < 100) {
        discountPercent = settings.earlyBirdDiscount || 20;
    } 
    // Next 100 get medium discount
    else if (totalGuestsSoFar < 200) {
        discountPercent = settings.extraDiscountPercent || 10;
    }

    const discount = Math.round(subtotal * (discountPercent / 100));
    return { subtotal, discount, total: subtotal - discount, discountPercent };
  }, [date, slot, adults, kids, bookings, adultRate, kidRate, settings]);

  const handleCheckout = () => {
    if (isSlotBlocked(date, slot)) return alert("Slot unavailable.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    const draft = { 
      date, 
      time: slot, 
      adults, 
      kids, 
      totalAmount: pricingData.total, 
      paymentMode, 
      status: 'pending' 
    };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full flex flex-col items-center animate-slide-up pb-20 pt-10">
      <div className="w-full max-w-4xl space-y-16">
        {/* Step 1: Schedule */}
        <div className="space-y-8">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm mb-4 shadow-xl">01</div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Visit Schedule</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Preferred Date</label>
                    <input type="date" className="w-full bg-white h-20 rounded-3xl border-2 border-slate-100 px-8 font-bold text-slate-900 shadow-sm focus:border-blue-500 transition-all outline-none" value={date} min={todayStr} max={maxDateStr} onChange={handleDateChange} />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Available Sessions</label>
                    <div className="flex flex-col gap-3">
                        {TIME_SLOTS.map(s => {
                            const active = slot === s;
                            const blocked = isSlotBlocked(date, s);
                            return (
                                <button key={s} disabled={blocked} onClick={() => setSlot(s)} 
                                  className={`h-20 px-8 rounded-3xl border-2 transition-all text-left relative overflow-hidden ${blocked ? 'bg-slate-100 opacity-50 cursor-not-allowed border-slate-200' : active ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white text-slate-900 border-slate-100 hover:border-slate-300'}`}>
                                    <span className="text-[10px] font-black uppercase block tracking-widest mb-0.5">{s.split(':')[0]}</span>
                                    <span className="text-[9px] font-bold uppercase opacity-60 tracking-tight">{blocked ? 'Closed / Full' : s.split(':')[1]}</span>
                                    {active && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-[10px] shadow-lg"><i className="fas fa-check"></i></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* Step 2: Pass Selection */}
        <div className={`space-y-8 transition-all duration-500 ${isSlotBlocked(date, slot) ? 'opacity-30 pointer-events-none filter blur-[2px]' : 'opacity-100'}`}>
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm mb-4 shadow-xl">02</div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Pass Selection</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Adult Entry</p>
                        <p className="text-2xl font-black text-slate-900">₹{adultRate}</p>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">-</button>
                        <span className="text-xl font-black min-w-[1.5rem] text-center">{adults}</span>
                        <button onClick={() => setAdults(adults+1)} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">+</button>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Child Entry</p>
                        <p className="text-2xl font-black text-slate-900">₹{kidRate}</p>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={() => setKids(Math.max(0, kids-1))} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">-</button>
                        <span className="text-xl font-black min-w-[1.5rem] text-center">{kids}</span>
                        <button onClick={() => setKids(kids+1)} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">+</button>
                    </div>
                </div>
            </div>

            {/* FOOD OPTION BANNER - RESTORED */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2.5rem] flex items-center gap-6 animate-pulse shadow-sm">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-emerald-200">
                    <i className="fas fa-gift"></i>
                </div>
                <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Included with your entry</p>
                    <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">{currentOffer}</p>
                </div>
            </div>
        </div>

        {/* Checkout Summary */}
        <div className="flex justify-center pt-10">
            <div className="w-full max-w-md bg-slate-900 rounded-[3rem] p-10 shadow-2xl space-y-8 border border-white/5">
                {/* DISCOUNT DETAILS - RESTORED */}
                <div className="space-y-4 border-b border-white/10 pb-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/40 tracking-widest">
                        <span>Subtotal</span>
                        <span>₹{pricingData.subtotal}</span>
                    </div>
                    {pricingData.discount > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                            <span>Early Bird Discount ({pricingData.discountPercent}%)</span>
                            <span>- ₹{pricingData.discount}</span>
                        </div>
                    )}
                </div>

                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Payable Amount</p>
                    <div className="text-6xl font-black text-white tracking-tighter">₹{pricingData.total}</div>
                </div>
                
                <button 
                  onClick={handleCheckout} 
                  disabled={isSlotBlocked(date, slot)} 
                  className="w-full bg-white h-20 rounded-[2rem] text-slate-900 font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-all disabled:opacity-20 hover:bg-slate-50"
                >
                    Checkout
                </button>

                <div className="flex items-center justify-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                    <i className="fas fa-shield-alt text-emerald-500/50"></i> Secure Checkout Enabled
                </div>
            </div>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
          <div className="bg-white rounded-[3rem] max-w-xl w-full p-10 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            <h3 className="text-3xl font-black text-slate-900 uppercase text-center tracking-tighter">Park Policy</h3>
            
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                    <p className="text-[12px] font-bold text-slate-800 uppercase leading-relaxed mb-2">{t.split('(')[0]}</p>
                    {t.includes('(') && <p className="text-[11px] font-black text-blue-600">{t.substring(t.indexOf('(') + 1, t.lastIndexOf(')'))}</p>}
                </div>
              ))}
            </div>

            <label className="flex items-center gap-4 p-6 bg-slate-100 rounded-[2rem] cursor-pointer transition-all hover:bg-slate-200">
                <input type="checkbox" className="w-6 h-6 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span className="text-[11px] font-black uppercase text-slate-600 tracking-widest">I accept all park policies</span>
            </label>

            <div className="flex flex-col gap-3">
                <button onClick={finalProceed} disabled={!acceptedTerms} className="w-full bg-slate-900 text-white h-20 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all active:scale-95">Confirm & Proceed</button>
                <button onClick={() => setShowTerms(false)} className="w-full py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
