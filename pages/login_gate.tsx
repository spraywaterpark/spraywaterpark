
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
  const [errors, setErrors] = useState({ name: '', mobile: '' });

  const validateName = (name: string) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!nameRegex.test(name)) {
      return "Name should only contain alphabets (केवल अक्षरों का प्रयोग करें)";
    }
    return "";
  };

  const validateMobile = (mobile: string) => {
    if (mobile.length > 0 && !/^[6-9]/.test(mobile)) {
      return "Mobile must start with 6, 7, 8, or 9 (नंबर 6,7,8 या 9 से शुरू होना चाहिए)";
    }
    if (mobile.length > 0 && !/^\d*$/.test(mobile)) {
      return "Only numbers allowed (केवल नंबर दर्ज करें)";
    }
    return "";
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const error = validateName(val);
    setErrors(prev => ({ ...prev, name: error }));
    // If it's a valid character set, update state
    if (!error || val === "") {
      setData({ ...data, name: val });
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 10) return; // Max 10 digits

    const error = validateMobile(val);
    setErrors(prev => ({ ...prev, mobile: error }));
    
    // Only allow digits to be typed
    if (/^\d*$/.test(val)) {
      setData({ ...data, mobile: val });
    }
  };

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final deep validation on submit
    const nameError = data.name.trim().length < 2 ? "Please enter a valid name" : validateName(data.name);
    const mobileError = data.mobile.length !== 10 ? "Mobile number must be exactly 10 digits" : validateMobile(data.mobile);

    if (nameError || mobileError) {
      setErrors({ name: nameError, mobile: mobileError });
      alert("Input value correct karo! (कृपया जानकारी सही तरीके से भरें)");
      return;
    }

    onGuestLogin(data.name.trim(), data.mobile.trim());
    navigate('/book');
  };

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.email.trim() === 'admin@spraywaterpark.com' && data.password.trim() === 'admin123') {
      onAdminLogin(data.email.trim());
      navigate('/admin');
    } else {
      alert("Unauthorized access attempt. Please check credentials.");
    }
  };

  return (
    <div className="w-full flex items-center justify-center animate-slide-up py-10">
      <div className="w-full max-w-6xl glass-card rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-auto md:h-[680px] border border-white/50">
        
        {/* LEFT SIDE: THE IMAGE */}
        <div className="w-full md:w-5/12 h-80 md:h-full relative overflow-hidden bg-slate-900">
          <img 
            src={LOGIN_HERO_IMAGE} 
            alt="Resort Guest Experience" 
            className="absolute inset-0 w-full h-full object-cover grayscale-[15%] hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-12 text-center md:text-left">
            <div className="mb-4">
              <i className="fas fa-water text-blue-400 text-3xl"></i>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-3">Spray Aqua Resort</h1>
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-[0.4em] mb-4">Premium Waterfront Destination</p>
            <div className="flex gap-2 justify-center md:justify-start">
               <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
               <span className="w-2 h-1 bg-white/20 rounded-full"></span>
               <span className="w-2 h-1 bg-white/20 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: THE FORM */}
        <div className="w-full md:w-7/12 p-12 md:p-24 flex flex-col items-center justify-center bg-white/40">
          <div className="mb-14 text-center">
            <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-3">
              {view === 'landing' ? 'Guest Portal' : 'Staff Portal'}
            </h2>
            <div className="flex items-center justify-center gap-4">
                <span className="h-[1px] w-8 bg-slate-200"></span>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.25em]">
                  {view === 'landing' ? 'Enter credentials to book tickets' : 'Management access required'}
                </p>
                <span className="h-[1px] w-8 bg-slate-200"></span>
            </div>
          </div>

          <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="w-full max-w-sm space-y-8">
            {view === 'landing' ? (
              <>
                <div className="space-y-3">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Full Guest Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter Alphabets Only" 
                    className={`input-premium ${errors.name ? 'border-red-400 focus:border-red-500' : ''}`} 
                    value={data.name} 
                    onChange={handleNameChange} 
                    required 
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.name}</p>}
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Mobile Contact (10 Digits)</label>
                  <input 
                    type="tel" 
                    placeholder="Starts with 6,7,8,9" 
                    className={`input-premium ${errors.mobile ? 'border-red-400 focus:border-red-500' : ''}`} 
                    value={data.mobile} 
                    onChange={handleMobileChange} 
                    required 
                  />
                  {errors.mobile && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.mobile}</p>}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Staff Email ID</label>
                  <input 
                    type="email" 
                    placeholder="admin@sprayresort.com" 
                    className="input-premium" 
                    value={data.email} 
                    onChange={e => setData({...data, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
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

            <button type="submit" className="w-full btn-resort mt-6 h-20 shadow-2xl">
              {view === 'landing' ? (
                <>
                  Book Your Splash Day <i className="fas fa-arrow-right ml-2 text-xs opacity-50"></i>
                </>
              ) : (
                'Sign Into Terminal'
              )}
            </button>

            <div className="pt-10 border-t border-slate-200/60 flex flex-col items-center gap-6">
               <button 
                type="button" 
                onClick={() => {
                  setView(view === 'landing' ? 'admin' : 'landing');
                  setErrors({ name: '', mobile: '' });
                }} 
                className="text-[11px] font-extrabold text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-all flex items-center gap-3"
               >
                 <i className={`fas ${view === 'landing' ? 'fa-shield-halved' : 'fa-user-tag'} opacity-40`}></i>
                 {view === 'landing' ? 'Management Access' : 'Back to Guest Entry'}
               </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Footer Branding for Login */}
      <div className="fixed bottom-8 text-center opacity-30 hidden md:block">
         <p className="text-[10px] font-black text-white uppercase tracking-[0.8em]">Spray Aqua Resort • Jagatpura • Jaipur</p>
      </div>
    </div>
  );
};

export default LoginGate;
