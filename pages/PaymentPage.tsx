
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';
import { TERMS_AND_CONDITIONS } from '../constants';

const PaymentPage: React.FC<{ addBooking: (b: Booking) => void }> = ({ addBooking }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalBooking, setFinalBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('swp_draft_booking');
    const auth = JSON.parse(localStorage.getItem('swp_auth') || '{}');
    if (saved) setDraft({ ...JSON.parse(saved), ...auth.user });
    else navigate('/');
  }, [navigate]);

  const pay = async () => {
    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const final: Booking = { 
      ...draft, 
      id: 'SWP-' + Math.floor(100000 + Math.random() * 900000), 
      status: 'confirmed', 
      createdAt: new Date().toISOString() 
    };
    
    setFinalBooking(final);
    addBooking(final);
    sessionStorage.removeItem('swp_draft_booking');
    setIsPaying(false);
    setShowSuccess(true);
  };

  const getShareMessage = () => {
    if (!finalBooking) return "";
    const rulesList = TERMS_AND_CONDITIONS.map((rule, i) => `${i + 1}. ${rule}`).join('%0A');
    return `*Spray Aqua Resort - Booking Confirmed!*%0A%0A*Booking Details:*%0APass Code: ${finalBooking.id}%0ADate: ${finalBooking.date}%0ASlot: ${finalBooking.time}%0AGuests: ${finalBooking.adults} Adults, ${finalBooking.kids} Kids%0AAmount Paid: ₹${finalBooking.totalAmount}%0A%0A*Important Rules & Terms:*%0A${rulesList}%0A%0A_Please show this message at the entry counter._%0ASee you at the park! 🌊☀️`;
  };

  if (showSuccess && finalBooking) {
    return (
      <div className="max-w-2xl mx-auto animate-fade py-10">
        <div className="bg-white p-10 md:p-16 rounded-[3rem] card-shadow border border-white text-center space-y-8">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">
            <i className="fas fa-check-circle"></i>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter">Booking Successful!</h2>
            <p className="text-blue-600 font-black text-sm uppercase tracking-widest bg-blue-50 py-3 px-6 rounded-2xl inline-block border border-blue-100">
              Confirmation details sent to your registered mobile
            </p>
          </div>

          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 text-left space-y-4">
             <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking ID</span>
                <span className="font-black text-[#1B2559] text-xl">{finalBooking.id}</span>
             </div>
             <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
               A detailed summary including all terms and rules has been sent via SMS and WhatsApp. Please present the QR code at the entrance counter.
             </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href={`https://wa.me/${finalBooking.mobile}?text=${getShareMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-green-100"
            >
              <i className="fab fa-whatsapp text-xl"></i> Resend WhatsApp
            </a>
            <a 
              href={`sms:${finalBooking.mobile}?body=${getShareMessage().replace(/%20/g, ' ')}`}
              className="flex items-center justify-center gap-3 bg-[#1B2559] text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100"
            >
              <i className="fas fa-sms text-xl"></i> Resend SMS
            </a>
          </div>

          <button 
            onClick={() => navigate('/my-bookings')}
            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all"
          >
            View My Tickets <i className="fas fa-ticket-alt ml-2"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade">
      <div className="bg-white p-10 rounded-[2.5rem] card-shadow border border-white text-center space-y-8">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto">
          <i className="fas fa-lock"></i>
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#1B2559] uppercase tracking-tight">Checkout</h2>
          <p className="text-gray-400 font-bold text-xs uppercase mt-1">Payment Secure & Encrypted</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-3xl space-y-4 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Guest</span>
            <span className="font-black text-[#1B2559]">{draft?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Session</span>
            <span className="font-black text-[#1B2559]">{draft?.time.split(' - ')[1]}</span>
          </div>
          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="text-gray-400 font-black uppercase text-[10px]">Total Amount</span>
            <span className="text-2xl font-black text-blue-600">₹{draft?.totalAmount}</span>
          </div>
        </div>

        <button 
          onClick={pay} 
          disabled={isPaying}
          className="w-full btn-primary py-5 text-xl shadow-xl relative overflow-hidden"
        >
          {isPaying ? (
            <span className="flex items-center justify-center gap-3">
              <i className="fas fa-circle-notch fa-spin"></i> Processing...
            </span>
          ) : (
            <>Confirm & Pay ₹{draft?.totalAmount}</>
          )}
        </button>
        <p className="text-[10px] text-gray-300 font-bold uppercase italic">By paying, you agree to our resort rules.</p>
      </div>
    </div>
  );
};
export default PaymentPage;
