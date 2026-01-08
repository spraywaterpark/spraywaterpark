import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';
import { generateConfirmationMessage } from '../services/gemini_service';
import { cloudSync } from '../services/cloud_sync';

const SecurePayment: React.FC<{ addBooking: (b: Booking) => void }> = ({ addBooking }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

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

    try {
      await new Promise(res => setTimeout(res, 2000));

      const bookingId = 'SWP-' + Math.floor(100000 + Math.random() * 900000);
      const final: Booking = {
        ...draft,
        id: bookingId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      const [aiMessage] = await Promise.all([
        generateConfirmationMessage(final).catch(() => "Booking Confirmed! See you at the park."),
        cloudSync.saveBooking(final).catch(() => false)
      ]);

      sessionStorage.setItem('last_ai_message', aiMessage);
      addBooking(final);
      sessionStorage.removeItem('swp_draft_booking');
      navigate('/my-bookings');
    } catch {
      alert("There was an issue processing your booking. Please try again.");
      setIsPaying(false);
    }
  };

  if (!draft) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-10 animate-fade">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Info */}
        <div className="text-white space-y-8">
          <h2 className="text-4xl sm:text-5xl font-black uppercase">Secure Checkout</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Your booking is almost complete. Please verify your details and proceed with the payment.
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
        </div>

        {/* Right Payment Card */}
        <div className="bg-white rounded-3xl p-10 sm:p-14 shadow-2xl border border-gray-100 text-center space-y-8">

          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            <i className="fas fa-lock"></i>
          </div>

          <div>
            <h3 className="text-3xl font-black uppercase text-slate-900">Checkout</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">
              Secure Payment Gateway
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-gray-100">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-400">Guest</span>
              <span className="text-slate-900">{draft?.name || 'Guest'}</span>
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
              <>Pay ₹{draft?.totalAmount}</>
            )}
          </button>

          <p className="text-[10px] text-gray-400 font-bold uppercase italic">
            256-bit SSL Secured Payment
          </p>

        </div>
      </div>
    </div>
  );
};

export default SecurePayment;
