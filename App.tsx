import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginGate from './pages/login_gate';
import BookingGate from './pages/booking_gate';
import AdminPortal from './pages/admin_portal';
import SecurePayment from './pages/secure_payment';
import TicketHistory from './pages/ticket_history';
import { AuthState, Booking, AdminSettings } from './types';
import { DEFAULT_ADMIN_SETTINGS } from './constants';

const AppContent: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('swp_auth');
    return saved ? JSON.parse(saved) : { role: null, user: null };
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swp_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('swp_settings');
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN_SETTINGS;
  });

  const location = useLocation();

  useEffect(() => { localStorage.setItem('swp_auth', JSON.stringify(auth)); }, [auth]);
  useEffect(() => { localStorage.setItem('swp_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swp_settings', JSON.stringify(settings)); }, [settings]);

  const loginAsGuest = (name: string, mobile: string) => setAuth({ role: 'guest', user: { name, mobile } });
  const loginAsAdmin = (email: string) => setAuth({ role: 'admin', user: { email } });
  const logout = () => { setAuth({ role: null, user: null }); sessionStorage.clear(); };
  const addBooking = (booking: Booking) => setBookings(prev => [booking, ...prev]);
  const updateSettings = (newSettings: AdminSettings) => setSettings(newSettings);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-100 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 blue-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fas fa-water text-sm md:text-base"></i>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-[#1B2559] tracking-tight leading-none uppercase">SPRAY AQUA</h1>
              <p className="text-[8px] md:text-[9px] font-bold text-blue-500 tracking-widest uppercase mt-0.5">Resort</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
            {auth.role === 'guest' && (
              <nav className="flex items-center gap-1">
                <Link to="/book" className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${location.pathname === '/book' ? 'text-blue-600' : 'text-slate-400'}`}>Book</Link>
                <Link to="/my-bookings" className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${location.pathname === '/my-bookings' ? 'text-blue-600' : 'text-slate-400'}`}>Tickets</Link>
              </nav>
            )}
            
            {auth.role && (
              <button onClick={logout} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                <i className="fas fa-sign-out-alt md:hidden text-base"></i>
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 md:py-12">
        <Routes>
          <Route path="/" element={auth.role === 'admin' ? <Navigate to="/admin" /> : auth.role === 'guest' ? <Navigate to="/book" /> : <LoginGate onGuestLogin={loginAsGuest} onAdminLogin={loginAsAdmin} />} />
          <Route path="/book" element={auth.role === 'guest' ? <BookingGate settings={settings} bookings={bookings} onProceed={(b: any) => b} /> : <Navigate to="/" />} />
          <Route path="/payment" element={auth.role === 'guest' ? <SecurePayment addBooking={addBooking} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={auth.role === 'guest' ? <TicketHistory bookings={bookings} mobile={auth.user?.mobile || ''} /> : <Navigate to="/" />} />
          <Route path="/admin" element={auth.role === 'admin' ? <AdminPortal bookings={bookings} settings={settings} onUpdateSettings={updateSettings} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="py-8 md:py-12 bg-white border-t border-slate-100 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Spray Aqua Resort</h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1">Jagatpura, Jaipur, Rajasthan</p>
          </div>
          <div className="flex gap-6 text-slate-300 text-xl">
            <i className="fab fa-instagram hover:text-pink-500 cursor-pointer"></i>
            <i className="fab fa-facebook hover:text-blue-600 cursor-pointer"></i>
            <i className="fab fa-whatsapp hover:text-green-500 cursor-pointer"></i>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2024 Spray Aqua Resort</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><AppContent /></HashRouter>);
export default App;
