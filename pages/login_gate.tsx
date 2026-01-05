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
      alert("Unauthorized Access. Check your credentials.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      {/* 
          STABLE CONTAINER:
          - Image: md:w-[30%] (Exactly 30% width)
          - Form: md:w-[70%] (Exactly 70% width)
          - Height fixed at 620px for perfect laptop viewing.
      */}
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_60px_120px_-20px_rgba(2,132,199,0.3)] overflow-hidden flex flex-col md:flex-row h-auto md:h-[620px] border border-white">
        
        {/* LEFT SIDE: HD UNDERWATER MASTI IMAGE (STRICT 30% WIDTH) */}
        <div className="relative w-full md:w-[30%] h-56 md:h-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1473040210444-2f2750796277?auto=format&fit=crop&q=80&w=1200" 
            alt="Underwater Fun Masti" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[6s] hover:scale-110"
          />
          {/* Fun Splashy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/70 via-transparent to-transparent flex flex-col justify-end p-8">
            <h1 className="logo-font text-4xl text-white drop-shadow-2xl animate-pulse">Splash!</h1>
            <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                <p className="text-[9px] font-black text-white/90 uppercase tracking-[0.4em]">Unlimited Masti</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: BOOKING FORM (70% WIDTH) */}
        <div className="w-full md:w-[70%] p-8 md:p-16 bg-white flex flex-col justify-center relative">
          
          {/* Header Branding */}
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-3 bg-cyan-50 px-5 py-2.5 rounded-2xl mb-6 border border-cyan-100">
               <i className="fas fa-swimmer text-cyan-500 text-xs"></i>
               <span className="text-[10px] font-black text-cyan-900 uppercase tracking-widest">Jaipur's Most Colorful Park</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-[#1B2559] uppercase tracking-tighter leading-none mb-4">
              {view === 'landing' ? <>Spray <span className="text-blue-500 underline decoration-blue-200 underline-offset-8">Aqua</span></> : 'Admin Area'}
            </h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] ml-1">
              {view === 'landing' ? 'Experience the thrill with your family.' : 'Log in to manage park bookings and settings.'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6 max-w-md w-full mx-auto md:mx-0">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Your Full Name</label>
                <div className="relative">
                   <i className="fas fa-user-circle absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                   <input 
                    type="text" 
                    placeholder="e.g. Rahul Sharma" 
                    className="input-luxury !pl-14 !py-4 border-2 border-slate-50 focus:!border-blue-400 focus:!bg-white !rounded-2xl" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Mobile Number</label>
                <div className="relative">
                   <i className="fas fa-phone-alt absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                   <input 
                    type="tel" 
                    placeholder="+91 00000 00000" 
                    className="input-luxury !pl-14 !py-4 border-2 border-slate-50 focus:!border-blue-400 focus:!bg-white !rounded-2xl" 
                    value={data.mobile} 
                    onChange={e => setData({...data, mobile: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              
              <div className="pt-6">
                <button className="w-full btn-premium py-6 flex items-center justify-center gap-4 group rounded-2xl">
                  <span className="font-black tracking-widest">Start Booking</span>
                  <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-2 transition-transform"></i>
                </button>
              </div>

              <div className="pt-10 border-t border-slate-50 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[10px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.4em] transition-all">
                  Staff Login Terminal
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6 max-w-md w-full mx-auto md:mx-0">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Admin Email</label>
                <input 
                  type="email" 
                  placeholder="admin@sprayaqua.com" 
                  className="input-luxury !py-4 border-2 border-slate-50 !rounded-2xl" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Secure Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-luxury !py-4 border-2 border-slate-50 !rounded-2xl" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-6 rounded-2xl">Authorize & Enter</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-10">
                <i className="fas fa-chevron-left mr-2"></i> Back to Guest Portal
              </button>
            </form>
          )}

          {/* Decorative Wave Icon */}
          <i className="fas fa-water absolute -right-6 bottom-10 text-slate-50 text-[12rem] pointer-events-none -z-10 opacity-70"></i>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
