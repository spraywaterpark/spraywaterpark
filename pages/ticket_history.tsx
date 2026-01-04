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
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 no-print">
        <div>
          <h2 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter">My Tickets</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Spray Aqua Digital Passes</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-blue-600 shadow-sm border border-blue-50">
                <i className="fas fa-print mr-2"></i> Print Paper Copy
            </button>
        </div>
      </div>

      {userList.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border-4 border-dashed border-gray-100 flex flex-col items-center">
           <i className="fas fa-ticket-alt text-7xl text-gray-100 mb-6"></i>
           <p className="text-gray-300 font-black uppercase text-xs tracking-widest">No Active Bookings</p>
           <button onClick={() => window.location.hash = '#/book'} className="mt-6 text-blue-600 font-black text-xs uppercase tracking-widest underline">Book Your First Splash <i className="fas fa-arrow-right ml-2"></i></button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {userList.map((b, idx) => (
            <div key={b.id} className="group">
              {/* WhatsApp Action Card for the most recent booking */}
              {idx === 0 && (
                  <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 no-print">
                      <div className="flex items-center gap-4 text-center sm:text-left">
                          <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl">
                              <i className="fab fa-whatsapp"></i>
                          </div>
                          <div>
                              <p className="text-green-800 font-black text-[10px] uppercase tracking-widest">Instant Confirmation</p>
                              <p className="text-green-600 text-sm font-bold">Send your ticket details to WhatsApp</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => sendWhatsApp(lastAiMessage, b.mobile)}
                        className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                      >
                          Send Message Now
                      </button>
                  </div>
              )}

              {/* Digital Ticket Card */}
              <div className="bg-white rounded-[2.5rem] card-shadow overflow-hidden flex flex-col lg:flex-row border border-white relative">
                <div className="blue-gradient lg:w-56 p-10 flex flex-col justify-center items-center text-white text-center">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-2">Entry Pass</p>
                    <p className="text-2xl font-black tracking-tighter mb-6">{b.id}</p>
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${b.id}`} alt="QR" className="w-24 h-24 mix-blend-multiply" />
                    </div>
                </div>
                
                <div className="flex-1 p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="text-center md:text-left space-y-4">
                    <div>
                        <h4 className="text-3xl font-black text-[#1B2559] uppercase leading-none">{b.date}</h4>
                        <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mt-2">{b.time}</p>
                    </div>
                    <div className="flex gap-3 justify-center md:justify-start">
                        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-[10px] font-black text-blue-600 uppercase">Adults: {b.adults}</div>
                        <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 text-[10px] font-black text-orange-600 uppercase">Kids: {b.kids}</div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1 flex items-center justify-center md:justify-end gap-2">
                        <i className="fas fa-check-circle"></i> Paid Confirmed
                    </p>
                    <h3 className="text-5xl font-black text-[#1B2559] tracking-tighter">₹{b.totalAmount}</h3>
                  </div>
                </div>

                {/* Decorative Dotted Line for Ticket Look */}
                <div className="absolute left-[3.5rem] lg:left-[14rem] top-0 bottom-0 w-[1px] border-l-2 border-dashed border-gray-100 hidden sm:block"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-[#1B2559] p-8 rounded-[2rem] text-center text-white/40 font-bold text-[10px] uppercase tracking-widest no-print">
         Spray Aqua Resort • Pathankot-Jalandhar Highway • Punjab
      </div>
    </div>
  );
};
export default TicketHistory;
