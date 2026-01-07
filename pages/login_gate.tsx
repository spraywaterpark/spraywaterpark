import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN_HERO_IMAGE = "https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1200";

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
      alert("Invalid Credentials. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full px-4 py-10 animate-fade">
      <div className="glass-card w-full max-w-6xl shadow-2xl border-4 border-white overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT: VISUAL SIDE (Strict 30% Width on Desktop) */}
        <div className="w-full md:w-[30%] h-48 md:h-auto relative bg-slate-900 overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-slate-100">
          <img 
            src={LOGIN_HERO_IMAGE} 
            alt="Aqua Resort" 
            className="w-full h-full object-cover opacity-80 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-8 items-center text-center">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                  Splash <br /> Into Fun
              </h1>
              <p className="text-white/50 text-[9px] font-bold uppercase tracking-[0.4em] mt-2">Spray Aqua Resort</p>
          </div>
        </div>

        {/* RIGHT: FORM SIDE (Strict 70% Width on Desktop, All Centered) */}
        <div className="w-full md:w-[70%] p-10 md:p-24 flex flex-col items-center justify-center bg-white grow text-center">
          <div className="mb-14 flex flex-col items-center">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6">
                <i className="fas fa-water text-xl"></i>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 w-full">
              {view === 'landing' ? 'Guest Entry' : 'Staff Access'}
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] w-full max-w-md">
              {view === 'landing' ? 'Experience Premium Water Park Fun' : 'Secure Management Login'}
            </p>
          </div>

          <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="w-full max-w-sm space-y-8 flex flex-col items-center">
            {view === 'landing' ? (
              <>
                <div className="w-full space-y-2 flex flex-col items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-full">Guest Name</label>
                  <input type="text" placeholder="Enter Full Name" className="input-premium" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
                </div>
                <div className="w-full space-y-2 flex flex-col items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-full">Mobile Number</label>
                  <input type="tel" placeholder="10-digit number" className="input-premium" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} required />
                </div>
              </>
            ) : (
              <>
                <div className="w-full space-y-2 flex flex-col items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-full">Admin Email</label>
                  <input type="email" placeholder="admin@spraypark.com" className="input-premium" value={data.email} onChange={e => setData({...data, email: e.target.value})} required />
                </div>
                <div className="w-full space-y-2 flex flex-col items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-full">Staff Key</label>
                  <input type="password" placeholder="••••••••" className="input-premium" value={data.password} onChange={e => setData({...data, password: e.target.value})} required />
                </div>
              </>
            )}

            <button type="submit" className="w-full btn-resort h-22 shadow-2xl mt-4 text-lg font-black uppercase tracking-[0.2em]">
              {view === 'landing' ? 'Get Entry Passes' : 'Access Portal'}
            </button>

            <div className="pt-10 w-full flex justify-center">
              <button 
                type="button" 
                onClick={() => setView(view === 'landing' ? 'admin' : 'landing')} 
                className="text-[10px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.4em] transition-all"
              >
                {view === 'landing' ? 'Switch to Admin' : 'Back to Guest Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
