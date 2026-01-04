
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
    if (data.name && data.mobile) {
      onGuestLogin(data.name, data.mobile);
      navigate('/book');
    }
  };

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.email === 'admin@spraywaterpark.com' && data.password === 'admin123') {
      onAdminLogin(data.email);
      navigate('/admin');
    } else alert("Error");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade">
      <div className="w-full max-w-md bg-white p-12 rounded-[3rem] card-shadow">
        <h2 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter">
          {view === 'landing' ? 'Book Tickets' : 'Staff Access'}
        </h2>
        {view === 'landing' ? (
          <form onSubmit={handleGuest} className="space-y-6">
            <input placeholder="Name" className="input-field" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
            <input placeholder="Mobile" className="input-field" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} />
            <button className="w-full btn-primary py-5">Book Now</button>
            <button type="button" onClick={() => setView('admin')} className="w-full text-[10px] font-black text-gray-400 mt-4 uppercase">Admin</button>
          </form>
        ) : (
          <form onSubmit={handleAdmin} className="space-y-6">
            <input placeholder="Admin Email" className="input-field" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
            <input type="password" placeholder="Password" className="input-field" value={data.password} onChange={e => setData({...data, password: e.target.value})} />
            <button className="w-full btn-primary py-5">Login</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] font-black text-gray-400 mt-4 uppercase">Back</button>
          </form>
        )}
      </div>
    </div>
  );
};
export default LoginGate;
