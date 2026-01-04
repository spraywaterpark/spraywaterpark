
import React from 'react';
import { Booking } from '../types';

const TicketHistory: React.FC<{ bookings: Booking[], mobile: string }> = ({ bookings, mobile }) => {
  const userList = bookings.filter(b => b.mobile === mobile);
  return (
    <div className="max-w-4xl mx-auto animate-fade space-y-10">
      <h2 className="text-4xl font-black uppercase tracking-tighter">My Tickets</h2>
      {userList.length === 0 ? <p className="text-center text-gray-300 font-bold uppercase">No tickets found.</p> : (
        <div className="grid grid-cols-1 gap-6">
          {userList.map(b => (
            <div key={b.id} className="bg-white rounded-[2.5rem] card-shadow p-8 flex justify-between items-center border border-white">
              <div>
                <h4 className="text-2xl font-black text-[#1B2559]">{b.date}</h4>
                <p className="text-blue-600 font-black text-xs uppercase">{b.time}</p>
                <div className="mt-4 text-[10px] font-black text-gray-400">ID: {b.id}</div>
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-black">₹{b.totalAmount}</h3>
                <span className="text-[10px] font-black text-green-500 uppercase">Confirmed</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default TicketHistory;
