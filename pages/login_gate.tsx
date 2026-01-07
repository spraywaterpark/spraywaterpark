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
    const nameValue = data.name.trim();
    const mobileValue = data.mobile.trim();

    // Name validation: only alphabets allowed (spaces allowed)
    const namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(nameValue)) {
      alert("Invalid name. Please use alphabets only.");
      return;
    }

    // Mobile validation: only numeric, exactly 10 digits, starts with 6,7,8,9
    const mobilePattern = /^[6-9]\d{9}$/;
    if (!mobilePattern.test(mobileValue)) {
      alert("invalid mobile no");
      return;
    }

    if (nameValue && mobileValue) {
      onGuestLogin(nameValue, mobileValue);
      navigate('/book');
    }
  };

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.email.trim() === 'admin@spraywaterpark.com' && data.password.trim() === 'admin123') {
      onAdminLogin(data.email.trim());
      navigate('/admin');
    } else {
      alert("Unauthorized access attempt.");
    }
  };

  return (
    <div className="w-full flex items-center justify-center animate-slide-up">
      <div className="w-full max-w-5xl glass-card rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px] border border-white/40">
        
        {/* LEFT SIDE: THE IMAGE */}
        <div className="w-full md:w-5/12 h-64 md:h-full relative overflow-hidden bg-slate-900">
          <img 
            src={LOGIN_HERO_IMAGE} 
            alt="Resort Guest" 
            className="absolute inset-0 w-full h-full object-cover grayscale-[20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-12 text-center md:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">Spray Aqua Resort</h1>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.3em]">Premium Waterfront Destination</p>
          </div>
        </div>

        {/* RIGHT SIDE: THE FORM */}
        <div className="w-full md:w-7/12 p-10 md:p-16 flex flex-col items-center justify-center">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              {view === 'landing' ? 'Guest Portal' : 'Staff Portal'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              {view === 'landing' ? 'Enter your credentials to book tickets' : 'Management access required'}
            </p>
          </div>

          <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="w-full max-w-sm space-y-6">
            {view === 'landing' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Guest Name</label>
                  <input 
                    type="text" 
                    placeholder="Rahul Sharma" 
                    className="input-premium" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                  <input 
                    type="tel" 
                    placeholder="10-digit number" 
                    className="input-premium" 
                    value={data.mobile} 
                    onChange={e => setData({...data, mobile: e.target.value})} 
                    required 
                    maxLength={10} 
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Staff Email</label>
                  <input 
                    type="email" 
                    placeholder="admin@sprayresort.com" 
                    className="input-premium" 
                    value={data.email} 
                    onChange={e => setData({...data, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input-premium" 
                    value={data.password} 
                    onChange={e => setData({...data, password: e.target.value})} 
                    required 
                  />
                </div>
              </>
            )}

            <button type="submit" className="w-full btn-resort mt-4 h-16 shadow-xl">
              {view === 'landing' ? 'Book Tickets Now' : 'Sign In'}
            </button>

            <div className="pt-8 border-t border-slate-200/50 flex flex-col items-center gap-4">
               <button 
                type="button" 
                onClick={() => setView(view === 'landing' ? 'admin' : 'landing')} 
                className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all"
               >
                 {view === 'landing' ? 'Management Access' : 'Back to Guest Entry'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
