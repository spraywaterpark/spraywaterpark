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
      alert("Unauthorized Access. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-[85vh] md:min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Animated Circles for 'Water' vibe */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row md:h-[min(750px,85vh)] relative z-10 border border-white/50">
        
        {/* Left Section: Stunning Resort Hero */}
        <div className="relative w-full md:w-1/2 h-[35vh] md:h-full group">
          <img 
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200" 
            alt="Spray Resort Pool" 
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-[2s]"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/90 via-slate-900/40 to-transparent p-8 md:p-14 flex flex-col justify-end text-white">
            <div className="relative">
              <span className="logo-font text-3xl text-blue-400 mb-2 block">Premium Escape</span>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
                Spray Aqua <br /> <span className="text-blue-400">Resort</span>
              </h2>
              <div className="hidden md:flex gap-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <i className="fas fa-sun text-yellow-400"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Luxury Pool</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <i className="fas fa-utensils text-orange-400"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Fine Dining</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive Glass Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 bg-white flex flex-col justify-center relative">
          <div className="mb-10 text-center md:text-left">
             <div className="inline-block md:block">
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                  {view === 'landing' ? 'Welcome Back' : 'Staff Login'}
                </h3>
                <div className="h-1.5 w-12 bg-blue-600 mt-3 rounded-full mx-auto md:mx-0 shimmer"></div>
             </div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-5">
               {view === 'landing' ? 'Your Gateway to Fun' : 'Authorized Access Only'}
             </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 group-focus-within:text-blue-600 transition-colors">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Rahul Sharma" 
                  className="input-luxury" 
                  value={data.name} 
                  onChange={e => setData({...data, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 group-focus-within:text-blue-600 transition-colors">Mobile Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 00000 00000" 
                  className="input-luxury" 
                  value={data.mobile} 
                  onChange={e => setData({...data, mobile: e.target.value})} 
                  required 
                />
              </div>
              
              <button className="w-full btn-premium shimmer group py-6 mt-4">
                <span>Unlock Your Splash Day</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
              </button>
              
              <div className="pt-8 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[9px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.4em] transition-all">
                  Staff Entrance
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="admin@sprayaqua.com" 
                  className="input-luxury" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Secure PIN</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-luxury" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium shimmer py-6 mt-2">Access Dashboard</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-8">
                <i className="fas fa-chevron-left mr-2"></i> Return to Booking
              </button>
            </form>
          )}

          {/* Background decoration in form */}
          <i className="fas fa-water absolute -right-4 bottom-10 text-slate-50/10 text-[10rem] pointer-events-none"></i>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
