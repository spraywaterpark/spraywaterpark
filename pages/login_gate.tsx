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
          - 30/70 Split for Desktop.
          - Fixed height of 600px to avoid oversized images.
      */}
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px] border border-white">
        
        {/* IMAGE SIDEBAR (STRICT 30% WIDTH) - COLORFUL KIDS MASTI */}
        <div className="relative w-full md:w-[30%] h-48 md:h-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200" 
            alt="Kids Masti in Pool" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          />
          {/* Fun Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/70 via-transparent to-transparent flex flex-col justify-end p-8">
            <h1 className="logo-font text-3xl text-white drop-shadow-xl">Splash!</h1>
            <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Unlimited Masti</p>
            </div>
          </div>
        </div>

        {/* FORM CONTENT (STRICT 70% WIDTH) */}
        <div className="w-full md:w-[70%] p-8 md:p-16 bg-white flex flex-col justify-center relative">
          
          {/* Header Branding */}
          <div className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl mb-6 border border-blue-100">
               <i className="fas fa-sun text-orange-400 text-xs animate-spin-slow"></i>
               <span className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em]">Jaipur's Favorite Pool Party</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-[#1B2559] uppercase tracking-tighter leading-none mb-4">
              {view === 'landing' ? <>Spray <span className="text-blue-500">Aqua</span></> : 'Staff Entry'}
            </h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] ml-1">
              {view === 'landing' ? 'Experience the thrill with your family and friends.' : 'Please enter your administrative secure pin.'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6 max-w-md w-full">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Guest Name</label>
                <div className="relative">
                   <i className="fas fa-user-circle absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                   <input 
                    type="text" 
                    placeholder="e.g. Rahul Sharma" 
                    className="input-luxury !pl-12 !py-4 border-2 border-slate-100 focus:!border-blue-500 !rounded-2xl" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-blue-500">Mobile Number</label>
                <div className="relative">
                   <i className="fas fa-phone-alt absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                   <input 
                    type="tel" 
                    placeholder="10-Digit Mobile" 
                    className="input-luxury !pl-12 !py-4 border-2 border-slate-100 focus:!border-blue-500 !rounded-2xl" 
                    value={data.mobile} 
                    onChange={e => setData({...data, mobile: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              
              <div className="pt-6">
                <button className="w-full btn-premium py-6 flex items-center justify-center gap-4 group !rounded-2xl">
                  <span className="font-black tracking-widest">Book My Visit</span>
                  <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-2 transition-transform"></i>
                </button>
              </div>

              <div className="pt-10 border-t border-slate-50 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[10px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.3em] transition-all">
                  Switch to Admin
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6 max-w-md w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="admin@sprayaqua.com" 
                  className="input-luxury !py-4 border-2 border-slate-100 !rounded-2xl" 
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
                  className="input-luxury !py-4 border-2 border-slate-100 !rounded-2xl" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-6 !rounded-2xl">Verify & Enter</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-10">
                <i className="fas fa-chevron-left mr-2"></i> Back to Booking
              </button>
            </form>
          )}

          {/* Large Background Icon */}
          <i className="fas fa-water absolute -right-8 bottom-10 text-slate-50 text-[12rem] pointer-events-none -z-10 opacity-70"></i>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
