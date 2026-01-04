
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';

const SecurePayment: React.FC<{ addBooking: (b: Booking) => void }> = ({ addBooking }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('swp_draft_booking');
    const auth = JSON.parse(localStorage.getItem('swp_auth') || '{}');
    if (saved) setDraft({ ...JSON.parse(saved), ...auth.user });
    else navigate('/');
  }, [navigate]);

  const pay = async () => {
    setIsPaying(true);
    await new Promise(res => setTimeout(res, 1500));
    const final: Booking = { ...draft, id: 'SWP-' + Date.now().toString().slice(-6), status: 'confirmed', createdAt: new Date().toISOString() };
    addBooking(final);
    sessionStorage.removeItem('swp_draft_booking');
    navigate('/my-bookings');
  };

  return (
    <div className="max-w-md mx-auto animate-fade">
      <div className="bg-white p-12 rounded-[3rem] card-shadow text-center space-y-8">
        <h2 className="text-2xl font-black uppercase">Secure Pay</h2>
        <div className="bg-gray-50 p-6 rounded-3xl text-left">
           <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Amount</p>
           <p className="text-3xl font-black text-blue-600">₹{draft?.totalAmount}</p>
        </div>
        <button onClick={pay} disabled={isPaying} className="w-full btn-primary py-5">
           {isPaying ? 'Processing...' : `Confirm Payment`}
        </button>
      </div>
    </div>
  );
};
export default SecurePayment;
