
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onGuestLogin: (n: string, m: string) => void;
  onAdminLogin: (e: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onGuestLogin, onAdminLogin }) => {
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
      alert("Invalid Credentials!");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center animate-fade px-4 relative overflow-hidden rounded-[3rem]">
      <div className="absolute inset-0 z-0 bg-blue-50/50"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-[3rem] card-shadow border border-white overflow-hidden relative z-10">
        
        {/* Left Side: WATER PARK HERO IMAGE */}
        <div className="hidden md:block relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1200" 
            alt="Spray Aqua Resort" 
            className="w-full h-full object-cover absolute inset-0 transition-transform duration-1000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B2559]/90 via-[#1B2559]/30 to-transparent flex flex-col justify-end p-12 text-white">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 backdrop-blur-md border border-white/30">
                <i className="fas fa-water"></i>
              </div>
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                Spray Aqua <br /> Resort
              </h1>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                   <i className="fas fa-utensils text-orange-400"></i>
                   <p className="text-xs font-bold uppercase tracking-wider">Morning: Free Chole Bhature</p>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                   <i className="fas fa-hamburger text-blue-300"></i>
                   <p className="text-xs font-bold uppercase tracking-wider">Evening: Free Buffet Dinner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-10 md:p-14 bg-white flex flex-col justify-center">
          <div className="text-center mb-10 md:text-left">
            <h2 className="text-3xl font-black text-[#1B2559] uppercase tracking-tight">
              {view === 'landing' ? 'Book Tickets' : 'Staff Login'}
            </h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">
              {view === 'landing' ? 'Get up to 20% Early Bird Discount' : 'Secure Admin Access'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Your Name</label>
                <input type="text" placeholder="Rahul Sharma" className="input-field" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Mobile Number</label>
                <input type="tel" placeholder="10-digit number" className="input-field" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} required />
              </div>
              <button className="w-full btn-primary py-5 text-lg shadow-xl shadow-blue-100">
                Proceed to Booking <i className="fas fa-arrow-right ml-2"></i>
              </button>
              <button type="button" onClick={() => setView('admin')} className="w-full text-gray-300 text-[10px] font-black uppercase mt-8 hover:text-blue-600 transition-colors">
                Admin Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email</label>
                <input type="email" placeholder="admin@spraywaterpark.com" className="input-field" value={data.email} onChange={e => setData({...data, email: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Password</label>
                <input type="password" placeholder="••••••••" className="input-field" value={data.password} onChange={e => setData({...data, password: e.target.value})} required />
              </div>
              <button className="w-full btn-primary py-5">Verify Login</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-gray-300 text-[10px] font-black uppercase mt-8 hover:text-blue-600 transition-colors">
                Back to Guest Portal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
