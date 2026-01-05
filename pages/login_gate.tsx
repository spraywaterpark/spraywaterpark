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
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8 relative">
      {/* 
          CENTRAL CARD:
          - Uses flex-col for mobile, flex-row for desktop.
          - max-h to fit on all laptop screens.
      */}
      <div className="w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row md:h-[min(580px,85vh)] border border-white">
        
        {/* LEFT SECTION: IMAGE (STRICT 30% WIDTH) */}
        <div className="relative w-full md:w-[30%] h-40 md:h-full overflow-hidden border-r border-slate-100">
          <img 
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200" 
            alt="Spray Resort" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] hover:scale-110"
          />
          {/* Creative Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/20 to-transparent p-6 flex flex-col justify-end text-white">
            <div className="animate-float">
                <p className="logo-font text-xl text-blue-300">Splash!</p>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-80 mt-1">Premium Escape</p>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: FORM (STRICT 70% WIDTH) */}
        <div className="w-full md:w-[70%] p-8 md:p-16 flex flex-col justify-center bg-white relative">
          
          {/* Floating Badge (Creativity) */}
          <div className="absolute top-8 right-8 hidden md:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 animate-pulse">
            <i className="fas fa-certificate text-blue-600 text-xs"></i>
            <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Jaipur's #1 Water Park</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-[#1B2559] uppercase tracking-tighter leading-none">
              {view === 'landing' ? <>Spray <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Resort</span></> : 'Staff Entry'}
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-6">
              {view === 'landing' ? 'Book your tickets for a day of unlimited fun' : 'Authorized Personnel Dashboard'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Full Name</label>
                <div className="relative group">
                  <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                  <input 
                    type="text" 
                    placeholder="Enter Guest Name" 
                    className="input-luxury !pl-12 !border-slate-200 focus:!border-blue-500" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mobile Number</label>
                <div className="relative group">
                  <i className="fas fa-phone-alt absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                  <input 
                    type="tel" 
                    placeholder="+91 Mobile Number" 
                    className="input-luxury !pl-12 !border-slate-200 focus:!border-blue-500" 
                    value={data.mobile} 
                    onChange={e => setData({...data, mobile: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button className="w-full btn-premium py-6 group relative overflow-hidden">
                   <span className="relative z-10 flex items-center justify-center gap-3">
                      Start My Splash Journey
                      <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-2"></i>
                   </span>
                </button>
              </div>

              <div className="pt-8 border-t border-slate-50 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[9px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.4em] transition-all">
                  Staff Login Terminal
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Admin Email</label>
                <input 
                  type="email" 
                  placeholder="admin@sprayaqua.com" 
                  className="input-luxury !border-slate-200" 
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
                  className="input-luxury !border-slate-200" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-6">Login to Dashboard</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-8">
                <i className="fas fa-chevron-left mr-2"></i> Return to Guest Portal
              </button>
            </form>
          )}

          {/* Decorative Wave Icon */}
          <i className="fas fa-water absolute right-10 bottom-10 text-blue-50/50 text-[12rem] pointer-events-none -z-10"></i>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
