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
      alert("Unauthorized Access Attempted.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden card-premium min-h-[500px] md:min-h-[550px]">
        {/* Left Side: Hero Section */}
        <div className="h-[250px] lg:h-auto lg:col-span-7 relative group order-1 lg:order-none">
          <img 
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1400" 
            alt="Resort Pool" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#1B2559]/95 to-transparent flex flex-col justify-end lg:justify-center p-8 md:p-12 lg:p-20 text-white">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-300 mb-2 md:mb-4 block">Jagatpura, Jaipur</span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6">Experience the <br/><span className="text-blue-300 underline decoration-blue-500/30 underline-offset-8">Perfect Splash.</span></h2>
            <p className="hidden md:block text-slate-200 max-w-sm font-semibold leading-relaxed text-base">Discover Rajasthan's most premium water resort. Enjoy exclusive early-bird benefits and delicious meals on us.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-5 p-8 md:p-16 flex flex-col justify-center bg-white order-2 lg:order-none">
          <div className="mb-8 md:mb-10 text-center lg:text-left">
            <h3 className="text-2xl font-black text-[#1B2559] uppercase tracking-tight">
              {view === 'landing' ? 'Welcome to Spray Aqua' : 'Administration'}
            </h3>
            <p className="text-slate-600 text-sm mt-2 font-bold uppercase tracking-wider">
              {view === 'landing' ? 'Enter your details to start booking' : 'Restricted staff portal'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-5 md:space-y-7">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.15em] ml-1">Full Guest Name</label>
                <input type="text" placeholder="e.g. Rahul Sharma" className="input-premium text-base" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.15em] ml-1">Phone Number</label>
                <input type="tel" placeholder="+91 00000 00000" className="input-premium text-base" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} required />
              </div>
              <button className="w-full btn-luxury group py-4 md:py-5 text-sm uppercase tracking-widest shadow-lg shadow-blue-900/10">
                Begin Reservation
                <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform ml-2"></i>
              </button>
              
              <div className="pt-6 md:pt-8 border-t border-slate-200 flex justify-center">
                <button type="button" onClick={() => setView('admin')} className="text-[10px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-[0.25em] transition-colors">
                  Staff Entrance
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-4 md:space-y-5">
              <input type="email" placeholder="Staff Email" className="input-premium text-base" value={data.email} onChange={e => setData({...data, email: e.target.value})} required />
              <input type="password" placeholder="Access Key" className="input-premium text-base" value={data.password} onChange={e => setData({...data, password: e.target.value})} required />
              <button className="w-full btn-luxury py-4 md:py-5 uppercase tracking-widest">Verify Credentials</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest mt-4">
                Return to Guest Portal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default LoginGate;
