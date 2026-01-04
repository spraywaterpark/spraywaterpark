
import React from 'react';
import { Booking } from '../types';

const MyBookings: React.FC<{ bookings: Booking[], mobile: string }> = ({ bookings, mobile }) => {
  const userList = bookings.filter(b => b.mobile === mobile);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade space-y-10">
      <div className="flex justify-between items-end no-print">
        <div>
          <h2 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter">My Tickets</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Your past and upcoming visits</p>
        </div>
        <button onClick={handlePrint} className="bg-white px-6 py-3 rounded-xl shadow-sm text-xs font-black uppercase tracking-widest text-[#1B2559] border border-gray-100 hover:bg-gray-50">
          <i className="fas fa-print mr-2"></i> Print All
        </button>
      </div>

      {userList.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center card-shadow border border-white border-dashed no-print">
          <i className="fas fa-ticket-alt text-6xl text-gray-100 mb-6"></i>
          <p className="text-gray-300 font-black uppercase tracking-widest">No bookings found yet!</p>
          <button onClick={() => window.location.hash = '#/book'} className="mt-6 text-blue-600 font-black text-sm uppercase">Book your first visit <i className="fas fa-arrow-right ml-2"></i></button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {userList.map(b => (
            <div key={b.id} className="bg-white rounded-[2.5rem] card-shadow overflow-hidden flex flex-col md:flex-row border border-white print:border-gray-200 print:shadow-none print:m-4 break-inside-avoid">
              <div className="blue-gradient md:w-48 p-8 flex flex-col justify-center items-center text-white text-center print:bg-blue-600 print:text-white">
                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Pass Code</p>
                <p className="text-xl font-black tracking-tighter">{b.id}</p>
                <div className="mt-4 p-2 bg-white rounded-lg">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${b.id}`} className="w-20 h-20 mix-blend-multiply" alt="QR" />
                </div>
              </div>
              <div className="flex-1 p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left space-y-2">
                  <h4 className="text-2xl font-black text-[#1B2559]">{b.date}</h4>
                  <p className="text-blue-600 font-black text-xs uppercase tracking-widest">{b.time}</p>
                  <div className="flex gap-3 justify-center md:justify-start mt-4">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Adults: {b.adults}</span>
                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Kids: {b.kids}</span>
                  </div>
                </div>
                <div className="text-center md:text-right space-y-4">
                  <div className="space-y-1">
                    <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Payment Confirmed</span>
                    <h3 className="text-4xl font-black text-[#1B2559]">₹{b.totalAmount}</h3>
                  </div>
                  <button 
                    onClick={handlePrint}
                    className="text-blue-600 font-black text-[10px] uppercase tracking-widest no-print hover:underline flex items-center gap-2 justify-center md:justify-end w-full"
                  >
                    <i className="fas fa-file-pdf"></i> Download Ticket PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyBookings;
