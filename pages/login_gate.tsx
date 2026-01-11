import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN_HERO_IMAGE = "https://www.vickerypediatrics.com/wp-content/uploads/2018/07/child-swimming-safely.jpg";

interface LoginPageProps {
  onGuestLogin: (n: string, m: string) => void;
  onAdminLogin: (e: string, role: 'admin' | 'staff') => void;
}

const LoginGate: React.FC<LoginPageProps> = ({ onGuestLogin, onAdminLogin }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'landing' | 'admin'>('landing');
  const [data, setData] = useState({ name: '', mobile: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', mobile: '' });

  const validateName = (name: string) => {
    if (name.trim() === "") return "";
    if (!/^[a-zA-Z\s]*$/.test(name)) return "Only alphabets allowed.";
    if (name.trim().length < 2) return "Name too short.";
    return "";
  };

  const validateMobile = (mobile: string) => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return "Enter valid 10-digit mobile.";
    return "";
  };

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(data.name);
    const mobileErr = validateMobile(data.mobile);

    if (nameErr || mobileErr) {
      setErrors({ name: nameErr, mobile: mobileErr });
      return alert("Please correct the errors.");
    }

    onGuestLogin(data.name.trim(), data.mobile.trim());
    navigate('/book');
  };

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    const email = data.email.trim();
    const pass = data.password.trim();

    if (email === 'admin@spraywaterpark.com' && pass === 'admin123') {
      onAdminLogin(email, 'admin');
      navigate('/admin');
    } 
    else if (email === 'staff@spraywaterpark.com' && pass === 'staff123') {
      onAdminLogin(email, 'staff');
      navigate('/staff');
    } 
    else {
      alert("Invalid credentials.");
    }
  };

  return (
    <div className="w-full flex items-center justify-center animate-slide-up">
      <div className="w-full max-w-5xl glass-card rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px] border border-white/40">

        {/* LEFT IMAGE */}
        <div className="w-full md:w-5/12 h-64 md:h-full relative overflow-hidden bg-slate-900">
          <img src={LOGIN_HERO_IMAGE} className="absolute inset-0 w-full h-full object-cover grayscale-[20%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-12">
            <h1 className="text-3xl font-black text-white uppercase mb-2">Spray Aqua Resort</h1>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.3em]">Premium Waterfront Destination</p>
          </div>
        </div>

        {/* FORM */}
        <div className="w-full md:w-7/12 p-10 md:p-16 flex flex-col items-center justify-center">

          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black uppercase mb-2">
              {view === 'landing' ? 'Guest Portal' : 'Management Portal'}
            </h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em]">
              {view === 'landing' ? 'Book your tickets' : 'Authorized access only'}
            </p>
          </div>

          <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="w-full max-sm space-y-6">

            {view === 'landing' ? (
              <>
                <input placeholder="Full Name" className="input-premium" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                <input placeholder="Mobile Number" className="input-premium" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} />
              </>
            ) : (
              <>
                <input placeholder="Email" className="input-premium" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
                <input type="password" placeholder="Password" className="input-premium" value={data.password} onChange={e => setData({...data, password: e.target.value})} />
              </>
            )}

            <button type="submit" className="w-full btn-resort h-16 shadow-xl">
              {view === 'landing' ? 'Book Tickets Now' : 'Sign In'}
            </button>

            <button type="button" onClick={() => setView(view === 'landing' ? 'admin' : 'landing')}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
              {view === 'landing' ? 'Management Access' : 'Back to Guest Entry'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
