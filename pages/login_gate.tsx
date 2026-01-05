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
    <div className="min-h-[85vh] flex items-center justify-center p-4 md:p-8 animate-fade">
      {/* 
          Container Fix: 
          - On Laptop: Fixed height (650px) for symmetry.
          - On Mobile: Auto height with vertical stack.
      */}
      <div className="w-full max-w-5xl md:h-[650px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Left Section: Visual Branding */}
        <div className="relative h-72 md:h-full overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1200" 
            alt="Spray Aqua Resort" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          {/* Enhanced Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1B2559]/90 via-[#1B2559]/40 to-transparent p-10 md:p-16 flex flex-col justify-end text-white">
            <div className="relative z-10 max-w-sm">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-6">
                <i className="fas fa-water text-blue-400"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Jaipur's Finest Destination</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-4">
                Spray Aqua <br /> <span className="text-blue-400">Resort</span>
              </h2>
              <p className="hidden md:block text-slate-200 text-sm font-medium leading-relaxed opacity-80">
                Experience the thrill of Rajasthan's premium water park with luxury dining and family slides.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive Forms */}
        <div className="p-8 md:p-14 lg:p-20 flex flex-col justify-center bg-white border-l border-slate-100">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-block md:block">
               <h3 className="text-3xl font-black text-[#1B2559] uppercase tracking-tighter">
                {view === 'landing' ? 'Book Tickets' : 'Staff Portal'}
               </h3>
               <div className="h-1.5 w-12 bg-blue-600 mt-3 rounded-full mx-auto md:mx-0"></div>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-5">
              Secure Reservation System
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">Guest Full Name</label>
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
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">WhatsApp Number</label>
                <input 
                  type="tel" 
                  placeholder="10-digit mobile" 
                  className="input-luxury !border-slate-300 !py-4" 
                  value={data.mobile} 
                  onChange={e => setData({...data, mobile: e.target.value})} 
                  required 
                />
              </div>
              
              <button className="w-full btn-premium py-5 mt-4 text-xs font-black shadow-2xl shadow-blue-900/10 group">
                Begin Reservation
                <i className="fas fa-chevron-right ml-2 text-[10px] group-hover:translate-x-1 transition-transform"></i>
              </button>
              
              <div className="pt-8 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.3em] transition-colors">
                  Employee Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">Official Email</label>
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
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 opacity-60">Secure Access PIN</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-luxury !border-slate-300 !py-4" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-5 mt-2">Authorize Entry</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-6">
                Back to Guest Portal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
