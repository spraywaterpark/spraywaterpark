
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';

const SecurePayment: React.FC<{ addBooking: (b: Booking) => void }> = ({ addBooking }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  useEffect(() => {
    const saved = sessionStorage.getItem('swp_draft_booking');
    const authString = sessionStorage.getItem('swp_auth');
    const auth = authString ? JSON.parse(authString) : {};
    
    if (saved) {
      setDraft({ ...JSON.parse(saved), ...auth.user });
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handlePay = async () => {
    if (isPaying) return;
    setIsPaying(true);
    setStatus('saving');

    try {
      const bookingId = 'SWP-' + Math.floor(100000 + Math.random() * 900000);
      const final: Booking = {
        ...draft,
        id: bookingId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // Failsafe: if sync doesn't respond in 15 seconds, throw error
      const syncTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Network Timeout. Please check connection.")), 15000));
      
      const saved = await Promise.race([
        cloudSync.saveBooking(final),
        syncTimeout
      ]);

      if (!saved) throw new Error("Cloud Sync Failed. Please try again.");

      addBooking(final);
      sessionStorage.removeItem('swp_draft_booking');

      // Async WA - don't wait for it to finish for UI success
      notificationService.sendWhatsAppTicket(final).catch(e => console.warn("WA Deferred fail:", e));
      
      setStatus('done');
      setTimeout(() => navigate('/my-bookings'), 1500);

    } catch (err: any) {
      console.error("Payment Error:", err);
      alert(err.message || "Something went wrong. Please check your internet.");
      setIsPaying(false);
      setStatus('idle');
    }
  };

  if (!draft) return null;

  return (
    <div className="w-full max-w-xl mx-auto py-10 px-4 animate-slide-up">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-10 text-center border border-slate-100">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner ${draft.paymentMode === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
          <i className={draft.paymentMode === 'online' ? "fas fa-shield-alt" : "fas fa-cash-register"}></i>
        </div>
        
        <div>
          <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tight">Confirm Booking</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Final Step to Reservation</p>
        </div>
        
        <div className="bg-slate-50 p-8 rounded-[2rem] space-y-5 border border-slate-100 text-left">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Guest Name</span>
                <span className="text-sm font-black text-slate-900">{draft.name}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact</span>
                <span className="text-sm font-black text-slate-900">{draft.mobile}</span>
            </div>
            <div className="pt-5 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Amount</span>
                <span className="text-4xl font-black text-blue-600 tracking-tighter">₹{draft.totalAmount}</span>
            </div>
        </div>

        <button 
          onClick={handlePay} 
          disabled={isPaying} 
          className="w-full btn-resort h-20 shadow-2xl hover:scale-[1.02] disabled:opacity-50 !bg-blue-400 !text-white"
        >
           {status === 'saving' ? (
             <span className="flex items-center gap-3"><i className="fas fa-circle-notch fa-spin"></i> Confirming...</span>
           ) : status === 'done' ? (
             <span className="flex items-center gap-3"><i className="fas fa-check"></i> Confirmed!</span>
           ) : 'Confirm & Generate Ticket'}
        </button>

        <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
           <i className="fas fa-lock text-blue-400"></i> Encrypted Secure Transaction
        </div>
      </div>
    </div>
  );
};

export default SecurePayment;
