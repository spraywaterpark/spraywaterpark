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
    <div className="min-h-screen w-full flex bg-white font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* Left Column: Massive Professional Hero Section */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src={HERO_URL} 
          alt="Luxury Resort Pool" 
          className="absolute inset-0 w-full h-full object-cover brightness-90 contrast-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-white/10"></div>
        
        <div className="absolute bottom-20 left-20 text-white max-w-lg">
           <div className="w-12 h-1 bg-white rounded-full mb-8"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-80">Spray Aqua Resort Jaipur</p>
           <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-6">
             Your Premier<br/>Splash Escape.
           </h1>
           <p className="text-sm font-medium text-white/70 leading-relaxed uppercase tracking-widest">
             Luxury meets adventure in the heart of Rajasthan.
           </p>
        </div>
      </div>

      {/* Right Column: Sleek Login Terminal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-slate-50/30">
        <div className="w-full max-w-md animate-smart">
          <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100">
            
            <div className="mb-12 text-center flex flex-col items-center">
               <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl">
                  <i className="fas fa-bars-staggered text-xl"></i>
               </div>
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                 {view === 'guest' ? 'Entry Portal' : 'Staff Access'}
               </h2>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">
                 Authorized Booking Terminal
               </p>
            </div>

            <form onSubmit={view === 'guest' ? handleGuest : handleAdmin} className="space-y-7">
              {view === 'guest' ? (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Lead Guest Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma" 
                      className="input-premium !bg-slate-50 h-16 text-lg border-transparent focus:border-blue-600" 
                      value={data.name} 
                      onChange={e => setData({...data, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Primary Connection</label>
                    <input 
                      type="tel" 
                      placeholder="10-Digit Mobile" 
                      className="input-premium !bg-slate-50 h-16 text-lg border-transparent focus:border-blue-600" 
                      value={data.mobile} 
                      onChange={e => setData({...data, mobile: e.target.value})} 
                      required 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Authorized Email</label>
                    <input 
                      type="email" 
                      placeholder="admin@spraypark.com" 
                      className="input-premium !bg-slate-50 h-16 border-transparent focus:border-blue-600" 
                      value={data.email} 
                      onChange={e => setData({...data, email: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Security Key</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="input-premium !bg-slate-50 h-16 border-transparent focus:border-blue-600" 
                      value={data.password} 
                      onChange={e => setData({...data, password: e.target.value})} 
                      required 
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn-modern !bg-blue-600 hover:!bg-blue-700 h-18 md:h-20 shadow-xl shadow-blue-200 group mt-4">
                 {view === 'guest' ? 'Book Pass' : 'Sign In'} 
                 <i className="fas fa-chevron-right ml-4 text-[10px] transition-transform group-hover:translate-x-1"></i>
              </button>

              <div className="pt-10 flex justify-center border-t border-slate-100 mt-10">
                <button 
                  type="button" 
                  onClick={() => setView(view === 'guest' ? 'admin' : 'guest')} 
                  className="text-[10px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-[0.5em] transition-all"
                >
                  {view === 'guest' ? 'Management Login' : 'Guest Portal'}
                </button>
              </div>
            </form>
          </div>
          
          <p className="mt-12 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.8em]">
            Digital Check-In • Resort Node 01
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
