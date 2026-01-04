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
      alert("Invalid Staff Credentials!");
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] overflow-hidden card-shadow border border-white">
        
        {/* Visual Hero - Modern & Responsive */}
        <div className="relative h-64 lg:h-auto overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=1200" 
            alt="Water Park" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0066FF]/90 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">Spray Aqua Resort</h1>
            <p className="text-blue-100 font-bold uppercase text-[10px] tracking-widest">Premium Splash Experience</p>
          </div>
        </div>

        {/* Login/Entry Form */}
        <div className="p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-[#1B2559] uppercase tracking-tight">
              {view === 'landing' ? 'Welcome Guest' : 'Staff Access'}
            </h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">
              {view === 'landing' ? 'Book now for up to 20% discount' : 'Authorized Personnel Only'}
            </p>
          </div>

          {view === 'landing' ? (
            <form onSubmit={handleGuest} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
                <input type="text" placeholder="Enter your name" className="input-field" value={data.name} onChange={e => setData({...data, name: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Mobile Number</label>
                <input type="tel" placeholder="10-digit number" className="input-field" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} required />
              </div>
              <button className="w-full btn-primary py-5 text-lg shadow-xl shadow-blue-100 mt-4">
                Start Booking <i className="fas fa-arrow-right ml-2"></i>
              </button>
              
              <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                <button type="button" onClick={() => setView('admin')} className="text-gray-300 text-[10px] font-black uppercase hover:text-blue-600 transition-colors">
                  Administration Portal
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdmin} className="space-y-5">
              <input type="email" placeholder="Staff Email" className="input-field" value={data.email} onChange={e => setData({...data, email: e.target.value})} required />
              <input type="password" placeholder="Staff Password" className="input-field" value={data.password} onChange={e => setData({...data, password: e.target.value})} required />
              <button className="w-full btn-primary py-5">Verify Identity</button>
              <button type="button" onClick={() => setView('landing')} className="w-full text-gray-300 text-[10px] font-black uppercase mt-6">
                Back to Guest Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default LoginGate;
