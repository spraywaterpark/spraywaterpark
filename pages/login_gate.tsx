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
    <div className="min-h-[85vh] flex items-center justify-center p-4 md:p-8 lg:p-12 animate-fade">
      {/* 
          Main Card Container: 
          - min-h-[600px] on md+ screens ensures a substantial look without rigid height issues.
          - max-w-5xl prevents the image from becoming too stretched on ultra-wide monitors.
      */}
      <div className="w-full max-w-5xl md:min-h-[600px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Left Section: Visual Branding (The Image) */}
        <div className="relative h-80 md:h-auto overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1200" 
            alt="Spray Aqua Resort" 
            className="absolute inset-0 w-full h-full object-cover object-[center_25%] transition-transform duration-1000 group-hover:scale-110"
          />
          {/* Visual Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1B2559]/95 via-[#1B2559]/40 to-transparent p-8 md:p-12 lg:p-16 flex flex-col justify-end">
            <div className="relative z-10 max-w-sm">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 mb-6 shadow-xl">
                <i className="fas fa-water text-blue-400"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Jaipur's Finest Resort</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-4 text-white">
                Spray Aqua <br /> <span className="text-blue-400">Resort</span>
              </h2>
              <p className="hidden md:block text-slate-200 text-sm font-medium leading-relaxed opacity-80">
                Dive into excitement at Rajasthan's premier luxury water park destination.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Forms */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white border-l border-slate-100">
          <div className="mb-8 text-center md:text-left">
            <div className="inline-block md:block">
               <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">
                {view === 'landing' ? 'Book Tickets' : 'Staff Login'}
               </h3>
               <div className="h-1.5 w-12 bg-blue-600 mt-3 rounded-full mx-auto md:mx-0"></div>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-5">
              Official Reservation System
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">Full Guest Name</label>
                <input 
                  type="text" 
                  placeholder="Rahul Sharma" 
                  className="input-luxury !border-slate-300 !py-4" 
                  value={data.name} 
                  onChange={e => setData({...data, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">Mobile Number</label>
                <input 
                  type="tel" 
                  placeholder="10-digit phone number" 
                  className="input-luxury !border-slate-300 !py-4" 
                  value={data.mobile} 
                  onChange={e => setData({...data, mobile: e.target.value})} 
                  required 
                />
              </div>
              
              <button className="w-full btn-premium py-5 mt-4 text-xs font-black shadow-2xl shadow-blue-900/10 group active:scale-95">
                Proceed to Booking
                <i className="fas fa-chevron-right ml-2 text-[10px] group-hover:translate-x-1 transition-transform"></i>
              </button>
              
              <div className="pt-8 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.3em] transition-colors">
                  Administrator Entrance
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">Staff Email</label>
                <input 
                  type="email" 
                  placeholder="admin@spraywaterpark.com" 
                  className="input-luxury !border-slate-300 !py-4" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">Secure PIN</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-luxury !border-slate-300 !py-4" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-5 mt-2 active:scale-95">Verify & Login</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-6">
                Return to Guest Portal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
