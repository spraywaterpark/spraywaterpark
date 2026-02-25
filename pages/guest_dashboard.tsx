
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../types';

interface GuestDashboardProps {
  user: { name?: string; mobile?: string } | null;
  bookings: Booking[];
}

const GuestDashboard: React.FC<GuestDashboardProps> = ({ user, bookings }) => {
  const navigate = useNavigate();
  const name = user?.name || 'Guest';
  const mobile = user?.mobile || '';

  // Check if there's any booking matching BOTH name and mobile
  const hasExistingBookings = bookings.some(
    b => b.mobile === mobile && b.name.toLowerCase().trim() === name.toLowerCase().trim()
  );

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 animate-slide-up space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter">
          Welcome, <span className="text-blue-400">{name}</span>
        </h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.4em]">
          What would you like to do today?
        </p>
      </div>

      <div className={`grid grid-cols-1 ${hasExistingBookings ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-8`}>
        {/* Option 1: Book New Ticket */}
        <button
          onClick={() => navigate('/book')}
          className="group relative bg-white rounded-[3rem] p-10 text-left border border-slate-200 shadow-2xl hover:scale-[1.02] transition-all overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors"></div>
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-200">
              <i className="fas fa-plus"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Book New Ticket</h3>
              <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
                Reserve fresh entries for your family and friends at Spray Aqua Resort.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
              Start Booking <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
            </div>
          </div>
        </button>

        {/* Option 2: Upgrade Ticket - Only show if match found */}
        {hasExistingBookings && (
          <button
            onClick={() => navigate('/my-bookings')}
            className="group relative bg-slate-900 rounded-[3rem] p-10 text-left border border-white/10 shadow-2xl hover:scale-[1.02] transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-900/20">
                <i className="fas fa-arrow-up"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Upgrade My Ticket</h3>
                <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">
                  Convert your child tickets to adult tickets or view your existing bookings.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                Manage Tickets <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
              </div>
            </div>
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <div className="bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Logged in as Guest</span>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
