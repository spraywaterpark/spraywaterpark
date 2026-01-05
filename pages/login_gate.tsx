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
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
      {/* 
          ADAPTIVE CONTAINER:
          - Uses max-h-[min(650px,90vh)] to ensure it never overflows small laptop screens.
          - max-w-5xl keeps the content readable on large monitors.
      */}
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row md:h-[min(600px,80vh)]">
        
        {/* IMAGE SECTION: Optimized for high-res displays */}
        <div className="relative w-full md:w-1/2 h-[30vh] md:h-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1519817650390-64a934479f67?auto=format&fit=crop&q=80&w=1200" 
            alt="Spray Resort" 
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
          />
          {/* Gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1B2559]/90 via-[#1B2559]/40 to-transparent p-6 md:p-12 flex flex-col justify-end text-white">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 mb-4">
                <i className="fas fa-water text-blue-400 text-[10px]"></i>
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Premium Resort</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.85] mb-2">
                Spray Aqua <br /> <span className="text-blue-400">Resort</span>
              </h2>
              <p className="hidden md:block text-slate-200 text-xs font-medium opacity-80 max-w-[250px]">
                The ultimate family destination for thrills, chills, and luxury dining.
              </p>
            </div>
          </div>
        </div>

        {/* FORM SECTION: Scrollable independently if height is tight */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 bg-white flex flex-col justify-center overflow-y-auto">
          <div className="mb-6 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-[#1B2559] uppercase tracking-tighter">
              {view === 'landing' ? 'Book Tickets' : 'Staff Portal'}
            </h3>
            <div className="h-1 w-8 bg-blue-600 mt-2 rounded-full mx-auto md:mx-0"></div>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Name" 
                  className="input-luxury !py-3 !px-5 !border-slate-300 text-sm" 
                  value={data.name} 
                  onChange={e => setData({...data, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                <input 
                  type="tel" 
                  placeholder="10-digit number" 
                  className="input-luxury !py-3 !px-5 !border-slate-300 text-sm" 
                  value={data.mobile} 
                  onChange={e => setData({...data, mobile: e.target.value})} 
                  required 
                />
              </div>
              
              <button className="w-full btn-premium py-4 mt-2 text-[11px] font-black shadow-lg group active:scale-95 transition-all">
                Proceed to Booking
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </button>
              
              <div className="pt-6 border-t border-slate-100 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[9px] font-black text-slate-300 hover:text-blue-600 uppercase tracking-[0.3em] transition-colors">
                  Administrator Portal
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Email</label>
                <input 
                  type="email" 
                  placeholder="admin@spray.com" 
                  className="input-luxury !py-3 !px-5 !border-slate-300 text-sm" 
                  value={data.email} 
                  onChange={e => setData({...data, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN Code</label>
                <input 
                  type="password" 
                  placeholder="••••" 
                  className="input-luxury !py-3 !px-5 !border-slate-300 text-sm" 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  required 
                />
              </div>
              <button className="w-full btn-premium py-4 mt-2">Verify & Login</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mt-6">
                Back to Booking
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
