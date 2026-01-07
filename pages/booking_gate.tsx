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
    <div className="glass-card">
      {/* LEFT: VISUAL SIDE WITH OVERLAY TEXT */}
      <div className="w-full md:w-5/12 h-64 md:h-auto relative bg-slate-900 overflow-hidden shrink-0">
        <img 
          src={LOGIN_HERO_IMAGE} 
          alt="Aqua Resort" 
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-10 pb-14">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                Splash <br /> Into Fun
            </h1>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Spray Aqua Resort Jaipur</p>
        </div>
      </div>

      {/* RIGHT: FORM SIDE */}
      <div className="w-full md:w-7/12 p-8 md:p-20 flex flex-col justify-center bg-white grow">
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-water text-xl"></i>
             </div>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Spray Aqua Resort</h3>
          </div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
            {view === 'landing' ? 'Guest Entry' : 'Admin Login'}
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            {view === 'landing' ? 'Welcome to Jaipur\'s Best Water Park' : 'Restricted Management Access'}
          </p>
        </div>

        <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="space-y-7">
          {view === 'landing' ? (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" placeholder="Rahul Sharma" className="input-premium" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile No.</label>
                <input type="tel" placeholder="10-digit number" className="input-premium" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} required />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" placeholder="admin@spraypark.com" className="input-premium" value={data.email} onChange={e => setData({...data, email: e.target.value})} required />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input type="password" placeholder="••••••••" className="input-premium" value={data.password} onChange={e => setData({...data, password: e.target.value})} required />
              </div>
            </>
          )}

          <button type="submit" className="btn-resort h-20 shadow-2xl mt-4">
            {view === 'landing' ? 'Get Tickets' : 'Login Admin'}
          </button>

          <div className="pt-10 text-center">
            <button 
              type="button" 
              onClick={() => setView(view === 'landing' ? 'admin' : 'landing')} 
              className="text-[10px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              {view === 'landing' ? 'Admin Access?' : 'Back to Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginGate;
