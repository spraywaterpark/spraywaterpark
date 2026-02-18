
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSettings, Booking } from '../types';
import { TIME_SLOTS, TERMS_AND_CONDITIONS, OFFERS, DEFAULT_ADMIN_SETTINGS } from '../constants';

const BookingGate: React.FC<{ settings: AdminSettings, bookings: Booking[], onProceed: any }> = ({ settings, bookings }) => {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'online' | 'cash'>('online');
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Check if a specific slot is blocked by admin or by time cut-off
  const isSlotBlocked = (checkDate: string, checkSlot: string) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    
    // 1. Same-day Cut-off Rules
    if (checkDate === today) {
      if (checkSlot.toLowerCase().includes('morning') && currentHour >= 13) return true; // Morning closes at 1 PM
      if (checkSlot.toLowerCase().includes('evening') && currentHour >= 19) return true; // Evening closes at 7 PM
    }

    // 2. Admin Panel Block Rules
    const shift = checkSlot.toLowerCase().includes('morning') ? 'morning' : 'evening';
    return (settings.blockedSlots || []).some(bs => 
      bs.date === checkDate && (bs.shift === shift || bs.shift === 'all')
    );
  };

  // If the currently selected date/slot becomes blocked, update the selection if possible
  useEffect(() => {
    if (isSlotBlocked(date, slot)) {
      const otherSlot = TIME_SLOTS.find(s => !isSlotBlocked(date, s));
      if (otherSlot) setSlot(otherSlot);
    }
  }, [date]);

  // Robust Rate Selection with Fallbacks
  const isMorning = slot.includes('Morning');
  const adultRate = (isMorning ? (settings?.morningAdultRate || DEFAULT_ADMIN_SETTINGS.morningAdultRate) : (settings?.eveningAdultRate || DEFAULT_ADMIN_SETTINGS.eveningAdultRate)) || 500;
  const kidRate = (isMorning ? (settings?.morningKidRate || DEFAULT_ADMIN_SETTINGS.morningKidRate) : (settings?.eveningKidRate || DEFAULT_ADMIN_SETTINGS.eveningKidRate)) || 350;

  const currentOffer = isMorning ? OFFERS.MORNING : OFFERS.EVENING;

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const pricingData = useMemo(() => {
    const safeAdults = Number(adults) || 0;
    const safeKids = Number(kids) || 0;
    const safeAdultRate = Number(adultRate) || 0;
    const safeKidRate = Number(kidRate) || 0;

    const subtotal = (safeAdults * safeAdultRate) + (safeKids * safeKidRate);
    
    const todayBookings = bookings.filter(b => b.date === date && b.time === slot && (b.status === 'confirmed' || b.status === 'checked-in'));
    const totalGuestsSoFar = todayBookings.reduce((s, b) => s + b.adults + b.kids, 0);

    let discountPercent = 0;
    if (date) {
        if (totalGuestsSoFar < 100) discountPercent = settings.earlyBirdDiscount || 0;
        else if (totalGuestsSoFar < 200) discountPercent = settings.extraDiscountPercent || 0;
    }

    const discount = Math.round(subtotal * (discountPercent / 100));
    const total = subtotal - discount;

    return { 
      subtotal: isNaN(subtotal) ? 0 : subtotal, 
      discount: isNaN(discount) ? 0 : discount, 
      total: isNaN(total) ? 0 : total, 
      discountPercent 
    };
  }, [date, slot, adults, kids, bookings, adultRate, kidRate, settings]);

  const handleCheckout = () => {
    if (!date) return alert("Please select your visit date first.");
    if (isSlotBlocked(date, slot)) return alert("Sorry, this slot is currently blocked or past the booking time.");
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
      paymentMode,
      status: 'pending'
    };
    sessionStorage.setItem('swp_draft_booking', JSON.stringify(draft));
    navigate('/payment');
  };

  return (
    <div className="w-full flex flex-col items-center animate-slide-up pb-20 pt-10">
      
      <div className="w-full max-w-4xl space-y-16">
        
        {/* Section 01: VISIT SCHEDULE */}
        <div className="space-y-8">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm mb-4">01</div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Visit Schedule</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Preferred Date</label>
                    <div className="relative">
                        <input type="date" className="w-full bg-white h-20 rounded-3xl border-2 border-slate-100 px-8 font-bold text-slate-900 focus:border-blue-500 transition-all outline-none" value={date} min={todayStr} max={maxDateStr} onChange={e => setDate(e.target.value)} />
                        <p className="absolute -bottom-6 left-4 text-[9px] font-bold text-slate-400 uppercase">Max 7 Days advance booking allowed</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Available Sessions</label>
                    <div className="flex flex-col gap-3">
                        {TIME_SLOTS.map(s => {
                            const active = slot === s;
                            const blocked = isSlotBlocked(date, s);
                            const isToday = date === todayStr;
                            const isMorningSlot = s.toLowerCase().includes('morning');
                            const now = new Date();
                            const currentHour = now.getHours();
                            
                            let reason = 'Available';
                            if (blocked) {
                                if (isToday && isMorningSlot && currentHour >= 13) reason = 'Closed (After 1 PM)';
                                else if (isToday && !isMorningSlot && currentHour >= 19) reason = 'Closed (After 7 PM)';
                                else reason = 'Slot Blocked';
                            }

                            return (
                                <button 
                                  key={s} 
                                  disabled={blocked}
                                  onClick={() => setSlot(s)} 
                                  className={`relative h-20 px-8 rounded-3xl border-2 transition-all flex flex-col justify-center text-left 
                                    ${blocked ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed' : 
                                      active ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-white border-slate-100 text-slate-900'}`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${blocked ? 'text-slate-400' : ''}`}>{s.split(':')[0]}</span>
                                    <span className={`text-[9px] font-bold uppercase ${blocked ? 'text-slate-300' : active ? 'text-white opacity-60' : 'text-slate-400'}`}>
                                      {blocked ? reason : s.split(':')[1]}
                                    </span>
                                    {active && !blocked && <i className="fas fa-check-circle absolute right-8 text-sm"></i>}
                                    {blocked && <span className="absolute right-8 text-[8px] font-black uppercase bg-red-100 text-red-600 px-2 py-1 rounded">Unavailable</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Offer Banner */}
            <div className={`bg-slate-200/50 border border-slate-200 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:bg-white transition-all ${isSlotBlocked(date, slot) ? 'opacity-30' : ''}`}>
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200">
                    <i className={isMorning ? "fas fa-utensils" : "fas fa-concierge-bell"}></i>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Guest Privilege Included</p>
                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900">{currentOffer.split('(')[0]}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentOffer.includes('(') ? currentOffer.split('(')[1].replace(')', '') : 'Valid during session only'}</p>
                </div>
            </div>
        </div>

        {/* Section 02: PASS SELECTION */}
        <div className={`space-y-8 ${isSlotBlocked(date, slot) ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm mb-4">02</div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Pass Selection</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adult Entry (Above 3.5 ft)</p>
                        <p className="text-xl font-black text-slate-900">₹{adultRate}</p>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={() => setAdults(Math.max(1, adults-1))} className="w-10 h-10 rounded-xl bg-white text-slate-900 shadow-sm font-black">-</button>
                        <span className="text-xl font-black w-4 text-center">{adults}</span>
                        <button onClick={() => setAdults(adults+1)} className="w-10 h-10 rounded-xl bg-white text-slate-900 shadow-sm font-black">+</button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Child Entry (2.5 - 3.5 ft)</p>
                        <p className="text-xl font-black text-slate-900">₹{kidRate}</p>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={() => setKids(Math.max(0, kids-1))} className="w-10 h-10 rounded-xl bg-white text-slate-900 shadow-sm font-black">-</button>
                        <span className="text-xl font-black w-4 text-center">{kids}</span>
                        <button onClick={() => setKids(kids+1)} className="w-10 h-10 rounded-xl bg-white text-slate-900 shadow-sm font-black">+</button>
                    </div>
                </div>
            </div>
        </div>

        {/* Payment Summary Box */}
        <div className="flex justify-center pt-10">
            <div className="w-full max-w-md bg-slate-900 rounded-[3rem] p-10 shadow-2xl space-y-8 animate-slide-up">
                <div className="text-center border-b border-white/10 pb-8">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-6">Reservation Summary</p>
                    <div className="flex justify-between items-center px-4">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Subtotal</span>
                        <span className="text-lg font-black text-white">₹{pricingData.subtotal}</span>
                    </div>
                    {pricingData.discount > 0 && (
                        <div className="flex justify-between items-center px-4 mt-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Early Bird Discount ({pricingData.discountPercent}%)</span>
                            <span className="text-lg font-black text-emerald-400">- ₹{pricingData.discount}</span>
                        </div>
                    )}
                </div>

                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Payable Amount</p>
                    <div className="text-6xl font-black text-white tracking-tighter flex items-center justify-center gap-2">
                        <span className="text-4xl opacity-40">₹</span>
                        {pricingData.total}
                    </div>
                </div>

                <button 
                  onClick={handleCheckout} 
                  disabled={isSlotBlocked(date, slot)}
                  className="w-full bg-white h-20 rounded-[2rem] text-slate-900 font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                    {isSlotBlocked(date, slot) ? 'Unavailable or Past Time' : 'Review & Checkout'}
                </button>
            </div>
        </div>

      </div>

      {/* Terms Popup */}
      {showTerms && (
        <div className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
          <div className="bg-white rounded-[3rem] max-w-xl w-full p-10 shadow-2xl space-y-10">
            <h3 className="text-3xl font-black text-slate-900 uppercase text-center tracking-tighter">Park Policy</h3>
            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {TERMS_AND_CONDITIONS.map((t, i) => (
                <div key={i} className="p-5 bg-slate-50 rounded-[1.5rem] text-[12px] font-bold text-slate-700 uppercase leading-tight border border-slate-100">{t}</div>
              ))}
            </div>
            <label className="flex items-center gap-4 p-6 bg-slate-100 rounded-[2rem] cursor-pointer group">
              <input type="checkbox" className="w-6 h-6 rounded-lg accent-slate-900" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <span className="text-[11px] font-black uppercase text-slate-600 group-hover:text-slate-900">I accept all resort policies & rules</span>
            </label>
            <div className="flex flex-col gap-3">
                <button onClick={finalProceed} disabled={!acceptedTerms} className="w-full bg-slate-900 text-white h-20 rounded-[2rem] font-black text-sm uppercase tracking-widest disabled:opacity-20 shadow-xl">Confirm & Pay</button>
                <button onClick={() => setShowTerms(false)} className="w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingGate;
