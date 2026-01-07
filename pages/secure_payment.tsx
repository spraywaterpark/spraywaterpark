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
    <div className="w-full max-w-2xl animate-fade px-4 py-6 md:py-10 flex flex-col items-center">
      <div className="glass-card p-8 md:p-20 text-center flex flex-col items-center w-full shadow-3xl">
        <div className="w-20 h-20 md:w-28 md:h-28 bg-emerald-50 text-emerald-600 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-4xl md:text-5xl mx-auto mb-10 md:mb-12 shadow-inner border border-emerald-100">
          <i className="fas fa-shield-alt"></i>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4 text-center">Secure Payment</h2>
        <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.5em] mb-10 md:mb-14 text-center">SSL 256-Bit Encrypted</p>

        <div className="bg-slate-50 p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] w-full max-w-md space-y-8 md:space-y-10 mb-10 md:mb-14 border border-slate-100 text-center flex flex-col items-center">
           <div className="flex flex-col items-center gap-2 md:gap-3">
              <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Authorized Guest</span>
              <span className="text-xl md:text-2xl font-black text-[#1B2559] uppercase tracking-tight text-center">{draft?.name}</span>
           </div>
           <div className="w-full border-t border-slate-200 pt-8 md:pt-10 flex flex-col items-center gap-3 md:gap-4">
              <span className="text-[11px] md:text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] text-center">Total Payable</span>
              <span className="text-6xl md:text-8xl font-black text-[#0061FF] tracking-tighter leading-none text-center">₹{draft?.totalAmount}</span>
           </div>
        </div>

        <button 
            onClick={processPayment} 
            disabled={isPaying} 
            className="w-full btn-resort h-20 md:h-24 text-lg md:text-xl shadow-3xl disabled:opacity-50 max-w-md flex items-center justify-center"
        >
           {isPaying ? (
               <span className="flex items-center justify-center gap-5">
                   <i className="fas fa-circle-notch fa-spin"></i> Validating...
               </span>
           ) : (
               <>Confirm Payment</>
           )}
        </button>
        <div className="mt-10 md:mt-12 flex items-center justify-center gap-4 text-slate-300">
           <i className="fas fa-lock text-xs"></i>
           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-center">ResortPay Secure Gateway</p>
        </div>
      </div>
    </div>
  );
};
export default SecurePayment;
