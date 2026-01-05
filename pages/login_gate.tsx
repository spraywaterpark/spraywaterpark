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
          - Height fixed to 600px to ensure everything fits on laptop screens.
          - md:flex-row for side-by-side layout.
      */}
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px] border border-white">
        
        {/* IMAGE SIDEBAR (STRICT 30% WIDTH) */}
        <div className="relative w-full md:w-[30%] h-48 md:h-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200" 
            alt="Kids having fun in colorful pool" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Colorful Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/60 to-transparent flex flex-col justify-end p-6">
            <span className="logo-font text-2xl text-white drop-shadow-lg">Spray Fun!</span>
            <p className="text-[9px] font-black text-white/90 uppercase tracking-widest mt-1">Splash & Smile</p>
          </div>
        </div>

        {/* FORM CONTENT (STRICT 70% WIDTH) */}
        <div className="w-full md:w-[70%] p-8 md:p-16 bg-white flex flex-col justify-center relative">
          
          {/* Top Branding Section */}
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-cyan-50 px-4 py-2 rounded-2xl mb-4 border border-cyan-100">
               <i className="fas fa-droplet text-cyan-500 text-xs"></i>
               <span className="text-[10px] font-black text-cyan-700 uppercase tracking-widest">Jaipur's Most Colorful Park</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-[#1B2559] uppercase tracking-tighter leading-none mb-4">
              {view === 'landing' ? <>Splash <span className="text-blue-500">Zone</span></> : 'Staff Only'}
            </h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em]">
              {view === 'landing' ? 'Experience the most exciting water adventure with your family.' : 'Administrative dashboard login.'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6 max-w-md w-full mx-auto md:mx-0">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Full Name</label>
                <div className="relative">
                   <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                   <input 
                    type="text" 
                    placeholder="e.g. Rahul Sharma" 
                    className="input-luxury !pl-12 !py-4 border-2 border-slate-100 focus:!border-blue-400" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Mobile Number</label>
                <div className="relative">
                   <i className="fas fa-phone-alt absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                   <input 
                    type="tel" 
                    placeholder="+91 Mobile" 
                    className="input-luxury !pl-12 !py-4 border-2 border-slate-100 focus:!border-blue-400" 
                    value={data.mobile} 
                    onChange={e => setData({...data, mobile: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button className="w-full btn-premium py-6 flex items-center justify-center gap-4 group">
                  <span className="font-black">Unlock The Fun</span>
                  <i className="fas fa-chevron-right text-[10px] group-hover:translate-x-2 transition-transform"></i>
                </button>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[10px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-widest transition-all">
                  Staff Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6 max-w-md w-full mx-auto md:mx-0">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="admin@sprayaqua.com" 
                  className="input-luxury !py-4 border-2 border-slate-100" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Secure Pin</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-luxury !py-4 border-2 border-slate-100" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-6">Authorize Entry</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-8">
                <i className="fas fa-arrow-left mr-2"></i> Guest Portal
              </button>
            </form>
          )}

          {/* Background Decorative Icon */}
          <i className="fas fa-umbrella-beach absolute -right-4 bottom-10 text-slate-50 text-[10rem] pointer-events-none -z-10 opacity-50"></i>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
