
import React, { useState, useEffect } from 'react';
import { Booking, AdminSettings } from '../types';
import { TIME_SLOTS } from '../constants';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';

interface CounterPortalProps {
  settings: AdminSettings;
  bookings: Booking[];
  onAddBooking: (b: Booking) => void;
  onUpdateBooking: (b: Booking) => void;
}

const CounterPortal: React.FC<CounterPortalProps> = ({ settings, bookings, onAddBooking, onUpdateBooking }) => {
  const [data, setData] = useState({
    name: '',
    mobile: '',
    adults: 1,
    kids: 0,
    date: new Date().toLocaleDateString('en-CA'),
    slot: TIME_SLOTS[0],
    paymentMode: 'cash' as 'cash' | 'upi'
  });

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editingBooking) {
      setData({
        name: editingBooking.name,
        mobile: editingBooking.mobile,
        adults: editingBooking.adults,
        kids: editingBooking.kids,
        date: editingBooking.date,
        slot: editingBooking.time,
        paymentMode: (editingBooking.paymentMode as 'cash' | 'upi') || 'cash'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingBooking]);

  // Auto-calculate rates based on new requirements
  const isMorning = data.slot.toLowerCase().includes('morning');
  const isSunday = new Date(data.date).getDay() === 0;
  const sundayExtra = isSunday ? 50 : 0;

  let adultMRP = isMorning ? 500 : 800;
  let kidMRP = isMorning ? 350 : 500;
  let adultFinal = isMorning ? 400 : 600;
  let kidFinal = isMorning ? 300 : 400;

  // Apply Sunday Surcharge
  adultMRP += sundayExtra;
  kidMRP += sundayExtra;
  adultFinal += sundayExtra;
  kidFinal += sundayExtra;

  const totalMRP = (data.adults * adultMRP) + (data.kids * kidMRP);
  const totalAmount = (data.adults * adultFinal) + (data.kids * kidFinal);
  const totalDiscount = totalMRP - totalAmount;

  const generateTicketId = (dateStr: string, timeStr: string) => {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const datePart = `${dd}${mm}${yy}`;
    const shiftCode = timeStr.toLowerCase().includes('morning') ? '1' : '2';
    const countToday = bookings.filter(b => b.date === dateStr && b.time === timeStr).length + 1;
    const seq = String(countToday).padStart(3, '0');
    return `SAR/${datePart}${shiftCode}-${seq}`;
  };

  const now = new Date();
  const today = now.toLocaleDateString('en-CA');
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeVal = currentHour + (currentMinute / 60);

  const isOldDate = data.date < today;
  let isSlotExpired = false;
  let expiredMessage = "";

  if (data.date === today) {
    if (data.slot.toLowerCase().includes('morning') && currentTimeVal >= 13) {
      isSlotExpired = true;
      expiredMessage = "Morning Slot booking closed at 1:00 PM";
    } else if (data.slot.toLowerCase().includes('evening') && currentTimeVal >= 19.5) {
      isSlotExpired = true;
      expiredMessage = "Evening Slot booking closed at 7:30 PM";
    }
  }

  const isInvalid = isOldDate || isSlotExpired;

  const isEditable = (booking: Booking) => {
    if (!booking.createdAt) return false;
    const created = new Date(booking.createdAt).getTime();
    const now = new Date().getTime();
    return (now - created) <= 10 * 60 * 1000; // 10 minutes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || data.mobile.length !== 10) return alert("Valid Name & Mobile required");
    
    if (editingBooking && !isEditable(editingBooking)) {
      alert("Edit time expired (10 mins limit). Cannot modify this ticket.");
      setEditingBooking(null);
      setData({ ...data, name: '', mobile: '', adults: 1, kids: 0 });
      return;
    }

    if (isOldDate && !editingBooking) return alert("Old dates are not allowed for booking.");
    if (isSlotExpired && !editingBooking) return alert(expiredMessage);
    
    setLoading(true);
    
    const bookingToSave: Booking = editingBooking ? {
      ...editingBooking,
      name: data.name,
      mobile: data.mobile,
      date: data.date,
      time: data.slot,
      adults: data.adults,
      kids: data.kids,
      totalAmount: totalAmount,
      paymentMode: data.paymentMode,
    } : {
      id: generateTicketId(data.date, data.slot),
      name: data.name,
      mobile: data.mobile,
      date: data.date,
      time: data.slot,
      adults: data.adults,
      kids: data.kids,
      discountCode: totalDiscount > 0 ? "COUNTER_OFFER" : "",
      totalAmount: totalAmount,
      status: 'confirmed',
      paymentMode: data.paymentMode,
      createdAt: new Date().toLocaleString("en-IN", { timeZone: 'Asia/Kolkata' })
    };

    try {
      let saved = false;
      if (editingBooking) {
        saved = await cloudSync.updateBooking(bookingToSave);
      } else {
        saved = await cloudSync.saveBooking(bookingToSave);
      }

      if (!saved) throw new Error("Cloud Sync Failed");
      
      if (editingBooking) {
        onUpdateBooking(bookingToSave);
        setEditingBooking(null);
        setData({ ...data, name: '', mobile: '', adults: 1, kids: 0 });
        alert("Booking Updated Successfully!");
      } else {
        await onAddBooking(bookingToSave);
        // Send WhatsApp
        await notificationService.sendWhatsAppTicket(bookingToSave);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setData({ ...data, name: '', mobile: '', adults: 1, kids: 0 });
        }, 3000);
      }
    } catch (err) {
      alert("Action failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-slide-up">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 mb-8">
        <div className="bg-slate-900 p-8 text-center relative">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{editingBooking ? 'Edit Booking' : 'Counter Booking Portal'}</h2>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-2">{editingBooking ? `Modifying Ticket #${editingBooking.id}` : 'Offline Ticket Generation'}</p>
            {editingBooking && (
                <button 
                    onClick={() => {
                        setEditingBooking(null);
                        setData({ ...data, name: '', mobile: '', adults: 1, kids: 0 });
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all"
                >
                    Cancel Edit
                </button>
            )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Guest Name</label>
                    <input 
                        className="w-full bg-slate-50 h-16 rounded-2xl px-6 font-bold text-slate-900 border-2 border-transparent focus:border-slate-900 outline-none transition-all"
                        placeholder="Ex: Rajesh Kumar"
                        value={data.name}
                        onChange={e => setData({...data, name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Mobile (10 Digit)</label>
                    <input 
                        className="w-full bg-slate-50 h-16 rounded-2xl px-6 font-bold text-slate-900 border-2 border-transparent focus:border-slate-900 outline-none transition-all"
                        placeholder="98XXXXXXXX"
                        maxLength={10}
                        value={data.mobile}
                        onChange={e => setData({...data, mobile: e.target.value.replace(/\D/g, '')})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Visit Date</label>
                    <input 
                        type="date"
                        className="w-full bg-slate-50 h-16 rounded-2xl px-6 font-bold text-slate-900 border-2 border-transparent focus:border-slate-900 outline-none transition-all"
                        value={data.date}
                        onChange={e => setData({...data, date: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Session Slot</label>
                    <select 
                        className="w-full bg-slate-50 h-16 rounded-2xl px-6 font-bold text-slate-900 border-2 border-transparent focus:border-slate-900 outline-none transition-all appearance-none"
                        value={data.slot}
                        onChange={e => setData({...data, slot: e.target.value})}
                    >
                        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Adults</label>
                    <div className="flex items-center bg-slate-50 rounded-2xl p-2">
                        <button type="button" onClick={() => setData({...data, adults: Math.max(1, data.adults-1)})} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm">-</button>
                        <span className="flex-1 text-center font-black">{data.adults}</span>
                        <button type="button" onClick={() => setData({...data, adults: data.adults+1})} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm">+</button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Kids</label>
                    <div className="flex items-center bg-slate-50 rounded-2xl p-2">
                        <button type="button" onClick={() => setData({...data, kids: Math.max(0, data.kids-1)})} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm">-</button>
                        <span className="flex-1 text-center font-black">{data.kids}</span>
                        <button type="button" onClick={() => setData({...data, kids: data.kids+1})} className="w-12 h-12 bg-white rounded-xl font-black shadow-sm">+</button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        type="button" 
                        onClick={() => setData({...data, paymentMode: 'cash'})}
                        className={`h-16 rounded-2xl font-black uppercase tracking-widest text-xs border-2 transition-all ${data.paymentMode === 'cash' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                        Cash Payment
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setData({...data, paymentMode: 'upi'})}
                        className={`h-16 rounded-2xl font-black uppercase tracking-widest text-xs border-2 transition-all ${data.paymentMode === 'upi' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                        UPI / QR Code
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 text-center space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                    <div className="text-left">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total MRP</p>
                        <p className="text-xl font-bold text-white/60 line-through">₹{totalMRP}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest text-right">Instant Savings</p>
                        <p className="text-xl font-black text-emerald-400">-₹{totalDiscount}</p>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Payable Amount</p>
                    <div className="text-5xl font-black text-white tracking-tighter">₹{totalAmount}</div>
                    {isSunday && <p className="text-[8px] font-bold text-amber-400 uppercase tracking-widest mt-2">(₹50 Holiday Surcharge Included)</p>}
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading || success || (isInvalid && !editingBooking)}
                className={`w-full h-20 rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${(isInvalid && !editingBooking) ? 'bg-red-500/20 text-red-500 cursor-not-allowed' : success ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : success ? <><i className="fas fa-check-circle"></i> {editingBooking ? 'Updated' : 'Booking Done'}</> : editingBooking ? 'Update Booking' : isOldDate ? 'Old Date Not Allowed' : isSlotExpired ? 'Slot booking closed' : 'Confirm & Generate Ticket'}
            </button>
            {isInvalid && <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest">{isOldDate ? "Please select current or future date" : expiredMessage}</p>}
        </form>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10">
          <h4 className="text-white text-[10px] font-black uppercase tracking-widest mb-6 px-4">Recent Multi-counter Bookings</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {bookings.slice(0, 10).map(b => (
                  <div key={b.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                      <div>
                          <p className="text-white font-bold text-sm">{b.name} <span className="text-[10px] text-white/40 ml-2">#{b.id}</span></p>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{b.date} • {b.time.split(':')[0]}</p>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="text-right">
                              <p className="text-white font-black text-sm">₹{b.totalAmount}</p>
                              <p className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${(!b.paymentMode || b.paymentMode === 'cash') ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                  {b.paymentMode || 'cash'}
                              </p>
                          </div>
                          {isEditable(b) && (
                            <button 
                              onClick={() => setEditingBooking(b)}
                              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                              title="Edit Booking"
                            >
                              <i className="fas fa-edit text-xs"></i>
                            </button>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default CounterPortal;
