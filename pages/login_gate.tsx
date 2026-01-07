import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HERO_URL = "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1600";

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-['Plus_Jakarta_Sans']">
      {/* Hero Section: Precisely 30% of the screen */}
      <div className="w-full h-[30vh] lg:h-screen lg:w-[30%] relative shrink-0 overflow-hidden">
        <img 
          src={HERO_URL} 
          alt="Luxury Resort Pool" 
          className="absolute inset-0 w-full h-full object-cover brightness-90 contrast-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-slate-900/60 lg:from-slate-900/40 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-6 left-6 lg:bottom-20 lg:left-10 text-white z-10">
           <div className="w-8 h-1 bg-white rounded-full mb-4 lg:mb-8 hidden lg:block"></div>
           <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] mb-1 lg:mb-4 opacity-90">Spray Aqua Resort</p>
           <h1 className="text-2xl lg:text-4xl font-black uppercase tracking-tighter leading-none">
             Premium<br/>Escape.
           </h1>
        </div>
      </div>

      {/* Login Terminal: Remaining 70% of the screen */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50/50">
        <div className="w-full max-w-md animate-smart">
          <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] p-8 md:p-14 shadow-2xl border border-slate-100">
            
            <div className="mb-8 md:mb-12 text-center flex flex-col items-center">
               <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-900 rounded-xl lg:rounded-2xl flex items-center justify-center text-white mb-6 lg:mb-8 shadow-xl">
                  <i className="fas fa-bars-staggered text-lg"></i>
               </div>
               <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2 md:mb-4">
                 {view === 'guest' ? 'Entry Portal' : 'Staff Access'}
               </h2>
               <p className="text-slate-400 font-bold text-[9px] lg:text-[10px] uppercase tracking-[0.4em]">
                 Authorized Booking Terminal
               </p>
            </div>

            <form onSubmit={view === 'guest' ? handleGuest : handleAdmin} className="space-y-6 lg:space-y-7">
              {view === 'guest' ? (
                <>
                  <div className="space-y-2 lg:space-y-3">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Lead Guest Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma" 
                      className="input-premium !bg-slate-50 h-14 lg:h-16 text-base lg:text-lg border-transparent focus:border-blue-600" 
                      value={data.name} 
                      onChange={e => setData({...data, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2 lg:space-y-3">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Primary Connection</label>
                    <input 
                      type="tel" 
                      placeholder="10-Digit Mobile" 
                      className="input-premium !bg-slate-50 h-14 lg:h-16 text-base lg:text-lg border-transparent focus:border-blue-600" 
                      value={data.mobile} 
                      onChange={e => setData({...data, mobile: e.target.value})} 
                      required 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 lg:space-y-3">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Authorized Email</label>
                    <input 
                      type="email" 
                      placeholder="admin@spraypark.com" 
                      className="input-premium !bg-slate-50 h-14 lg:h-16 border-transparent focus:border-blue-600" 
                      value={data.email} 
                      onChange={e => setData({...data, email: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2 lg:space-y-3">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Security Key</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="input-premium !bg-slate-50 h-14 lg:h-16 border-transparent focus:border-blue-600" 
                      value={data.password} 
                      onChange={e => setData({...data, password: e.target.value})} 
                      required 
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn-modern !bg-blue-600 hover:!bg-blue-700 h-16 lg:h-20 shadow-xl shadow-blue-200 group mt-4">
                 {view === 'guest' ? 'Book Pass' : 'Sign In'} 
                 <i className="fas fa-chevron-right ml-4 text-[10px] transition-transform group-hover:translate-x-1"></i>
              </button>

              <div className="pt-8 lg:pt-10 flex justify-center border-t border-slate-100 mt-8 lg:mt-10">
                <button 
                  type="button" 
                  onClick={() => setView(view === 'guest' ? 'admin' : 'guest')} 
                  className="text-[9px] lg:text-[10px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-[0.5em] transition-all"
                >
                  {view === 'guest' ? 'Management Login' : 'Guest Portal'}
                </button>
              </div>
            </form>
          </div>
          
          <p className="mt-8 lg:mt-12 text-center text-slate-300 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.6em]">
            Digital Check-In • Resort Node 01
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
