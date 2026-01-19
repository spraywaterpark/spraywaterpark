
import React from 'react';
import { Booking } from '../types';

const TicketHistory: React.FC<{ bookings: Booking[], mobile: string }> = ({ bookings, mobile }) => {
  const userList = bookings.filter(b => b.mobile === mobile);
  const lastAiMessage = sessionStorage.getItem('last_ai_message') || "Thank you for booking with us! 🌊 Your official tickets have been dispatched to your WhatsApp number. We can't wait to see you soon at the resort for a day full of splashes and joy!";

  const sendWhatsApp = (msg: string, phone: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-fade space-y-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#1B2559] uppercase tracking-tight">
            My Tickets
          </h2>
          <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
            Spray Aqua Resort Digital Wallet
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-700 shadow border border-slate-200 hover:bg-slate-50 transition"
        >
          <i className="fas fa-print mr-2"></i> Print Copy
        </button>
      </div>

      {userList.length === 0 ? (
        <div className="bg-white p-16 sm:p-24 rounded-[3rem] text-center border-4 border-dashed border-slate-200 shadow-inner">
          <i className="fas fa-ticket-alt text-6xl sm:text-8xl text-slate-100 mb-6"></i>
          <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">
            No Active Reservations
          </p>
          <button
            onClick={() => window.location.hash = '#/book'}
            className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow hover:scale-105 transition"
          >
            Book Your First Splash <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {userList.map((b, idx) => (
            <div key={b.id}>

              {/* Thank you and Resend Section (Primary) */}
              {idx === 0 && (
                <div className="bg-emerald-50 p-8 sm:p-12 rounded-[2.5rem] border border-emerald-200 mb-10 shadow-lg relative overflow-hidden">
                  <i className="fab fa-whatsapp absolute -right-4 -bottom-4 text-8xl text-emerald-100/50 -rotate-12"></i>
                  
                  <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    
                    <div className="max-w-xl space-y-3">
                      <h3 className="text-2xl font-black text-emerald-900 uppercase">Booking Confirmed</h3>
                      <p className="text-emerald-700 font-semibold text-base leading-relaxed">
                        Thank you for booking with us! 🌊 Your official tickets have been dispatched to your WhatsApp number. 
                        We can't wait to see you soon at the resort for a day full of splashes and joy!
                      </p>
                    </div>

                    <div className="pt-4 w-full max-w-xs">
                      <button
                        onClick={() => sendWhatsApp(lastAiMessage, b.mobile)}
                        className="w-full bg-emerald-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-xl hover:shadow-emerald-200 flex items-center justify-center gap-3"
                      >
                        <i className="fab fa-whatsapp text-lg"></i> Resend Ticket
                      </button>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-4">
                        Instant Ticket Delivery via WhatsApp
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ticket Card */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-slate-200">

                <div className="bg-[#1B2559] lg:w-64 p-10 flex flex-col justify-center items-center text-white text-center">
                  <p className="text-[10px] font-black uppercase opacity-70 mb-2 tracking-[0.3em]">
                    Digital Pass
                  </p>
                  <p className="text-2xl font-black mb-6 bg-white/10 px-4 py-1 rounded border border-white/20">
                    {b.id}
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.id}`}
                    alt="Booking QR Code"
                    className="w-28 h-28 bg-white p-2 rounded-xl"
                  />
                  <p className="mt-4 text-[9px] font-black uppercase opacity-50 tracking-widest">
                    One QR per Booking
                  </p>
                </div>

                <div className="flex-1 p-8 sm:p-12 flex flex-col sm:flex-row justify-between items-center gap-10">
                  <div className="text-center sm:text-left space-y-4">
                    <h4 className="text-3xl font-black text-[#1B2559] uppercase">
                      {b.date}
                    </h4>
                    <p className="text-blue-700 font-black text-xs uppercase tracking-[0.3em]">
                      {b.time}
                    </p>

                    <div className="flex gap-3 justify-center sm:justify-start">
                      <span className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-black uppercase">
                        {b.adults} Adults
                      </span>
                      <span className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-black uppercase">
                        {b.kids} Kids
                      </span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">
                      Confirmed Payment
                    </p>
                    <h3 className="text-4xl sm:text-5xl font-black text-[#1B2559]">
                      ₹{b.totalAmount}
                    </h3>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#1B2559] p-8 rounded-2xl text-center text-white/50 font-black text-[10px] uppercase tracking-[0.4em] border border-white/5">
        Spray Aqua Resort • Official Booking Receipt
      </div>
    </div>
  );
};

export default TicketHistory;
