import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onGuestLogin: (n: string, m: string) => void;
  onAdminLogin: (e: string) => void;
}

const LoginGate: React.FC<LoginPageProps> = ({ onGuestLogin, onAdminLogin }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'landing' | 'admin'>('landing');
  const [data, setData] = useState({ name: '', mobile: '', email: '', password: '' });

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.name.trim() && data.mobile.trim()) {
      onGuestLogin(data.name.trim(), data.mobile.trim());
      navigate('/book');
    }
  };

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.email.trim() === 'admin@spraywaterpark.com' && data.password.trim() === 'admin123') {
      onAdminLogin(data.email.trim());
      navigate('/admin');
    } else {
      alert("Unauthorized Access. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8 animate-fade">
      {/* Container: reduced max-width and added max-height for balanced laptop view */}
      <div className="w-full max-w-5xl lg:max-h-[700px] grid grid-cols-1 md:grid-cols-12 overflow-hidden card-luxury bg-white shadow-2xl border-slate-200">
        
        {/* Left Section: Hero Branding - Adjusted to md:col-span-6 for 50/50 split on desktop */}
        <div className="relative h-64 md:h-auto md:col-span-6 overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1600" 
            alt="Spray Aqua Resort" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1B2559] via-[#1B2559]/40 to-transparent p-10 md:p-14 lg:p-16 flex flex-col justify-end md:justify-center text-white">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-6">
                <i className="fas fa-map-marker-alt text-blue-400 text-xs"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Jaipur's Finest Park</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
                Spray Aqua <br /> <span className="text-blue-400">Resort</span>
              </h2>
              <p className="hidden md:block text-slate-200 max-w-md font-medium text-sm lg:text-base leading-relaxed opacity-90">
                Rajasthan's premier family destination. High-speed slides, buffet dining, and luxury resort facilities.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Form - Adjusted to md:col-span-6 for 50/50 split on desktop */}
        <div className="md:col-span-6 p-10 md:p-12 lg:p-16 flex flex-col justify-center bg-white border-l border-slate-100">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">
              {view === 'landing' ? 'Book Tickets' : 'Staff Login'}
            </h3>
            <div className="h-1.5 w-12 bg-blue-600 mt-3 rounded-full mx-auto md:mx-0"></div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mt-4">
              Official Reservation Portal
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Guest Name</label>
                <input 
                  type="text" 
                  placeholder="Rahul Sharma" 
                  className="input-luxury !border-slate-300" 
                  value={data.name} 
                  onChange={e => setData({...data, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Contact Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 XXXXX XXXXX" 
                  className="input-luxury !border-slate-300" 
                  value={data.mobile} 
                  onChange={e => setData({...data, mobile: e.target.value})} 
                  required 
                />
              </div>
              
              <button className="w-full btn-premium py-5 mt-4 text-xs font-black shadow-2xl shadow-blue-900/10 group">
                Proceed to Booking
                <i className="fas fa-chevron-right ml-2 text-[10px] group-hover:translate-x-1 transition-transform"></i>
              </button>
              
              <div className="pt-8 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.3em] transition-colors">
                  Staff Entrance
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Staff Email</label>
                <input 
                  type="email" 
                  placeholder="admin@spraywaterpark.com" 
                  className="input-luxury !border-slate-300" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Access PIN</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-luxury !border-slate-300" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-5 mt-2">Verify & Enter</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-6">
                Back to Guest Entry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
