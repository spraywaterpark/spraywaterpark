import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN_HERO_IMAGE = "https://www.vickerypediatrics.com/wp-content/uploads/2018/07/child-swimming-safely.jpg";

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
      alert("Invalid Staff Credentials.");
    }
  };

  return (
    <div className="w-full flex items-center justify-center animate-reveal">
      <div className="w-full max-w-5xl glass-card overflow-hidden flex flex-col md:flex-row h-auto md:h-[620px]">
        
        {/* LEFT SIDE: HERO IMAGE WITH CUSTOM TEXT */}
        <div className="w-full md:w-5/12 h-64 md:h-full relative overflow-hidden bg-slate-900">
          <img 
            src={LOGIN_HERO_IMAGE} 
            alt="Splash Day" 
            className="absolute inset-0 w-full h-full object-cover grayscale-[10%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-12 text-center md:text-left">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              <span className="underline decoration-blue-500 decoration-4 underline-offset-8">Splash Into Fun</span>
            </h1>
            <p className="text-white/80 text-[12px] font-bold uppercase tracking-[0.3em] ml-1">
              at Jaipur's Premium WaterPark
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: CENTERED FORM */}
        <div className="w-full md:w-7/12 p-12 md:p-20 flex flex-col items-center justify-center bg-white/40">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              {view === 'landing' ? 'Guest Entry' : 'Admin Login'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
              {view === 'landing' ? 'Reservation Terminal' : 'Management Secure Access'}
            </p>
          </div>

          <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="w-full max-w-sm space-y-6">
            {view === 'landing' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Guest Name</label>
                  <input type="text" placeholder="Rahul Sharma" className="input-premium" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                  <input type="tel" placeholder="10-digit mobile" className="input-premium" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} required />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                  <input type="email" placeholder="admin@sprayresort.com" className="input-premium" value={data.email} onChange={e => setData({...data, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input type="password" placeholder="••••••••" className="input-premium" value={data.password} onChange={e => setData({...data, password: e.target.value})} required />
                </div>
              </>
            )}

            <button type="submit" className="w-full btn-resort mt-6 h-18 shadow-2xl">
              {view === 'landing' ? 'Check Available Slots' : 'Enter Dashboard'}
            </button>

            <div className="pt-8 flex flex-col items-center gap-4">
               <button 
                type="button" 
                onClick={() => setView(view === 'landing' ? 'admin' : 'landing')} 
                className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-all"
               >
                 {view === 'landing' ? 'Staff Login' : 'Guest Registration'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
