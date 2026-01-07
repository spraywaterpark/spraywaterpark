import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HERO_URL = "https://images.unsplash.com/photo-1560090334-9721df22066d?auto=format&fit=crop&q=80&w=1200";

interface LoginPageProps {
  onGuestLogin: (n: string, m: string) => void;
  onAdminLogin: (e: string) => void;
}

const LoginGate: React.FC<LoginPageProps> = ({ onGuestLogin, onAdminLogin }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'guest' | 'admin'>('guest');
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
      alert("Unauthorized Credentials");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background with subtle animation and optimized size */}
      <div className="absolute inset-0 z-0 scale-105 animate-[gentleScale_40s_infinite_alternate]">
        <img 
          src={HERO_URL} 
          alt="Spray Aqua Resort Experience" 
          className="w-full h-full object-cover brightness-[0.75] contrast-[1.1]" 
        />
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[0.5px]"></div>
      </div>

      {/* Login Terminal Card */}
      <div className="relative z-10 w-full max-w-md mx-6 animate-smart">
        <div className="glass-card rounded-[2.5rem] p-10 md:p-14 border border-white/30 flex flex-col items-center">
          
          <div className="mb-10 text-center flex flex-col items-center">
             <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl">
                <i className="fas fa-bars-staggered text-xl"></i>
             </div>
             <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-tight">
               {view === 'guest' ? 'Ticket Terminal' : 'Staff Access'}
             </h2>
             <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.5em]">
               Spray Aqua Resort Jaipur
             </p>
          </div>

          <form onSubmit={view === 'guest' ? handleGuest : handleAdmin} className="w-full space-y-7 flex flex-col items-center">
            {view === 'guest' ? (
              <>
                <div className="w-full space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Guest Name</label>
                  <input 
                    type="text" 
                    placeholder="Rahul Sharma" 
                    className="input-premium bg-white/50 border-white/20 focus:bg-white" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="w-full space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Mobile Connection</label>
                  <input 
                    type="tel" 
                    placeholder="10-Digit Mobile" 
                    className="input-premium bg-white/50 border-white/20 focus:bg-white" 
                    value={data.mobile} 
                    onChange={e => setData({...data, mobile: e.target.value})} 
                    required 
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-full space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Authorized Email</label>
                  <input 
                    type="email" 
                    placeholder="admin@spraypark.com" 
                    className="input-premium bg-white/50 border-white/20 focus:bg-white" 
                    value={data.email} 
                    onChange={e => setData({...data, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="w-full space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Security Key</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input-premium bg-white/50 border-white/20 focus:bg-white" 
                    value={data.password} 
                    onChange={e => setData({...data, password: e.target.value})} 
                    required 
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn-modern mt-4 h-16 group w-full shadow-xl">
               {view === 'guest' ? 'Book Now' : 'Authorize Session'} 
               <i className="fas fa-arrow-right ml-3 text-xs transition-transform group-hover:translate-x-1"></i>
            </button>

            <div className="pt-10 w-full flex justify-center border-t border-slate-900/5 mt-10">
              <button 
                type="button" 
                onClick={() => setView(view === 'guest' ? 'admin' : 'guest')} 
                className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.4em] transition-all"
              >
                {view === 'guest' ? 'Management Login' : 'Guest Portal'}
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
