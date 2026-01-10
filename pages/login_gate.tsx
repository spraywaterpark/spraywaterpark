import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN_HERO_IMAGE = "/hero.webp";

interface LoginPageProps {
  onGuestLogin: (n: string, m: string) => void;
  onAdminLogin: (e: string) => void;
}

const LoginGate: React.FC<LoginPageProps> = ({ onGuestLogin, onAdminLogin }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'landing' | 'admin'>('landing');
  const [data, setData] = useState({ name: '', mobile: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', mobile: '' });

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || data.mobile.length !== 10) {
      alert("Please enter valid name & 10-digit mobile number");
      return;
    }
    onGuestLogin(data.name, data.mobile);
    navigate('/book');
  };

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.email === 'admin@spraywaterpark.com' && data.password === 'admin123') {
      onAdminLogin(data.email);
      navigate('/admin');
    } else {
      alert("Invalid admin credentials");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-5xl glass-card rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row">

        {/* LEFT IMAGE */}
        <div className="w-full md:w-5/12 h-64 md:h-full relative">
          <img
            src={LOGIN_HERO_IMAGE}
            alt="Spray Water Park"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-10">
            <h1 className="text-3xl font-black text-white uppercase">Spray Aqua Resort</h1>
            <p className="text-white/60 text-xs uppercase tracking-widest">Premium Water Destination</p>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="w-full md:w-7/12 p-10 md:p-16 flex flex-col justify-center">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-2">
            {view === 'landing' ? 'Guest Login' : 'Admin Login'}
          </h2>

          <p className="text-center text-slate-500 text-xs uppercase tracking-widest mb-10">
            {view === 'landing' ? 'Book Your Tickets' : 'Management Portal'}
          </p>

          <form onSubmit={view === 'landing' ? handleGuest : handleAdmin} className="space-y-6">

            {view === 'landing' ? (
              <>
                <input
                  className="input-premium"
                  placeholder="Full Name"
                  value={data.name}
                  onChange={e => setData({ ...data, name: e.target.value })}
                />
                <input
                  className="input-premium"
                  placeholder="Mobile Number"
                  maxLength={10}
                  value={data.mobile}
                  onChange={e => setData({ ...data, mobile: e.target.value })}
                />
              </>
            ) : (
              <>
                <input
                  className="input-premium"
                  placeholder="Admin Email"
                  value={data.email}
                  onChange={e => setData({ ...data, email: e.target.value })}
                />
                <input
                  className="input-premium"
                  type="password"
                  placeholder="Password"
                  value={data.password}
                  onChange={e => setData({ ...data, password: e.target.value })}
                />
              </>
            )}

            <button className="btn-resort w-full h-14">
              {view === 'landing' ? 'Proceed to Booking' : 'Admin Login'}
            </button>

            <button
              type="button"
              className="text-xs uppercase tracking-widest text-slate-500 w-full text-center mt-4"
              onClick={() => setView(view === 'landing' ? 'admin' : 'landing')}
            >
              {view === 'landing' ? 'Management Access' : 'Back to Guest Login'}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginGate;
