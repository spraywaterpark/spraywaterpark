import React from 'react';
import { Booking } from '../types';

const TicketHistory: React.FC<{ bookings: Booking[], mobile: string }> = ({ bookings, mobile }) => {
  const userList = bookings.filter(b => b.mobile === mobile);
  const lastAiMessage = sessionStorage.getItem('last_ai_message') || "Booking Confirmed!";

  const sendWhatsApp = (msg: string, phone: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade space-y-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 no-print px-2">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-[#1B2559] uppercase tracking-tighter">My Tickets</h2>
          <p className="text-slate-600 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Spray Aqua Resort Digital Wallet</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-blue-700 shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
                <i className="fas fa-print mr-2"></i> Print Paper Copy
            </button>
        </div>
      </div>

      {userList.length === 0 ? (
        <div className="bg-white p-24 rounded-[3.5rem] text-center border-4 border-dashed border-slate-200 flex flex-col items-center shadow-inner">
           <i className="fas fa-ticket-alt text-8xl text-slate-100 mb-8"></i>
           <p className="text-slate-500 font-black uppercase text-sm tracking-[0.3em]">No Active Reservations</p>
           <button onClick={() => window.location.hash = '#/book'} className="mt-8 bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:scale-105 transition-transform">Book Your First Splash <i className="fas fa-arrow-right ml-2"></i></button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {userList.map((b, idx) => (
            <div key={b.id} className="group">
              {/* WhatsApp Action Card */}
              {idx === 0 && (
                  <div className="bg-emerald-50 p-7 md:p-10 rounded-[2.5rem] border-2 border-emerald-200 mb-10 flex flex-col sm:flex-row items-center justify-between gap-8 no-print shadow-xl shadow-emerald-100 animate-fade">
                      <div className="flex items-center gap-6 text-center sm:text-left">
                          <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-emerald-400">
                              <i className="fab fa-whatsapp"></i>
                          </div>
                          <div>
                              <p className="text-emerald-900 font-black text-[13px] uppercase tracking-widest">Success! Booking Verified</p>
                              <p className="text-emerald-700 text-sm font-bold mt-1">Send these ticket details to your WhatsApp for easy entry.</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => sendWhatsApp(lastAiMessage, b.mobile)}
                        className="w-full sm:w-auto bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
                      >
                          Get on WhatsApp
                      </button>
                  </div>
              )}

              {/* Digital Ticket Card */}
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 relative group-hover:border-blue-200 transition-all">
                <div className="blue-gradient lg:w-64 p-12 flex flex-col justify-center items-center text-white text-center">
                    <p className="text-[10px] font-black uppercase opacity-70 tracking-[0.3em] mb-3">Entrance Pass</p>
                    <p className="text-3xl font-black tracking-tighter mb-8 bg-white/10 px-4 py-1 rounded-lg border border-white/20">{b.id}</p>
                    <div className="bg-white p-4 rounded-3xl shadow-2xl transform transition-transform group-hover:scale-110">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.id}`} alt="QR" className="w-28 h-28 mix-blend-multiply" />
                    </div>
                </div>
                
                <div className="flex-1 p-10 md:p-14 flex flex-col md:flex-row justify-between items-center gap-12">
                  <div className="text-center md:text-left space-y-5">
                    <div>
                        <h4 className="text-4xl font-black text-[#1B2559] uppercase leading-none tracking-tight">{b.date}</h4>
                        <p className="text-blue-700 font-black text-[11px] uppercase tracking-[0.4em] mt-3 bg-blue-50 inline-block px-3 py-1 rounded-md">{b.time}</p>
                    </div>
                    <div className="flex gap-4 justify-center md:justify-start pt-2">
                        <div className="bg-slate-100 px-5 py-2.5 rounded-xl border border-slate-200 text-[11px] font-black text-slate-800 uppercase tracking-wider shadow-sm">Adults: {b.adults}</div>
                        <div className="bg-slate-100 px-5 py-2.5 rounded-xl border border-slate-200 text-[11px] font-black text-slate-800 uppercase tracking-wider shadow-sm">Kids: {b.kids}</div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-end gap-2">
                        <i className="fas fa-check-double"></i> Fully Paid
                    </p>
                    <h3 className="text-5xl md:text-6xl font-black text-[#1B2559] tracking-tighter">₹{b.totalAmount}</h3>
                  </div>
                </div>

                {/* Decorative Dotted Line */}
                <div className="absolute left-[4rem] lg:left-[16rem] top-0 bottom-0 w-[2px] border-l-2 border-dashed border-slate-200 hidden sm:block"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-[#1B2559] p-10 rounded-[2.5rem] text-center text-white/50 font-black text-[11px] uppercase tracking-[0.5em] shadow-inner no-print border border-white/5">
         Spray Aqua Resort • Jagatpura • Jaipur
      </div>
    </div>
  );
};
export default TicketHistory;
