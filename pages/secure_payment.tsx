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
    <div className="max-w-md mx-auto mt-12 px-4 animate-fade">
      <div className="bg-white p-10 md:p-14 rounded-[3rem] card-premium text-center border border-white">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-8">
          <i className="fas fa-lock"></i>
        </div>
        <h2 className="text-3xl font-black text-[#1B2559] uppercase tracking-tight">Checkout</h2>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2 mb-10">Secure Gateway Powered by ResortPay</p>

        <div className="bg-gray-50 p-8 rounded-[2rem] text-left space-y-6 mb-10 border border-gray-100">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase">Booking Name</span>
              <span className="text-sm font-black text-[#1B2559]">{draft?.name}</span>
           </div>
           <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount to Pay</span>
              <span className="text-4xl font-black text-blue-600">₹{draft?.totalAmount}</span>
           </div>
        </div>

        <button 
            onClick={processPayment} 
            disabled={isPaying} 
            className="w-full btn-resort !bg-blue-600 !text-white py-6 text-xl shadow-2xl relative overflow-hidden uppercase tracking-widest"
        >
           {isPaying ? (
               <span className="flex items-center justify-center gap-3">
                   <i className="fas fa-circle-notch fa-spin"></i> Processing...
               </span>
           ) : (
               <>Pay ₹{draft?.totalAmount} Now</>
           )}
        </button>
        <p className="text-[10px] text-gray-300 font-bold uppercase mt-8 italic">Encrypted Secure Transaction • 256-bit SSL</p>
      </div>
    </div>
  );
};
export default SecurePayment;
