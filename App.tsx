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
      alert("Unauthorized: Access Denied.");
    }
  };

  return (
    <div className="w-full max-w-5xl animate-reveal">
      <div className="glass-card flex flex-col md:flex-row min-h-[620px]">
        
        {/* LEFT PART: Hero Image with TEXT POSITIONED LOWER */}
        <div className="w-full md:w-5/12 relative min-h-[300px] md:min-h-full bg-slate-900">
          <img 
            src={LOGIN_HERO_IMAGE} 
            alt="Resort View" 
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          {/* Overlay text moved LOWER using justify-end and pb-14 */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/10 to-transparent flex flex-col justify-end p-10 pb-14 text-center md:text-left">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight mb-3">
              <span className="underline decoration-blue-500 decoration-4 underline-offset-8">Splash Into Fun</span>
            </h1>
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-[0.4em] ml-1">
              at Jaipur's Premium WaterPark
            </p>
          </div>
        </div>

        {/* RIGHT PART: Form Content */}
        <div className="w-full md:w-7/12 p-10 md:p-20 flex flex-col items-center justify-center bg-white/50">
          <div className="w-full max-w-sm">
            <div className="mb-14 text-center md:text-left">
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-2">
                {view === 'landing' ? 'Guest Entry' : 'Admin Login'}
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">
                {view === 'landing' ? 'Welcome to the Aqua Resort' : 'Terminal Authentication Required'}
              </p>
            </div>

            <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="space-y-7">
              {view === 'landing' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Full Name</label>
                    <input type="text" placeholder="e.g. Rahul Sharma" className="input-premium" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                    <input type="tel" placeholder="10-digit number" className="input-premium" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} required />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Identity</label>
                    <input type="email" placeholder="admin@resort.com" className="input-premium" value={data.email} onChange={e => setData({...data, email: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
                    <input type="password" placeholder="••••••••" className="input-premium" value={data.password} onChange={e => setData({...data, password: e.target.value})} required />
                  </div>
                </>
              )}

              <button type="submit" className="w-full btn-resort mt-6 h-20 shadow-2xl">
                {view === 'landing' ? 'Start Booking' : 'Authorize Now'}
              </button>

              <div className="pt-10 text-center">
                 <button 
                  type="button" 
                  onClick={() => setView(view === 'landing' ? 'admin' : 'landing')} 
                  className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.3em] transition-all"
                 >
                   {view === 'landing' ? 'Management Login' : 'Back to Guest Portal'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
