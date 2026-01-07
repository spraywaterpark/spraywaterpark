import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';
import { generateConfirmationMessage } from '../services/gemini_service';

const SecurePayment: React.FC<{ addBooking: (b: Booking) => void }> = ({ addBooking }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('swp_draft_booking');
    const auth = JSON.parse(sessionStorage.getItem('swp_auth') || '{}');
    if (saved) setDraft({ ...JSON.parse(saved), ...auth.user });
    else navigate('/');
  }, [navigate]);

  const processPayment = async () => {
    setIsPaying(true);
    await new Promise(res => setTimeout(res, 2500));
    
    const bookingId = 'SWP-' + Math.floor(100000 + Math.random()*900000);
    const final: Booking = { 
        ...draft, 
        id: bookingId, 
        status: 'confirmed', 
        createdAt: new Date().toISOString() 
    };
    
    const aiMessage = await generateConfirmationMessage(final);
    sessionStorage.setItem('last_ai_message', aiMessage);
    
    addBooking(final);
    sessionStorage.removeItem('swp_draft_booking');
    navigate('/my-bookings');
  };

  return (
    <div className="w-full max-w-lg animate-reveal px-4">
      <div className="glass-card p-12 md:p-16 text-center">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-10 shadow-inner">
          <i className="fas fa-shield-alt"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Checkout Securely</h2>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 mb-12">256-Bit SSL Encrypted Terminal</p>

        <div className="bg-slate-50 p-10 rounded-[2rem] text-left space-y-8 mb-12 border border-slate-200">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Holder</span>
              <span className="text-sm font-bold text-slate-900">{draft?.name}</span>
           </div>
           <div className="flex justify-between items-center pt-8 border-t border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Total</span>
              <span className="text-4xl font-black text-blue-600 tracking-tighter">₹{draft?.totalAmount}</span>
           </div>
        </div>

        <button 
            onClick={processPayment} 
            disabled={isPaying} 
            className="w-full btn-resort h-20 text-lg shadow-3xl disabled:opacity-50"
        >
           {isPaying ? (
               <span className="flex items-center justify-center gap-4">
                   <i className="fas fa-circle-notch fa-spin"></i> Validating...
               </span>
           ) : (
               <>Confirm Payment</>
           )}
        </button>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-10 italic opacity-50">ResortPay &copy; Verified Secure Gateway</p>
      </div>
    </div>
  );
};
export default SecurePayment;
