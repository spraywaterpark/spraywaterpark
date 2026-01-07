import React from 'react';
import { Booking } from '../types';

const TicketHistory: React.FC<{ bookings: Booking[], mobile: string }> = ({ bookings, mobile }) => {
  const userList = bookings.filter(b => b.mobile === mobile);
  const lastAiMessage = sessionStorage.getItem('last_ai_message') || "Welcome to your splash escape!";

  const sendWhatsApp = (msg: string, phone: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-smart flex flex-col items-center w-full space-y-16">
      
      <div className="flex flex-col items-center gap-10 text-center no-print w-full">
        <div className="flex flex-col items-center">
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Wallet</h2>
          <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-[0.5em] mt-6">Your Premium Digital Entry Passes</p>
        </div>
        <button onClick={() => window.print()} className="bg-white px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-3">
            <i className="fas fa-print"></i> Download pass portfolio
        </button>
      </div>

      {userList.length === 0 ? (
        <div className="w-full bg-white p-24 rounded-[4rem] text-center border border-slate-100 flex flex-col items-center shadow-sm">
           <i className="fas fa-ticket-alt text-7xl text-slate-100 mb-10"></i>
           <p className="text-slate-300 font-black uppercase text-xs tracking-[0.6em]">No reservations found in vault</p>
           <button onClick={() => window.location.hash = '#/book'} className="mt-12 btn-modern !w-auto px-16 h-16 text-[11px]">Make a Reservation</button>
        </div>
      ) : (
        <div className="w-full space-y-16">
          {userList.map((b, idx) => (
            <div key={b.id} className="group flex flex-col items-center w-full">
              
              <div className="w-full bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 relative transition-all group-hover:border-slate-200 print:shadow-none">
                {/* ID STRIP */}
                <div className="bg-slate-900 lg:w-72 p-12 flex flex-col justify-center items-center text-white text-center shrink-0">
                    <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.5em] mb-4">Identity Code</p>
                    <p className="text-2xl font-black tracking-tighter mb-10 bg-white/10 px-6 py-2.5 rounded-xl border border-white/10 uppercase">{b.id}</p>
                    <div className="bg-white p-5 rounded-[2rem] shadow-2xl transition-transform group-hover:scale-110">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.id}`} alt="QR" className="w-24 h-24 md:w-32 md:h-32 mix-blend-multiply" />
                    </div>
                </div>
                
                {/* DETAILS AREA */}
                <div className="flex-1 p-10 md:p-16 flex flex-col md:flex-row justify-between items-center gap-12">
                  <div className="space-y-8 text-center md:text-left">
                    <div>
                        <h4 className="text-4xl md:text-6xl font-black text-slate-900 uppercase leading-none tracking-tighter">{b.date}</h4>
                        <div className="mt-6 flex items-center gap-4">
                           <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                           <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em]">{b.time}</p>
                        </div>
                    </div>
                    <div className="flex gap-4 justify-center md:justify-start">
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">Adults: {b.adults}</div>
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">Kids: {b.kids}</div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right space-y-5">
                    <div className="bg-emerald-50 px-5 py-2 rounded-full inline-flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-500 text-[10px]"></i>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Confirmed Payment</span>
                    </div>
                    <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">₹{b.totalAmount}</h3>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">Authorized Entry Pass</p>
                  </div>
                </div>

                <div className="absolute left-[30px] md:left-[300px] top-0 bottom-0 w-[2px] border-l-4 border-dotted border-slate-100 hidden lg:block opacity-30"></div>
              </div>

              {idx === 0 && (
                <button 
                  onClick={() => sendWhatsApp(lastAiMessage, b.mobile)}
                  className="mt-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors no-print bg-emerald-50 px-10 py-4 rounded-full border border-emerald-100 shadow-sm"
                >
                    <i className="fab fa-whatsapp text-lg"></i>
                    Sync pass to WhatsApp
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="pt-24 text-slate-300 font-black text-[10px] uppercase tracking-[0.6em] text-center no-print">
         Spray Aqua Resort • Jaipur HQ Digital Vault
      </div>
    </div>
  );
};
export default TicketHistory;
