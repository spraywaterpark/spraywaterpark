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
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 animate-fade space-y-12 md:space-y-16 flex flex-col items-center w-full">
      <div className="flex flex-col items-center gap-6 md:gap-8 text-center no-print">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-[#1B2559] uppercase tracking-tighter leading-none">Your Passes</h2>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.6em] mt-4 md:mt-5">Digital Wallet • Spray Aqua Resort</p>
        </div>
        <button onClick={() => window.print()} className="bg-white px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#1B2559] shadow-xl border border-slate-100 hover:bg-slate-50 transition-all">
            <i className="fas fa-print mr-3"></i> Download Passes
        </button>
      </div>

      {userList.length === 0 ? (
        <div className="w-full bg-white p-16 md:p-24 rounded-[3rem] md:rounded-[5rem] text-center border-4 border-dashed border-slate-100 flex flex-col items-center shadow-inner">
           <i className="fas fa-ticket-alt text-6xl md:text-8xl text-slate-100 mb-8 md:mb-12"></i>
           <p className="text-slate-400 font-black uppercase text-xs md:text-sm tracking-[0.4em]">No active reservations</p>
           <button onClick={() => window.location.hash = '#/book'} className="mt-8 md:mt-12 bg-[#1B2559] text-white px-10 md:px-14 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.3em] shadow-3xl hover:scale-105 transition-all">Book Tickets <i className="fas fa-arrow-right ml-3"></i></button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 gap-10 md:gap-14">
          {userList.map((b, idx) => (
            <div key={b.id} className="group flex flex-col items-center w-full">
              {/* WhatsApp Banner (Centered) */}
              {idx === 0 && (
                  <div className="w-full max-w-4xl bg-emerald-50 p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border-2 border-emerald-200 mb-10 md:mb-14 flex flex-col items-center text-center gap-6 md:gap-8 no-print shadow-xl shadow-emerald-100 animate-fade">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-600 text-white rounded-[1.5rem] md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-xl">
                          <i className="fab fa-whatsapp"></i>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                          <p className="text-emerald-900 font-black text-lg md:text-xl uppercase tracking-widest leading-none">Sync Verified!</p>
                          <p className="text-emerald-700 text-[9px] md:text-[11px] font-bold uppercase tracking-widest opacity-80">Send ticket to WhatsApp for easy entry</p>
                      </div>
                      <button 
                        onClick={() => sendWhatsApp(lastAiMessage, b.mobile)}
                        className="btn-resort !bg-emerald-600 hover:!bg-emerald-700 px-10 md:px-16 py-4 md:py-5 rounded-xl md:rounded-2xl text-[11px] md:text-sm shadow-2xl"
                      >
                          Get on WhatsApp
                      </button>
                  </div>
              )}

              {/* Digital Pass (Centered Card Layout) */}
              <div className="w-full max-w-4xl bg-white rounded-[2.5rem] md:rounded-[5rem] shadow-3xl overflow-hidden flex flex-col lg:flex-row border border-white relative transition-all group-hover:border-blue-100">
                <div className="blue-gradient lg:w-80 p-10 md:p-14 flex flex-col justify-center items-center text-white text-center shrink-0">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.4em] mb-4">Entry Code</p>
                    <p className="text-2xl md:text-4xl font-black tracking-tighter mb-8 md:mb-10 bg-white/10 px-6 py-2 rounded-xl md:rounded-2xl border border-white/20">{b.id}</p>
                    <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] shadow-3xl transform transition-transform group-hover:scale-110">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.id}`} alt="QR" className="w-24 h-24 md:w-32 md:h-32 mix-blend-multiply" />
                    </div>
                </div>
                
                <div className="flex-1 p-8 md:p-16 flex flex-col md:flex-row justify-between items-center gap-10 md:gap-14 text-center md:text-left">
                  <div className="space-y-6 md:space-y-8 flex flex-col items-center md:items-start">
                    <div className="text-center md:text-left">
                        <h4 className="text-3xl md:text-5xl font-black text-[#1B2559] uppercase leading-none tracking-tighter">{b.date}</h4>
                        <p className="text-blue-600 font-black text-[9px] md:text-[11px] uppercase tracking-[0.5em] md:tracking-[0.6em] mt-4 md:mt-5 bg-blue-50 px-4 md:px-5 py-2 rounded-xl inline-block border border-blue-100">{b.time}</p>
                    </div>
                    <div className="flex gap-3 md:gap-4 justify-center md:justify-start">
                        <div className="bg-slate-50 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-slate-100 text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">A: {b.adults}</div>
                        <div className="bg-slate-50 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-slate-100 text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">K: {b.kids}</div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right space-y-3 md:space-y-4">
                    <p className="text-[10px] md:text-[12px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center justify-center md:justify-end gap-2 md:gap-3">
                        <i className="fas fa-check-circle"></i> Paid
                    </p>
                    <h3 className="text-5xl md:text-7xl font-black text-[#1B2559] tracking-tighter">₹{b.totalAmount}</h3>
                    <p className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] text-center md:text-right">Spray Resorts Jaipur</p>
                  </div>
                </div>

                <div className="absolute left-[30px] md:left-[320px] top-0 bottom-0 w-[2px] border-l-2 md:border-l-4 border-dashed border-slate-100 hidden sm:block opacity-30"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="pt-10 md:pt-20 text-gray-300 font-black text-[8px] md:text-[10px] uppercase tracking-[0.6em] md:tracking-[0.8em] text-center no-print">
         Spray Aqua Resort • Jagatpura • Jaipur
      </div>
    </div>
  );
};
export default TicketHistory;
