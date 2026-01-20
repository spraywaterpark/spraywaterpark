import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';

const SecurePayment: React.FC<{ addBooking: (b: Booking) => void }> = ({ addBooking }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'notifying' | 'done'>('idle');

  useEffect(() => {
    const saved = sessionStorage.getItem('swp_draft_booking');
    const auth = JSON.parse(sessionStorage.getItem('swp_auth') || '{}');
    if (saved) setDraft({ ...JSON.parse(saved), ...auth.user });
    else navigate('/');
  }, [navigate]);

  const handlePay = async () => {
    setIsPaying(true);
    setStatus('processing');

    try {
      const bookingId = 'SWP-' + Math.floor(100000 + Math.random() * 900000);
      const final: Booking = {
        ...draft,
        id: bookingId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // 1. Save to Google Sheet
      const saved = await cloudSync.saveBooking(final);
      if (!saved) throw new Error("Could not save booking to Cloud.");

      // 2. Notify via WhatsApp (Backend fetches credentials now)
      setStatus('notifying');
      const wa = await notificationService.sendWhatsAppTicket(final);
      
      addBooking(final);
      sessionStorage.removeItem('swp_draft_booking');
      
      setStatus('done');
      setTimeout(() => navigate('/my-bookings'), 2000);

    } catch (err: any) {
      alert(err.message || "Something went wrong.");
      setIsPaying(false);
      setStatus('idle');
    }
  };

  if (!draft) return null;

  return (
    <div className="w-full max-w-xl mx-auto py-10 px-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto">
          <i className="fas fa-shield-alt"></i>
        </div>
        
        <h3 className="text-3xl font-black uppercase text-slate-900">Secure Payment</h3>
        
        <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                <span>Guest</span><span className="text-slate-900">{draft.name}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-xs font-black uppercase text-slate-400">Total</span>
                <span className="text-4xl font-black text-blue-600">₹{draft.totalAmount}</span>
            </div>
        </div>

        <button onClick={handlePay} disabled={isPaying} className="w-full btn-resort h-16 !bg-blue-600 text-white shadow-xl">
           {status === 'processing' ? 'Saving Booking...' : 
            status === 'notifying' ? 'Sending WhatsApp...' : 
            status === 'done' ? 'Success!' : 'Confirm & Pay'}
        </button>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           Your ticket will be sent to {draft.mobile} via WhatsApp
        </p>
      </div>
    </div>
  );
};

export default SecurePayment;
