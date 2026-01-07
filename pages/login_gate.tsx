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
      alert("Invalid Staff Credentials!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] w-full px-4 py-4 md:py-10 animate-fade">
      <div className="glass-card w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] md:min-h-[600px] border-4 border-white">
        
        {/* HERO IMAGE: Responsive split. 30% width on Desktop, 30% height on Mobile */}
        <div className="w-full md:w-[30%] h-[25vh] md:h-auto relative bg-slate-900 shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
          <img 
            src={LOGIN_HERO_IMAGE} 
            alt="Aqua Resort" 
            className="w-full h-full object-cover opacity-80 contrast-125 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-6 items-center text-center">
              <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-tight text-center">
                  Splash <br /> Into Fun
              </h1>
              <p className="text-white/50 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.4em] mt-2 text-center">Spray Aqua Resort</p>
          </div>
        </div>

        {/* CONTENT AREA: All elements center aligned */}
        <div className="w-full md:w-[70%] p-8 md:p-20 flex flex-col items-center justify-center bg-white grow text-center">
          <div className="mb-8 md:mb-14 flex flex-col items-center w-full">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6">
                <i className="fas fa-water text-xl md:text-2xl"></i>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 text-center">
              {view === 'landing' ? 'Guest Entry' : 'Staff Access'}
            </h2>
            <p className="text-slate-400 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] max-w-xs md:max-w-md text-center">
              {view === 'landing' ? 'Experience Premium Water Park Fun' : 'Secure Management Portal'}
            </p>
          </div>

          <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="w-full max-w-sm space-y-6 md:space-y-8 flex flex-col items-center">
            {view === 'landing' ? (
              <>
                <div className="w-full space-y-2 flex flex-col items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-full">Guest Full Name</label>
                  <input type="text" placeholder="Rahul Sharma" className="input-premium" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
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

            <button type="submit" className="btn-resort h-20 shadow-2xl mt-4 text-center">
              {view === 'landing' ? 'Get Entry Passes' : 'Access Portal'}
            </button>

            <div className="pt-10 w-full flex justify-center">
              <button 
                type="button" 
                onClick={() => setView(view === 'landing' ? 'admin' : 'landing')} 
                className="text-[9px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.4em] transition-all text-center"
              >
                {view === 'landing' ? 'Switch to Staff?' : 'Back to Guest Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
