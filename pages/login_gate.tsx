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
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      {/* 
          STABLE CONTAINER:
          - md:w-[30%] for the image sidebar.
          - md:w-[70%] for the booking form.
          - Fixed height of 620px to prevent layout shifts.
      */}
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_60px_120px_-20px_rgba(2,132,199,0.25)] overflow-hidden flex flex-col md:flex-row h-auto md:h-[620px] border border-white">
        
        {/* LEFT SIDE: HD COLORFUL IMAGE (STRICT 30% WIDTH) */}
        <div className="relative w-full md:w-[30%] h-56 md:h-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200" 
            alt="Underwater Pool Masti" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] hover:scale-110"
          />
          {/* Vibrant Aqua Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/80 via-transparent to-transparent flex flex-col justify-end p-8">
            <h1 className="logo-font text-3xl text-white drop-shadow-2xl">Splash!</h1>
            <p className="text-[9px] font-black text-white/90 uppercase tracking-[0.4em] mt-2">Jaipur's #1 Pool Party</p>
          </div>
        </div>

        {/* RIGHT SIDE: BOOKING FORM (STRICT 70% WIDTH) */}
        <div className="w-full md:w-[70%] p-8 md:p-16 bg-white flex flex-col justify-center relative">
          
          {/* Top Banner */}
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-3 bg-blue-50 px-5 py-2.5 rounded-2xl mb-6 border border-blue-100 animate-bounce-slow">
               <i className="fas fa-certificate text-blue-500 text-xs"></i>
               <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Early Bird Offer: 20% OFF</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-[#1B2559] uppercase tracking-tighter leading-none mb-4">
              {view === 'landing' ? <>Spray <span className="text-blue-500 underline decoration-blue-100 underline-offset-8">Aqua</span></> : 'Staff Terminal'}
            </h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] ml-1">
              {view === 'landing' ? 'Unlimited Masti. Unlimited Memories.' : 'Administrative access to sales dashboard.'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6 max-w-md w-full mx-auto md:mx-0">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Full Name</label>
                <div className="relative">
                   <i className="fas fa-user-circle absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                   <input 
                    type="text" 
                    placeholder="Enter Your Name" 
                    className="input-luxury !pl-14 !py-4 border-2 border-slate-50 focus:!border-blue-400 focus:!bg-white" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Mobile Number</label>
                <div className="relative">
                   <i className="fas fa-phone-alt absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                   <input 
                    type="tel" 
                    placeholder="+91 Mobile Number" 
                    className="input-luxury !pl-14 !py-4 border-2 border-slate-50 focus:!border-blue-400 focus:!bg-white" 
                    value={data.mobile} 
                    onChange={e => setData({...data, mobile: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              
              <div className="pt-6">
                <button className="w-full btn-premium py-6 flex items-center justify-center gap-4 group rounded-2xl">
                  <span className="font-black tracking-widest">Start My Journey</span>
                  <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-2 transition-transform"></i>
                </button>
              </div>

              <div className="pt-10 border-t border-slate-50 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[10px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.4em] transition-all">
                  Staff Login Terminal
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6 max-w-md w-full mx-auto md:mx-0">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email</label>
                <input 
                  type="email" 
                  placeholder="admin@sprayaqua.com" 
                  className="input-luxury !py-4 border-2 border-slate-50" 
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
                  className="input-luxury !py-4 border-2 border-slate-50" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-6 rounded-2xl">Verify & Login</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-10">
                <i className="fas fa-chevron-left mr-2"></i> Return to Guest Portal
              </button>
            </form>
          )}

          {/* Large Background Decoration */}
          <i className="fas fa-umbrella-beach absolute -right-4 bottom-10 text-slate-50 text-[10rem] pointer-events-none -z-10 opacity-60"></i>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
