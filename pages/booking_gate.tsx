
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
  const [students, setStudents] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'online' | 'cash'>('online');
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const maxDateObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  maxDateObj.setDate(maxDateObj.getDate() + 7);
  const maxDateStr = maxDateObj.toLocaleDateString('en-CA');

  const isSlotBlocked = (checkDate: string, checkSlot: string) => {
    // 1. Same-day Cut-off Rules
    const now = new Date();
    const currHour = now.getHours();
    const currMin = now.getMinutes();
    const currTimeVal = currHour + (currMin / 60);

    if (checkDate === todayStr) {
      if (checkSlot.toLowerCase().includes('morning') && currTimeVal >= 13) return true;
      if (checkSlot.toLowerCase().includes('evening') && currTimeVal >= 19.5) return true;
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

  const isMorning = slot.toLowerCase().includes('morning');
  const isSunday = new Date(date).getDay() === 0;
  const sundayExtra = isSunday ? 50 : 0;

  const pricingData = useMemo(() => {
    let adultMRP = isMorning ? 500 : 800;
    let kidMRP = isMorning ? 350 : 500;
    let adultFinal = isMorning ? 400 : 600;
    let kidFinal = isMorning ? 300 : 400;
    let studentFinal = 200; // Fixed price for both shifts

    // Apply Sunday Surcharge
    adultMRP += sundayExtra;
    kidMRP += sundayExtra;
    adultFinal += sundayExtra;
    kidFinal += sundayExtra;
    // Sunday surcharge NOT applied to students as the user said "charge fix rahega.. 200"

    const safeAdults = Number(adults) || 0;
    const safeKids = Number(kids) || 0;
    const safeStudents = Number(students) || 0;

    const subtotal = (safeAdults * adultMRP) + (safeKids * kidMRP) + (safeStudents * studentFinal);
    const total = (safeAdults * adultFinal) + (safeKids * kidFinal) + (safeStudents * studentFinal);
    const discount = subtotal - total;

    return { subtotal, discount, total, isSunday, adultMRP, kidMRP, adultFinal, kidFinal, studentFinal };
  }, [date, slot, adults, kids, students, isMorning, sundayExtra]);

  const currentOffer = isMorning ? OFFERS.MORNING : OFFERS.EVENING;

  const handleCheckout = () => {
    if (adults + kids + students === 0) return alert("Please select at least one guest.");
    if (isSlotBlocked(date, slot)) return alert("Slot unavailable.");
    setShowTerms(true);
  };

  const finalProceed = () => {
    const draft = { 
      date, 
      time: slot, 
      adults, 
      kids, 
      students,
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
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-black text-slate-900">₹{pricingData.adultFinal}</p>
                            <p className="text-sm font-bold text-slate-300 line-through">MRP ₹{pricingData.adultMRP}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={() => setAdults(Math.max(0, adults-1))} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">-</button>
                        <span className="text-xl font-black min-w-[1.5rem] text-center">{adults}</span>
                        <button onClick={() => setAdults(adults+1)} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">+</button>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Child Entry</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-black text-slate-900">₹{pricingData.kidFinal}</p>
                            <p className="text-sm font-bold text-slate-300 line-through">MRP ₹{pricingData.kidMRP}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={() => setKids(Math.max(0, kids-1))} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">-</button>
                        <span className="text-xl font-black min-w-[1.5rem] text-center">{kids}</span>
                        <button onClick={() => setKids(kids+1)} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">+</button>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Entry</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-black text-slate-900">₹{pricingData.studentFinal}</p>
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-tighter">Fixed Rate</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl">
                        <button onClick={() => setStudents(Math.max(0, students-1))} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">-</button>
                        <span className="text-xl font-black min-w-[1.5rem] text-center">{students}</span>
                        <button onClick={() => setStudents(students+1)} className="w-10 h-10 rounded-xl bg-white font-black shadow-sm active:scale-90 transition-transform">+</button>
                    </div>
                </div>
            </div>

            {/* FOOD OPTION BANNER - HIGHLIGHTED */}
            <div className="bg-white border-4 border-emerald-500 p-8 rounded-[2.5rem] flex items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl shadow-lg">
                    <i className="fas fa-gift"></i>
                </div>
                <div className="relative z-10">
                    <p className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Special Surprise Inclusion</p>
                    <p className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                        <span className="text-emerald-500">FREE</span> {currentOffer}
                    </p>
                </div>
            </div>
        </div>

        {/* Checkout Summary - REDESIGNED */}
        <div className="flex justify-center pt-10">
            <div className="w-full max-w-lg bg-slate-900 rounded-[3.5rem] p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] space-y-10 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                {/* Summary Details */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center text-sm font-black uppercase text-white/30 tracking-widest px-2">
                        <span>Original Price (MRP)</span>
                        <span>₹{pricingData.subtotal}</span>
                    </div>
                    
                    {pricingData.discount > 0 && (
                        <div className="flex justify-between items-end bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                            <div>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Instant Savings</p>
                                <p className="text-sm font-bold text-white/60">Limited Offer Discount</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-emerald-400 tracking-tighter">- ₹{pricingData.discount}</span>
                            </div>
                        </div>
                    )}

                    {pricingData.isSunday && (
                        <div className="flex justify-between items-center bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                            <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Sunday Holiday Surcharge</p>
                            <span className="text-xs font-black text-amber-500/60">+ ₹50 per person</span>
                        </div>
                    )}
                </div>

                <div className="text-center space-y-3 pt-6 border-t border-white/5">
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em]">Final Ticket Amount</p>
                    <div className="text-6xl font-black text-white tracking-tighter">
                        ₹{pricingData.total}
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl mt-4">
                        <p className="text-amber-500 text-sm font-black uppercase tracking-widest leading-relaxed">Online booking is temporarily unavailable.<br/>Tickets available at resort counter.</p>
                    </div>
                </div>
                
                <button 
                  disabled={true} 
                  className="w-full bg-slate-800 h-24 rounded-[2.5rem] text-slate-500 font-black uppercase tracking-[0.2em] text-lg cursor-not-allowed"
                >
                    Online Booking Suspended
                </button>

                <div className="flex items-center justify-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                    <div className="flex gap-1">
                      <i className="fas fa-star text-amber-500/40"></i>
                      <i className="fas fa-star text-amber-500/40"></i>
                      <i className="fas fa-star text-amber-500/40"></i>
                    </div>
                    Trusted by 10,000+ Guests
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
