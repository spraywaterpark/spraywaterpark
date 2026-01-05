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
    <div className="min-h-screen md:min-h-[90vh] flex items-center justify-center p-4 md:p-6 lg:p-10 animate-fade">
      {/* 
          Main Card:
          - Responsive width (max-w-6xl).
          - Fixed-ish height on desktop (max-h 700px or 85% of screen) to prevent "giant image" syndrome.
          - Mobile is auto-height.
      */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row md:max-h-[min(700px,85vh)]">
        
        {/* Left Section: Visual Hero */}
        <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1200" 
            alt="Spray Aqua Resort" 
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105"
          />
          {/* Branding Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1B2559]/90 via-[#1B2559]/30 to-transparent p-6 md:p-12 flex flex-col justify-end text-white">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 mb-4">
                <i className="fas fa-water text-blue-400 text-xs"></i>
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Jaipur's Best Water Park</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">
                Spray Aqua <br /> <span className="text-blue-400">Resort</span>
              </h2>
              <p className="hidden md:block text-slate-200 text-sm font-medium opacity-80 max-w-xs">
                Premium slides, luxury dining, and family fun await you at Rajasthan's favorite destination.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Form Content */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 bg-white flex flex-col justify-center overflow-y-auto">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-[#1B2559] uppercase tracking-tighter">
              {view === 'landing' ? 'Ticket Booking' : 'Staff Login'}
            </h3>
            <div className="h-1.5 w-10 bg-blue-600 mt-2 rounded-full mx-auto md:mx-0"></div>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-4">
              {view === 'landing' ? 'Secure your splash day' : 'Internal Management Portal'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Guest Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rahul Sharma" 
                  className="input-luxury !py-3.5 !px-5 !border-slate-200 text-sm" 
                  value={data.name} 
                  onChange={e => setData({...data, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                <input 
                  type="tel" 
                  placeholder="10-digit mobile" 
                  className="input-luxury !py-3.5 !px-5 !border-slate-200 text-sm" 
                  value={data.mobile} 
                  onChange={e => setData({...data, mobile: e.target.value})} 
                  required 
                />
              </div>
              
              <button className="w-full btn-premium py-4 mt-2 text-xs font-black shadow-lg hover:shadow-blue-200/50 group active:scale-95 transition-all">
                Check Rates & Book
                <i className="fas fa-chevron-right ml-2 text-[9px] group-hover:translate-x-1 transition-transform"></i>
              </button>
              
              <div className="pt-6 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.3em] transition-colors">
                  Staff Entrance Only
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input 
                  type="email" 
                  placeholder="admin@spraywaterpark.com" 
                  className="input-luxury !py-3.5 !px-5 !border-slate-200 text-sm" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure PIN</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-luxury !py-3.5 !px-5 !border-slate-200 text-sm" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-4 mt-2 active:scale-95">Verify Login</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-6">
                Back to Booking
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
