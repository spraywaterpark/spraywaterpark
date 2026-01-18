
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';
import { cloudSync } from '../services/cloud_sync';
import { notificationService } from '../services/notification_service';

const SecurePayment: React.FC<{ addBooking: (b: Booking) => void }> = ({ addBooking }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [waStatus, setWaStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

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

  const processPayment = async () => {
    if (isPaying) return;
    setIsPaying(true);
    setSyncError(null);

    try {
      // 1. FINAL SECURITY SYNC
      const latestSettings = await cloudSync.fetchSettings();
      if (latestSettings) {
        const currentShift = draft.time.toLowerCase().includes('morning') ? 'morning' : 'evening';
        const isBlocked = (latestSettings.blockedSlots || []).some(bs => 
          bs.date === draft.date && (bs.shift === currentShift || bs.shift === 'all')
        );

        if (isBlocked) {
          setIsPaying(false);
          const msg = "We apologize, but the selected date and time slot have reached full capacity.";
          setSyncError(`⚠️ ${msg}`);
          alert(msg);
          return;
        }
      }

      // 2. Simulated Payment delay
      await new Promise(res => setTimeout(res, 1500));

      const bookingId = 'SWP-' + Math.floor(100000 + Math.random() * 900000);
      const final: Booking = {
        ...draft,
        id: bookingId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // 3. Save to Cloud
      const success = await cloudSync.saveBooking(final);
      if (!success) throw new Error("SERVER_REJECTED");

      // 4. AUTOMATIC OFFICIAL WHATSAPP SENDING
      setWaStatus('sending');
      const waSuccess = await notificationService.sendWhatsAppTicket(final);
      setWaStatus(waSuccess ? 'sent' : 'failed');

      // 5. Finalize
      addBooking(final);
      sessionStorage.removeItem('swp_draft_booking');
      
      // Short delay so they see the "Sent" status before redirect
      setTimeout(() => {
        navigate('/my-bookings');
      }, 1500);

    } catch (err: any) {
      console.error("Payment Process Error:", err);
      setIsPaying(false);
      if (err.message === "SERVER_REJECTED") {
        setSyncError("⚠️ We apologize, but this slot is no longer available.");
      } else {
        alert("There was an issue processing your booking. Please try again.");
      }
    }
  };

  if (!draft) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-10 animate-fade">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="text-white space-y-8">
          <h2 className="text-4xl sm:text-5xl font-black uppercase">Secure Checkout</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Your booking is almost complete. We are performing a final check and sending your official ticket via WhatsApp.
          </p>

          <div className="bg-white/10 p-8 rounded-3xl border border-white/20 space-y-4">
            <div className="flex justify-between">
              <span className="text-xs uppercase opacity-60">Guest</span>
              <span className="font-bold">{draft?.name || 'Guest'}</span>
            </div>
            <div className="flex justify-between border-t border-white/20 pt-4">
              <span className="text-xs uppercase opacity-60">Total Payable</span>
              <span className="text-3xl font-black text-emerald-400">₹{draft?.totalAmount}</span>
            </div>
          </div>
          
          {waStatus === 'sending' && (
            <div className="bg-blue-500/20 border border-blue-500/30 p-6 rounded-2xl flex items-center gap-4">
               <i className="fas fa-paper-plane animate-bounce text-blue-400"></i>
               <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Dispatching Official WhatsApp Ticket...</p>
            </div>
          )}

          {waStatus === 'sent' && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4 animate-fade">
               <i className="fas fa-check-double text-emerald-400"></i>
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Ticket Sent Successfully!</p>
            </div>
          )}
          
          {syncError && (
            <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl text-red-100 text-[11px] font-black uppercase tracking-widest leading-relaxed">
              {syncError}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-10 sm:p-14 shadow-2xl border border-gray-100 text-center space-y-8">

          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            <i className="fas fa-lock"></i>
          </div>

          <div>
            <h3 className="text-3xl font-black uppercase text-slate-900">Checkout</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">
              Validating Schedule & Security
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-gray-100">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-400">Visit Date</span>
              <span className="text-slate-900">{draft?.date}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</span>
              <span className="text-4xl font-black text-blue-600">₹{draft?.totalAmount}</span>
            </div>
          </div>

          <button
            onClick={processPayment}
            disabled={isPaying}
            className="w-full py-5 rounded-xl bg-blue-600 text-white text-lg font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isPaying ? (
              <span className="flex items-center justify-center gap-3">
                <i className="fas fa-circle-notch fa-spin"></i> Processing...
              </span>
            ) : (
              <>Complete Reservation</>
            )}
          </button>

          <p className="text-[10px] text-gray-400 font-bold uppercase italic">
            Official Ticket will be sent to your WhatsApp automatically
          </p>

        </div>
      </div>
    </div>
  );
};

export default SecurePayment;
